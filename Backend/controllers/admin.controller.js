const ApiError = require('../utils/ApiError');
const { findAbandonedBookings, sendAbandonmentNudges, expireStaleHolds } = require('../jobs/booking.jobs');

function parseMinutes(value) {
  if (value === undefined) return undefined;
  const minutes = Number(value);
  if (!Number.isFinite(minutes) || minutes < 0) throw ApiError.badRequest('olderThanMinutes must be 0 or more');
  return minutes;
}

// GET /admin/abandoned-bookings?olderThanMinutes=
async function listAbandoned(req, res) {
  await expireStaleHolds();
  const abandoned = await findAbandonedBookings(parseMinutes(req.query.olderThanMinutes));
  res.json({
    success: true,
    data: abandoned.map(({ booking }) => ({
      reference: booking.reference,
      guest: booking.guest,
      guestDetails: booking.guestDetails,
      room: booking.roomSnapshot,
      checkInDate: booking.checkInDate,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      createdAt: booking.createdAt,
    })),
  });
}

// POST /admin/abandoned-bookings/nudge?olderThanMinutes=
async function nudgeAbandoned(req, res) {
  await expireStaleHolds();
  const result = await sendAbandonmentNudges(parseMinutes(req.query.olderThanMinutes));
  res.json({ success: true, message: `Sent ${result.sent} reminder(s)`, data: result });
}

module.exports = { listAbandoned, nudgeAbandoned };
