const mongoose = require('mongoose');
const ApiError = require('./ApiError');

function requireFields(body, fields) {
  const source = body || {};
  const missing = fields.filter((f) => source[f] === undefined || source[f] === null || source[f] === '');
  if (missing.length) {
    throw ApiError.badRequest(
      'Missing required fields',
      missing.map((field) => ({ field, message: `${field} is required` })),
    );
  }
}

function assertObjectId(value, field = 'id') {
  if (!mongoose.isValidObjectId(value)) throw ApiError.badRequest(`Invalid ${field}`);
}

// Copies only the allowed keys that are present in the source object
function pick(source, keys) {
  const out = {};
  keys.forEach((key) => {
    if (source && source[key] !== undefined) out[key] = source[key];
  });
  return out;
}

function parsePagination(query, { defaultLimit = 20, maxLimit = 100 } = {}) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || defaultLimit, 1), maxLimit);
  return { page, limit, skip: (page - 1) * limit };
}

function paginationMeta(page, limit, total) {
  return { page, limit, total, pages: Math.ceil(total / limit) };
}

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

module.exports = { requireFields, assertObjectId, pick, parsePagination, paginationMeta, escapeRegex };
