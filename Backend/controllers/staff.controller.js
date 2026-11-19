const Staff = require('../models/staff.model');
const ApiError = require('../utils/ApiError');
const { requireFields, pick, assertObjectId } = require('../utils/validation');
const { assertStrongPassword, normaliseEmail } = require('./auth.controller');

// GET /staff
async function listStaff(req, res) {
  const staff = await Staff.find().sort({ createdAt: -1 });
  res.json({ success: true, data: staff });
}

// POST /staff
async function createStaff(req, res) {
  requireFields(req.body, ['firstName', 'lastName', 'email', 'password']);
  assertStrongPassword(req.body.password);

  const email = normaliseEmail(req.body.email);
  if (await Staff.exists({ email })) throw ApiError.conflict('A staff account with this email already exists');

  const staff = await Staff.create({
    ...pick(req.body, ['firstName', 'lastName', 'password', 'role', 'department']),
    email,
  });
  res.status(201).json({ success: true, data: staff });
}

// PATCH /staff/:id
async function updateStaff(req, res) {
  assertObjectId(req.params.id);
  const staff = await Staff.findById(req.params.id);
  if (!staff) throw ApiError.notFound('Staff member not found');
  if (String(staff._id) === String(req.user.id) && req.body.isActive === false) {
    throw ApiError.badRequest('You cannot disable your own account');
  }

  staff.set(pick(req.body, ['firstName', 'lastName', 'role', 'department', 'isActive']));
  await staff.save();
  res.json({ success: true, data: staff });
}

module.exports = { listStaff, createStaff, updateStaff };
