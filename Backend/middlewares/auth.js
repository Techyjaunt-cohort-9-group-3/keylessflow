const jwt = require('jsonwebtoken');
const { jwt: jwtConfig } = require('../config/env');
const ApiError = require('../utils/ApiError');
const Guest = require('../models/guest.model');
const Staff = require('../models/staff.model');

function signToken(subjectId, type) {
  return jwt.sign({ sub: String(subjectId), type }, jwtConfig.secret, { expiresIn: jwtConfig.expiresIn });
}

// Verifies the Bearer token and sets req.user = { id, type, role, doc }
async function authenticate(req, res, next) {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) throw ApiError.unauthorized();

  let payload;
  try {
    payload = jwt.verify(token, jwtConfig.secret);
  } catch {
    throw ApiError.unauthorized('Invalid or expired token');
  }

  if (payload.type === 'guest') {
    const guest = await Guest.findById(payload.sub);
    if (!guest) throw ApiError.unauthorized('Account no longer exists');
    req.user = { id: guest._id, type: 'guest', role: 'guest', doc: guest };
  } else if (payload.type === 'staff') {
    const staff = await Staff.findById(payload.sub);
    if (!staff || !staff.isActive) throw ApiError.unauthorized('Account is disabled or no longer exists');
    req.user = { id: staff._id, type: 'staff', role: staff.role, doc: staff };
  } else {
    throw ApiError.unauthorized('Invalid token');
  }

  next();
}

// Authenticates when a token is sent, otherwise continues as an anonymous request
async function optionalAuthenticate(req, res, next) {
  if (!req.headers.authorization) return next();
  return authenticate(req, res, next);
}

// Usage: allow('guest'), allow('staff', 'admin'), allow('admin')
function allow(...roles) {
  return (req, res, next) => {
    if (!req.user) throw ApiError.unauthorized();
    if (!roles.includes(req.user.role)) throw ApiError.forbidden();
    next();
  };
}

const isStaff = (user) => user && user.type === 'staff';

module.exports = { signToken, authenticate, optionalAuthenticate, allow, isStaff };
