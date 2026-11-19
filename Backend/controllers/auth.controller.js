const Guest = require('../models/guest.model');
const Staff = require('../models/staff.model');
const ApiError = require('../utils/ApiError');
const { signToken } = require('../middlewares/auth');
const { requireFields, pick } = require('../utils/validation');
const { PASSWORD_RULE, PASSWORD_MESSAGE } = require('../utils/password');

const normaliseEmail = (email) => String(email || '').trim().toLowerCase();

function assertStrongPassword(password) {
  if (typeof password !== 'string' || !PASSWORD_RULE.test(password)) {
    throw ApiError.badRequest(PASSWORD_MESSAGE, [{ field: 'password', message: PASSWORD_MESSAGE }]);
  }
}

// POST /api/auth/register
async function register(req, res) {
  requireFields(req.body, ['firstName', 'lastName', 'email', 'phone', 'password']);
  assertStrongPassword(req.body.password);

  const email = normaliseEmail(req.body.email);
  if (await Guest.exists({ email })) throw ApiError.conflict('An account with this email already exists');

  const guest = await Guest.create({
    ...pick(req.body, ['firstName', 'lastName', 'phone', 'nationality', 'address', 'password']),
    email,
  });

  res.status(201).json({ success: true, data: { token: signToken(guest._id, 'guest'), user: guest } });
}

async function loginWith(Model, type, req, res) {
  requireFields(req.body, ['email', 'password']);
  const account = await Model.findOne({ email: normaliseEmail(req.body.email) }).select('+password');
  const valid = account && (await account.comparePassword(String(req.body.password)));
  if (!valid) throw ApiError.unauthorized('Invalid email or password');
  if (account.isActive === false) throw ApiError.forbidden('This account has been disabled');

  account.lastLoginAt = new Date();
  await account.save();

  res.json({ success: true, data: { token: signToken(account._id, type), user: account } });
}

// POST /api/auth/login
const login = (req, res) => loginWith(Guest, 'guest', req, res);

// POST /api/auth/staff/login
const staffLogin = (req, res) => loginWith(Staff, 'staff', req, res);

// GET /api/auth/me
function me(req, res) {
  res.json({ success: true, data: { type: req.user.type, role: req.user.role, user: req.user.doc } });
}

// PATCH /api/auth/me
async function updateMe(req, res) {
  const allowed =
    req.user.type === 'guest'
      ? ['firstName', 'lastName', 'phone', 'nationality', 'address', 'preferences']
      : ['firstName', 'lastName'];
  const account = req.user.doc;
  account.set(pick(req.body, allowed));
  await account.save();
  res.json({ success: true, data: account });
}

// POST /api/auth/change-password
async function changePassword(req, res) {
  requireFields(req.body, ['currentPassword', 'newPassword']);
  assertStrongPassword(req.body.newPassword);

  const Model = req.user.type === 'guest' ? Guest : Staff;
  const account = await Model.findById(req.user.id).select('+password');
  if (!(await account.comparePassword(String(req.body.currentPassword)))) {
    throw ApiError.badRequest('Current password is incorrect');
  }
  account.password = req.body.newPassword;
  await account.save();
  res.json({ success: true, message: 'Password updated' });
}

module.exports = { register, login, staffLogin, me, updateMe, changePassword, assertStrongPassword, normaliseEmail };
