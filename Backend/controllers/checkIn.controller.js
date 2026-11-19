const CheckIn = require('../models/checkIn.model');
const ApiError = require('../utils/ApiError');
const { checkIn: checkInConfig, frontendUrl } = require('../config/env');
const { requireFields, pick, parsePagination, paginationMeta } = require('../utils/validation');
const { findBookingForUser, bookingSummary, checkoutTime } = require('../services/booking.service');
const identity = require('../services/identityVerification.service');
const { notify } = require('../services/notification.service');

const HOUR_MS = 60 * 60 * 1000;
const TIME_HH_MM = /^([01]\d|2[0-3]):[0-5]\d$/;

// Returns { eligible, reason?, opensAt }
function checkEligibility(booking, now = new Date()) {
  const opensAt = new Date(booking.checkInDate.getTime() - checkInConfig.windowHours * HOUR_MS);
  if (booking.status === 'checked_in') return { eligible: false, reason: 'Already checked in', opensAt };
  if (booking.status !== 'confirmed' || booking.paymentStatus !== 'paid') {
    return { eligible: false, reason: 'Only confirmed, paid bookings can be checked in', opensAt };
  }
  if (now < opensAt) {
    return { eligible: false, reason: `Online check-in opens ${checkInConfig.windowHours} hours before arrival`, opensAt };
  }
  if (now >= checkoutTime(booking)) return { eligible: false, reason: 'This stay has already ended', opensAt };
  return { eligible: true, opensAt };
}

function assertEligible(booking) {
  const result = checkEligibility(booking);
  if (!result.eligible) throw ApiError.conflict(result.reason, { opensAt: result.opensAt });
}

async function loadCheckIn(booking) {
  const checkIn = await CheckIn.findOne({ booking: booking._id });
  if (!checkIn) throw ApiError.notFound('Check-in has not been started for this booking');
  return checkIn;
}

function checkInView(checkIn) {
  const json = checkIn.toJSON();
  if (json.identity) delete json.identity.idNumberHash;
  json.attemptsRemaining = Math.max(checkInConfig.maxVerificationAttempts - (checkIn.verification.attempts || 0), 0);
  return json;
}

async function completeCheckIn(checkIn, booking) {
  checkIn.status = 'verified';
  checkIn.verification.verifiedAt = new Date();
  checkIn.verification.failureReason = undefined;
  checkIn.completedAt = new Date();
  booking.status = 'checked_in';
  booking.checkedInAt = new Date();
  await Promise.all([checkIn.save(), booking.save()]);
  await notify(booking.guest, {
    type: 'checkin_completed',
    title: 'Check-in complete',
    message: `You're checked in to room ${booking.roomSnapshot.roomNumber}. Your digital key is ready to generate.`,
    link: `${frontendUrl}/bookings/${booking.reference}/key`,
    data: { bookingReference: booking.reference },
  });
}

// POST /check-in   { bookingReference }
async function initiateCheckIn(req, res) {
  requireFields(req.body, ['bookingReference']);
  const booking = await findBookingForUser(req.body.bookingReference, req.user);

  let checkIn = await CheckIn.findOne({ booking: booking._id });
  if (checkIn) {
    return res.json({ success: true, message: 'Check-in already started', data: { checkIn: checkInView(checkIn), booking: bookingSummary(booking) } });
  }

  assertEligible(booking);
  try {
    checkIn = await CheckIn.create({ booking: booking._id, bookingReference: booking.reference, guest: booking.guest });
  } catch (err) {
    if (err.code !== 11000) throw err;
    checkIn = await CheckIn.findOne({ booking: booking._id });
  }

  res.status(201).json({
    success: true,
    message: 'Check-in started. Confirm your details, then verify your identity',
    data: { checkIn: checkInView(checkIn), booking: bookingSummary(booking) },
  });
}

// GET /check-in/:bookingReference
async function getCheckIn(req, res) {
  const booking = await findBookingForUser(req.params.bookingReference, req.user);
  const checkIn = await CheckIn.findOne({ booking: booking._id });
  res.json({
    success: true,
    data: {
      checkIn: checkIn ? checkInView(checkIn) : null,
      eligibility: checkEligibility(booking),
      booking: bookingSummary(booking),
    },
  });
}

