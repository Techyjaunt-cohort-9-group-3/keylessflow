const Booking = require('../models/booking.model');

// Bookings that block a room: confirmed or occupied stays, plus unpaid
// bookings whose payment hold has not expired yet
function blockingStatusFilter(now = new Date()) {
  return {
    $or: [
      { status: { $in: ['confirmed', 'checked_in'] } },
      { status: 'pending_payment', holdExpiresAt: { $gt: now } },
    ],
  };
}

function overlapFilter(checkIn, checkOut) {
  return { checkInDate: { $lt: checkOut }, checkOutDate: { $gt: checkIn } };
}

async function unavailableRoomIds(checkIn, checkOut) {
  return Booking.distinct('room', { ...overlapFilter(checkIn, checkOut), ...blockingStatusFilter() });
}

async function findBlockingBookings(roomId, checkIn, checkOut, excludeBookingId) {
  return Booking.find({
    room: roomId,
    ...(excludeBookingId && { _id: { $ne: excludeBookingId } }),
    ...overlapFilter(checkIn, checkOut),
    ...blockingStatusFilter(),
  }).select('_id guest reference status');
}

// Only paid stays count when deciding whether a late payment can still be honoured
async function hasConfirmedOverlap(roomId, checkIn, checkOut, excludeBookingId) {
  const count = await Booking.countDocuments({
    room: roomId,
    _id: { $ne: excludeBookingId },
    ...overlapFilter(checkIn, checkOut),
    status: { $in: ['confirmed', 'checked_in'] },
  });
  return count > 0;
}

module.exports = { unavailableRoomIds, findBlockingBookings, hasConfirmedOverlap, overlapFilter };
