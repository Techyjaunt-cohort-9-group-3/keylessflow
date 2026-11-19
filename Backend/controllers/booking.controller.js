const Booking = require('../models/booking.model');
const Room = require('../models/room.model');
const Payment = require('../models/payment.model');
const CheckIn = require('../models/checkIn.model');
const AccessToken = require('../models/accessToken.model');
const ApiError = require('../utils/ApiError');
const { booking: bookingConfig, frontendUrl } = require('../config/env');
const { parseStay, parseDateOnly } = require('../utils/dates');
const { requireFields, assertObjectId, parsePagination, paginationMeta } = require('../utils/validation');
const { createWithReference } = require('../utils/references');
const { findBlockingBookings } = require('../services/availability.service');
const { findBookingForUser, bookingSummary, normaliseReference } = require('../services/booking.service');
const { isStaff } = require('../middlewares/auth');

const EMAIL = /^\S+@\S+\.\S+$/;

function resolveGuestDetails(input, guest) {
  const details = {
    firstName: (input && input.firstName) || guest.firstName,
    lastName: (input && input.lastName) || guest.lastName,
    email: ((input && input.email) || guest.email).toLowerCase(),
    phone: (input && input.phone) || guest.phone,
  };
  if (!EMAIL.test(details.email)) {
    throw ApiError.badRequest('Validation failed', [{ field: 'guestDetails.email', message: 'Email is invalid' }]);
  }
  return details;
}

// POST /bookings
async function createBooking(req, res) {
  requireFields(req.body, ['roomId', 'checkInDate', 'checkOutDate']);
  assertObjectId(req.body.roomId, 'roomId');
  const { checkIn, checkOut, nights } = parseStay(req.body.checkInDate, req.body.checkOutDate, bookingConfig.maxNights);

  const numberOfGuests = req.body.numberOfGuests === undefined ? 1 : Number(req.body.numberOfGuests);
  if (!Number.isInteger(numberOfGuests) || numberOfGuests < 1) {
    throw ApiError.badRequest('numberOfGuests must be a whole number of at least 1');
  }

  const room = await Room.findOne({ _id: req.body.roomId, isActive: true });
  if (!room) throw ApiError.notFound('Room not found');
  if (numberOfGuests > room.capacity) {
    throw ApiError.badRequest(`This room fits at most ${room.capacity} guest(s)`);
  }

  const guest = req.user.doc;
  const now = new Date();

  // Same guest submitting the same booking twice: return the open one
  const existing = await Booking.findOne({
    guest: guest._id,
    room: room._id,
    checkInDate: checkIn,
    checkOutDate: checkOut,
    status: 'pending_payment',
    holdExpiresAt: { $gt: now },
  });
  if (existing) {
    return res.json({ success: true, duplicate: true, message: 'You already have an open booking for this room and dates', data: existing });
  }

  const blocking = await findBlockingBookings(room._id, checkIn, checkOut);
  if (blocking.length) throw ApiError.conflict('This room is not available for the selected dates');

  const booking = await createWithReference(Booking, 'booking', {
    guest: guest._id,
    room: room._id,
    roomSnapshot: { roomNumber: room.roomNumber, name: room.name, type: room.type, pricePerNight: room.pricePerNight },
    guestDetails: resolveGuestDetails(req.body.guestDetails, guest),
    checkInDate: checkIn,
    checkOutDate: checkOut,
    nights,
    numberOfGuests,
    specialRequests: req.body.specialRequests,
    amount: room.pricePerNight * nights,
    currency: bookingConfig.currency,
    holdExpiresAt: new Date(now.getTime() + bookingConfig.holdMinutes * 60 * 1000),
  });

  // Two requests can pass the availability check at the same moment. After
  // inserting, re-check: if another guest's booking now overlaps, back off.
  const competitors = await findBlockingBookings(room._id, checkIn, checkOut, booking._id);
  if (competitors.length) {
    const otherGuest = competitors.some((c) => String(c.guest) !== String(guest._id));
    const earlierOwn = competitors.find((c) => String(c._id) < String(booking._id));
    if (otherGuest || earlierOwn) {
      await booking.deleteOne();
      if (otherGuest) throw ApiError.conflict('This room was just booked by another guest. Please choose another room');
      const original = await Booking.findById(earlierOwn._id);
      return res.json({ success: true, duplicate: true, message: 'You already have an open booking for this room and dates', data: original });
    }
  }

  res.status(201).json({
    success: true,
    message: `Booking created. Complete payment within ${bookingConfig.holdMinutes} minutes to confirm it`,
    data: booking,
  });
}

