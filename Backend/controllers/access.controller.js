const crypto = require('crypto');
const AccessToken = require('../models/accessToken.model');
const AccessLog = require('../models/accessLog.model');
const Booking = require('../models/booking.model');
const CheckIn = require('../models/checkIn.model');
const ApiError = require('../utils/ApiError');
const { requireFields, assertObjectId, parsePagination, paginationMeta } = require('../utils/validation');
const { findBookingForUser, checkoutTime, normaliseReference } = require('../services/booking.service');
const { notify } = require('../services/notification.service');
const { isStaff } = require('../middlewares/auth');

const sha256 = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');

function tokenView(token) {
  const json = token.toJSON();
  delete json.tokenHash;
  // Report expiry even if the stored status has not been updated yet
  if (json.status === 'active' && token.validUntil <= new Date()) json.status = 'expired';
  return json;
}

// POST /access/tokens   { bookingReference }
async function generateToken(req, res) {
  requireFields(req.body, ['bookingReference']);
  const booking = await findBookingForUser(req.body.bookingReference, req.user);

  const checkIn = await CheckIn.findOne({ booking: booking._id }).select('status');
  if (!checkIn || checkIn.status !== 'verified') {
    throw ApiError.forbidden('Identity verification must be completed before a room key can be issued');
  }
  if (booking.status !== 'checked_in') throw ApiError.conflict('Room keys can only be issued to checked-in bookings');

  const now = new Date();
  const validUntil = checkoutTime(booking);
  if (now >= validUntil) throw ApiError.conflict('This stay has ended');

  // Only one active key per booking: issuing a new one revokes the old one
  await AccessToken.updateMany(
    { booking: booking._id, status: 'active' },
    { $set: { status: 'revoked', revokedAt: now, revokedReason: 'reissued' } },
  );

  const rawToken = `kf_${crypto.randomBytes(24).toString('base64url')}`;
  const token = await AccessToken.create({
    tokenHash: sha256(rawToken),
    tokenHint: rawToken.slice(-4),
    booking: booking._id,
    bookingReference: booking.reference,
    guest: booking.guest,
    room: booking.room,
    roomNumber: booking.roomSnapshot.roomNumber,
    validFrom: now,
    validUntil,
  });

  await notify(booking.guest, {
    type: 'access_key_issued',
    title: 'Your digital room key is ready',
    message: `Your key for room ${token.roomNumber} is valid until ${validUntil.toISOString()}.`,
    data: { bookingReference: booking.reference, tokenId: String(token._id) },
  });

  res.status(201).json({
    success: true,
    message: 'Room key issued. The token is shown only once: store it on the device',
    data: { ...tokenView(token), accessToken: rawToken },
  });
}

// GET /access/tokens?bookingReference=
async function listTokens(req, res) {
  const filter = {};
  if (req.query.bookingReference) {
    const booking = await findBookingForUser(req.query.bookingReference, req.user);
    filter.booking = booking._id;
  } else if (!isStaff(req.user)) {
    filter.guest = req.user.id;
  }
  const tokens = await AccessToken.find(filter).sort({ createdAt: -1 }).limit(100);
  res.json({ success: true, data: tokens.map(tokenView) });
}

// POST /access/tokens/:tokenId/revoke
async function revokeToken(req, res) {
  assertObjectId(req.params.tokenId, 'tokenId');
  const token = await AccessToken.findById(req.params.tokenId);
  if (!token || (!isStaff(req.user) && String(token.guest) !== String(req.user.id))) {
    throw ApiError.notFound('Access token not found');
  }
  if (token.status !== 'active') throw ApiError.conflict(`Token is already ${token.status}`);

  token.status = 'revoked';
  token.revokedAt = new Date();
  token.revokedReason = (req.body && req.body.reason) || (isStaff(req.user) ? 'revoked_by_staff' : 'revoked_by_guest');
  await token.save();
  res.json({ success: true, message: 'Room key revoked', data: tokenView(token) });
}

// GET /access/logs?bookingReference=&roomNumber=&result=
async function listAccessLogs(req, res) {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = {};
  if (req.query.bookingReference) {
    const booking = await findBookingForUser(req.query.bookingReference, req.user);
    filter.booking = booking._id;
  } else if (!isStaff(req.user)) {
    const ownBookings = await Booking.find({ guest: req.user.id }).distinct('_id');
    filter.booking = { $in: ownBookings };
  }
  if (isStaff(req.user) && req.query.roomNumber) filter.roomNumber = String(req.query.roomNumber);
  if (req.query.result) filter.result = String(req.query.result);

  const [logs, total] = await Promise.all([
    AccessLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    AccessLog.countDocuments(filter),
  ]);
  res.json({ success: true, data: logs, pagination: paginationMeta(page, limit, total) });
}

// POST /lock/validate   { token, roomNumber }  -- the simulated door lock
async function validateAtLock(req, res) {
  requireFields(req.body, ['token', 'roomNumber']);
  const roomNumber = String(req.body.roomNumber).trim();
  const now = new Date();
  const token = await AccessToken.findOne({ tokenHash: sha256(String(req.body.token).trim()) });

  const log = (result, reason) =>
    AccessLog.create({
      accessToken: token && token._id,
      booking: token && token.booking,
      bookingReference: token && token.bookingReference,
      roomNumber,
      result,
      reason,
      ip: req.ip,
    });

  const deny = async (reason, message) => {
    await log('denied', reason);
    res.status(403).json({ success: false, message, data: { accessGranted: false, reason, roomNumber } });
  };

  if (!token) return deny('invalid_token', 'Invalid key');
  if (token.status === 'revoked') return deny('token_revoked', 'This key has been revoked');
  if (token.status === 'expired' || now > token.validUntil) {
    if (token.status === 'active') await AccessToken.updateOne({ _id: token._id }, { $set: { status: 'expired' } });
    return deny('token_expired', 'This key has expired');
  }
  if (now < token.validFrom) return deny('not_yet_valid', 'This key is not valid yet');
  if (token.roomNumber !== roomNumber) return deny('wrong_room', 'This key does not open this room');

  const booking = await Booking.findById(token.booking).select('status');
  if (!booking || booking.status !== 'checked_in') return deny('booking_not_active', 'This stay is not active');

  await AccessToken.updateOne({ _id: token._id }, { $set: { lastUsedAt: now }, $inc: { useCount: 1 } });
  await log('granted', 'valid_token');
  res.json({
    success: true,
    message: 'Door unlocked',
    data: { accessGranted: true, roomNumber, bookingReference: normaliseReference(token.bookingReference), validUntil: token.validUntil },
  });
}

module.exports = { generateToken, listTokens, revokeToken, listAccessLogs, validateAtLock };
