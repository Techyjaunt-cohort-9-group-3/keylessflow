const Guest = require('../models/guest.model');
const ApiError = require('../utils/ApiError');

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/guests?page=1&limit=20&search=john
async function listGuests(req, res) {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';

  const filter = {};
  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ firstName: regex }, { lastName: regex }, { email: regex }, { phone: regex }];
  }

  const [guests, total] = await Promise.all([
    Guest.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Guest.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: guests,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

// GET /api/guests/:id
async function getGuest(req, res) {
  const guest = await Guest.findById(req.params.id);
  if (!guest) throw ApiError.notFound('Guest not found');
  res.json({ success: true, data: guest });
}

// POST /api/guests
async function createGuest(req, res) {
  const guest = await Guest.create(req.body);
  res.status(201).json({ success: true, data: guest });
}

// PATCH /api/guests/:id
async function updateGuest(req, res) {
  const guest = await Guest.findByIdAndUpdate(req.params.id, req.body, {
    returnDocument: 'after',
    runValidators: true,
  });
  if (!guest) throw ApiError.notFound('Guest not found');
  res.json({ success: true, data: guest });
}

// DELETE /api/guests/:id
async function deleteGuest(req, res) {
  const guest = await Guest.findByIdAndDelete(req.params.id);
  if (!guest) throw ApiError.notFound('Guest not found');
  res.status(204).end();
}

module.exports = { listGuests, getGuest, createGuest, updateGuest, deleteGuest };
