const Booking = require('../models/booking.model');
const { booking: bookingConfig, frontendUrl, jobs } = require('../config/env');
const { notify } = require('../services/notification.service');
const { startOfTodayUtc, toDateOnlyString } = require('../utils/dates');

// Unpaid bookings whose hold ran out free up the room
async function expireStaleHolds() {
  const result = await Booking.updateMany(
    { status: 'pending_payment', holdExpiresAt: { $lte: new Date() } },
    { $set: { status: 'expired' } },
  );
  return result.modifiedCount;
}

// Rule-based abandonment detection (PRD 6.1.E):
// unpaid, older than N minutes, not nudged yet, arrival date not passed,
// and the guest has not completed another booking since.
async function findAbandonedBookings(olderThanMinutes = bookingConfig.nudgeAfterMinutes) {
  const cutoff = new Date(Date.now() - olderThanMinutes * 60 * 1000);
  const candidates = await Booking.find({
    status: { $in: ['pending_payment', 'expired'] },
    paymentStatus: { $in: ['unpaid', 'failed'] },
    createdAt: { $lte: cutoff },
    checkInDate: { $gte: startOfTodayUtc() },
    nudgeSentAt: { $exists: false },
  })
    .sort({ createdAt: -1 })
    .limit(200);

  const results = [];
  const seenGuests = new Set();
  for (const booking of candidates) {
    const guestKey = String(booking.guest);
    const completedSince = await Booking.exists({
      guest: booking.guest,
      status: { $in: ['confirmed', 'checked_in', 'checked_out'] },
      createdAt: { $gte: booking.createdAt },
    });
    if (!completedSince) results.push({ booking, isLatestForGuest: !seenGuests.has(guestKey) });
    seenGuests.add(guestKey);
  }
  return results;
}

// Sends one reminder per guest (for their latest abandoned attempt)
async function sendAbandonmentNudges(olderThanMinutes) {
  const abandoned = await findAbandonedBookings(olderThanMinutes);
  let sent = 0;
  for (const { booking, isLatestForGuest } of abandoned) {
    if (isLatestForGuest) {
      await notify(booking.guest, {
        type: 'booking_reminder',
        title: 'Your room is waiting',
        message: `You didn't finish booking ${booking.roomSnapshot.name} for ${toDateOnlyString(booking.checkInDate)}. Complete your reservation before it's gone.`,
        link: `${frontendUrl}/booking/resume/${booking.reference}`,
        data: { bookingReference: booking.reference },
      });
      sent += 1;
    }
    booking.nudgeSentAt = new Date();
    await booking.save();
  }
  return { candidates: abandoned.length, sent };
}

async function runBookingJobs() {
  try {
    const expired = await expireStaleHolds();
    const nudges = await sendAbandonmentNudges();
    if (expired || nudges.sent) console.log(`[jobs] expired ${expired} hold(s), sent ${nudges.sent} reminder(s)`);
  } catch (err) {
    console.error(`[jobs] booking jobs failed: ${err.message}`);
  }
}

function startBookingJobs() {
  const timer = setInterval(runBookingJobs, jobs.intervalMinutes * 60 * 1000);
  timer.unref();
  return timer;
}

module.exports = { expireStaleHolds, findAbandonedBookings, sendAbandonmentNudges, runBookingJobs, startBookingJobs };
