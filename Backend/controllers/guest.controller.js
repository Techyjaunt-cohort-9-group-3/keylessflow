const Guest = require('../models/guest.model');
const Booking = require('../models/booking.model');
const ApiError = require('../utils/ApiError');
const { assertObjectId, pick, parsePagination, paginationMeta, escapeRegex } = require('../utils/validation');

// Staff-facing guest management. Guests manage their own profile via /auth/me.

// GET /guests?page=1&limit=20&search=john
async function listGuests(req, res) {
  const { page, limit, skip } = parsePagination(req.query);
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';

  const filter = {};
  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ firstName: regex }, { lastName: regex }, { email: regex }, { phone: regex }];
  }

  const [guests, total] = await Promise.all([
    Guest.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Guest.countDocuments(filter),
  ]);

  res.json({ success: true, data: guests, pagination: paginationMeta(page, limit, total) });
}

// GET /guests/:id
async function getGuest(req, res) {
  assertObjectId(req.params.id);
  const guest = await Guest.findById(req.params.id);
  if (!guest) throw ApiError.notFound('Guest not found');

  const bookings = await Booking.find({ guest: guest._id })
    .sort({ createdAt: -1 })
    .limit(20)
    .select('reference status paymentStatus checkInDate checkOutDate roomSnapshot amount currency');

  res.json({ success: true, data: { ...guest.toJSON(), bookings } });
}

// PATCH /guests/:id
async function updateGuest(req, res) {
  assertObjectId(req.params.id);
  const guest = await Guest.findById(req.params.id);
  if (!guest) throw ApiError.notFound('Guest not found');

  guest.set(pick(req.body, ['firstName', 'lastName', 'phone', 'nationality', 'address', 'preferences', 'notes']));
  await guest.save();
  res.json({ success: true, data: guest });
}

// DELETE /guests/:id
async function deleteGuest(req, res) {
  assertObjectId(req.params.id);
  const activeStay = await Booking.exists({ guest: req.params.id, status: { $in: ['confirmed', 'checked_in'] } });
  if (activeStay) throw ApiError.conflict('Guest has an active booking and cannot be deleted');

  const guest = await Guest.findByIdAndDelete(req.params.id);
  if (!guest) throw ApiError.notFound('Guest not found');
  res.status(204).end();
}

module.exports = { listGuests, getGuest, updateGuest, deleteGuest };
