const Booking = require('../models/booking.model');
const ApiError = require('../utils/ApiError');
const { isStaff } = require('../middlewares/auth');
const { hasConfirmedOverlap } = require('./availability.service');
const { notify } = require('./notification.service');
const { frontendUrl, access } = require('../config/env');
const { toDateOnlyString } = require('../utils/dates');

const normaliseReference = (ref) => String(ref || '').trim().toUpperCase();

// The moment a stay ends: check-out date at the configured hour (UTC)
const checkoutTime = (booking) => new Date(booking.checkOutDate.getTime() + access.checkoutHourUtc * 60 * 60 * 1000);

// Guests can only see their own bookings; staff can see all.
// Someone else's booking returns 404 so references cannot be probed.
async function findBookingForUser(reference, user) {
  const booking = await Booking.findOne({ reference: normaliseReference(reference) });
  if (!booking) throw ApiError.notFound('Booking not found');
  if (!isStaff(user) && String(booking.guest) !== String(user.id)) throw ApiError.notFound('Booking not found');
  return booking;
}

function bookingSummary(booking) {
  return {
    reference: booking.reference,
    status: booking.status,
    paymentStatus: booking.paymentStatus,
    room: booking.roomSnapshot,
    checkInDate: toDateOnlyString(booking.checkInDate),
    checkOutDate: toDateOnlyString(booking.checkOutDate),
    nights: booking.nights,
    numberOfGuests: booking.numberOfGuests,
    amount: booking.amount,
    currency: booking.currency,
    guestDetails: booking.guestDetails,
  };
}

// Called once a payment is verified as successful (by verify or webhook)
async function markBookingPaid(bookingId, paymentId) {
  const booking = await Booking.findById(bookingId);
  if (!booking || booking.paymentStatus === 'paid' || booking.paymentStatus === 'refund_required') return booking;

  booking.payment = paymentId;
  const awaitingPayment = ['pending_payment', 'expired'].includes(booking.status);
  const roomTaken =
    awaitingPayment && (await hasConfirmedOverlap(booking.room, booking.checkInDate, booking.checkOutDate, booking._id));

  if (awaitingPayment && !roomTaken) {
    booking.status = 'confirmed';
    booking.paymentStatus = 'paid';
    booking.confirmedAt = new Date();
    booking.holdExpiresAt = undefined;
    await booking.save();
    await notify(booking.guest, {
      type: 'booking_confirmed',
      title: 'Booking confirmed',
      message: `Your stay in ${booking.roomSnapshot.name} from ${toDateOnlyString(booking.checkInDate)} to ${toDateOnlyString(booking.checkOutDate)} is confirmed. Reference: ${booking.reference}`,
      link: `${frontendUrl}/bookings/${booking.reference}`,
      data: { bookingReference: booking.reference },
    });
    return booking;
  }

  // Payment arrived after the booking was cancelled, or after the hold expired
  // and someone else confirmed the room. Keep the money visible for a refund.
  booking.paymentStatus = 'refund_required';
  if (awaitingPayment) {
    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    booking.cancellationReason = 'Room became unavailable before payment completed';
  }
  await booking.save();
  await notify(booking.guest, {
    type: 'payment_failed',
    title: 'We could not complete your booking',
    message: `Your payment for ${booking.reference} was received but the booking could not be confirmed. Our team will refund you.`,
    data: { bookingReference: booking.reference },
  });
  return booking;
}

module.exports = { findBookingForUser, bookingSummary, markBookingPaid, normaliseReference, checkoutTime };