// GET /bookings?status=&paymentStatus=&from=&to=&page=&limit=
async function listBookings(req, res) {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = {};

  if (isStaff(req.user)) {
    if (req.query.guestId) {
      assertObjectId(req.query.guestId, 'guestId');
      filter.guest = req.query.guestId;
    }
    if (req.query.reference) filter.reference = normaliseReference(req.query.reference);
    if (req.query.roomNumber) filter['roomSnapshot.roomNumber'] = String(req.query.roomNumber);
  } else {
    filter.guest = req.user.id;
  }
  if (req.query.status) filter.status = String(req.query.status);
  if (req.query.paymentStatus) filter.paymentStatus = String(req.query.paymentStatus);
  // from/to filter stays that overlap the given window
  if (req.query.from) filter.checkOutDate = { $gt: parseDateOnly(String(req.query.from), 'from') };
  if (req.query.to) filter.checkInDate = { $lt: parseDateOnly(String(req.query.to), 'to') };

  const [bookings, total] = await Promise.all([
    Booking.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Booking.countDocuments(filter),
  ]);
  res.json({ success: true, data: bookings, pagination: paginationMeta(page, limit, total) });
}

// GET /bookings/:reference  (also used by Squad B to fetch a reservation)
async function getBooking(req, res) {
  const booking = await findBookingForUser(req.params.reference, req.user);
  const [latestPayment, checkIn] = await Promise.all([
    Payment.findOne({ booking: booking._id }).sort({ createdAt: -1 }).select('reference status amount currency paidAt channel'),
    CheckIn.findOne({ booking: booking._id }).select('status verification.attempts completedAt'),
  ]);

  res.json({
    success: true,
    data: {
      ...booking.toJSON(),
      latestPayment,
      checkIn: checkIn ? { status: checkIn.status, completedAt: checkIn.completedAt } : null,
    },
  });
}

// GET /bookings/:reference/confirmation
async function getConfirmation(req, res) {
  const booking = await findBookingForUser(req.params.reference, req.user);
  const confirmed = ['confirmed', 'checked_in', 'checked_out'].includes(booking.status) && booking.paymentStatus === 'paid';
  if (!confirmed) {
    throw ApiError.conflict('This booking is not confirmed yet', {
      status: booking.status,
      paymentStatus: booking.paymentStatus,
    });
  }

  const payment = await Payment.findById(booking.payment).select('reference amount currency paidAt channel');
  res.json({
    success: true,
    message: 'Your booking is confirmed',
    data: {
      ...bookingSummary(booking),
      confirmedAt: booking.confirmedAt,
      payment,
      checkInLink: `${frontendUrl}/check-in/${booking.reference}`,
    },
  });
}

// POST /bookings/:reference/cancel  (unpaid bookings only for the MVP)
async function cancelBooking(req, res) {
  const booking = await findBookingForUser(req.params.reference, req.user);
  if (booking.status !== 'pending_payment' || booking.paymentStatus === 'paid') {
    throw ApiError.conflict('Only unpaid bookings can be cancelled. Please contact the front desk for paid bookings');
  }

  booking.status = 'cancelled';
  booking.cancelledAt = new Date();
  booking.cancellationReason = (req.body && req.body.reason) || 'Cancelled by guest';
  booking.holdExpiresAt = undefined;
  await booking.save();
  res.json({ success: true, message: 'Booking cancelled', data: booking });
}

// POST /bookings/:reference/check-out  (staff)
async function checkOutBooking(req, res) {
  const booking = await findBookingForUser(req.params.reference, req.user);
  if (booking.status !== 'checked_in') throw ApiError.conflict('Only checked-in bookings can be checked out');

  booking.status = 'checked_out';
  booking.checkedOutAt = new Date();
  await booking.save();
  await AccessToken.updateMany(
    { booking: booking._id, status: 'active' },
    { $set: { status: 'revoked', revokedAt: new Date(), revokedReason: 'checked_out' } },
  );
  res.json({ success: true, message: 'Guest checked out and room keys revoked', data: booking });
}

module.exports = { createBooking, listBookings, getBooking, getConfirmation, cancelBooking, checkOutBooking };