// PATCH /check-in/:bookingReference/details
async function submitDetails(req, res) {
  const booking = await findBookingForUser(req.params.bookingReference, req.user);
  const checkIn = await loadCheckIn(booking);
  if (checkIn.status === 'verified') throw ApiError.conflict('Check-in is already complete');
  assertEligible(booking);

  requireFields(req.body, ['estimatedArrivalTime']);
  if (!TIME_HH_MM.test(String(req.body.estimatedArrivalTime))) {
    throw ApiError.badRequest('estimatedArrivalTime must be in 24-hour HH:mm format, e.g. 14:30');
  }
  if (req.body.numberOfGuests !== undefined) {
    const n = Number(req.body.numberOfGuests);
    if (!Number.isInteger(n) || n < 1) throw ApiError.badRequest('numberOfGuests must be a whole number of at least 1');
  }

  checkIn.details = {
    ...pick(req.body, ['estimatedArrivalTime', 'phone', 'numberOfGuests', 'purposeOfVisit', 'address', 'specialRequests']),
    submittedAt: new Date(),
  };
  if (checkIn.status === 'initiated') checkIn.status = 'details_submitted';
  await checkIn.save();

  res.json({ success: true, message: 'Details saved. Next, verify your identity', data: checkInView(checkIn) });
}

// POST /check-in/:bookingReference/verify-identity
async function verifyIdentity(req, res) {
  const booking = await findBookingForUser(req.params.bookingReference, req.user);
  const checkIn = await loadCheckIn(booking);
  if (checkIn.status === 'verified') {
    return res.json({ success: true, message: 'Identity already verified', data: checkInView(checkIn) });
  }
  assertEligible(booking);

  const max = checkInConfig.maxVerificationAttempts;
  if (checkIn.verification.attempts >= max) {
    throw ApiError.forbidden('Maximum verification attempts reached. Please visit the front desk to complete check-in');
  }

  requireFields(req.body, ['idType', 'idNumber', 'nameOnId']);
  const formatProblem = identity.formatError(req.body.idType, req.body.idNumber);
  if (formatProblem) throw ApiError.badRequest(formatProblem);

  const idNumber = String(req.body.idNumber).trim().toUpperCase();
  checkIn.identity = {
    idType: req.body.idType,
    idNumberLast4: idNumber.slice(-4),
    idNumberHash: identity.hashIdNumber(idNumber),
    nameOnId: String(req.body.nameOnId).trim(),
    nationality: req.body.nationality,
  };
  checkIn.verification.method = 'simulated';
  checkIn.verification.attempts += 1;
  checkIn.verification.lastAttemptAt = new Date();

  const result = identity.verify({ idNumber, nameOnId: req.body.nameOnId }, booking);
  if (result.verified) {
    await completeCheckIn(checkIn, booking);
    return res.json({ success: true, message: 'Identity verified. Check-in complete', data: checkInView(checkIn) });
  }

  checkIn.status = 'verification_failed';
  checkIn.verification.failureReason = result.reason;
  await checkIn.save();
  const view = checkInView(checkIn);
  res.status(422).json({
    success: false,
    message: result.reason,
    data: { verified: false, attemptsRemaining: view.attemptsRemaining, checkIn: view },
  });
}

// POST /check-in/:bookingReference/verification  (staff records a manual result)
async function recordVerification(req, res) {
  const booking = await findBookingForUser(req.params.bookingReference, req.user);
  const checkIn = await loadCheckIn(booking);
  if (typeof req.body.approved !== 'boolean') throw ApiError.badRequest('approved must be true or false');
  if (checkIn.status === 'verified') throw ApiError.conflict('Identity already verified');

  checkIn.verification.method = 'manual';
  checkIn.verification.reviewedBy = req.user.id;
  checkIn.verification.lastAttemptAt = new Date();

  if (req.body.approved) {
    assertEligible(booking);
    await completeCheckIn(checkIn, booking);
  } else {
    checkIn.status = 'verification_failed';
    checkIn.verification.failureReason = req.body.note || 'Rejected by staff';
    await checkIn.save();
  }
  res.json({ success: true, message: req.body.approved ? 'Guest verified' : 'Verification rejected', data: checkInView(checkIn) });
}

// GET /check-in?status=  (staff)
async function listCheckIns(req, res) {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = req.query.status ? { status: String(req.query.status) } : {};
  const [items, total] = await Promise.all([
    CheckIn.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit).populate('guest', 'firstName lastName email phone'),
    CheckIn.countDocuments(filter),
  ]);
  res.json({ success: true, data: items.map(checkInView), pagination: paginationMeta(page, limit, total) });
}

module.exports = { initiateCheckIn, getCheckIn, submitDetails, verifyIdentity, recordVerification, listCheckIns };
