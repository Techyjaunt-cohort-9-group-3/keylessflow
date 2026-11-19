const ApiError = require('./ApiError');

const DAY_MS = 24 * 60 * 60 * 1000;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

// Accepts "YYYY-MM-DD" and returns a Date at 00:00 UTC on that day
function parseDateOnly(value, field) {
  if (typeof value !== 'string' || !DATE_ONLY.test(value)) {
    throw ApiError.badRequest(`${field} must be a date in YYYY-MM-DD format`);
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw ApiError.badRequest(`${field} is not a valid date`);
  }
  return date;
}

function startOfTodayUtc() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function nightsBetween(checkIn, checkOut) {
  return Math.round((checkOut.getTime() - checkIn.getTime()) / DAY_MS);
}

// Validates a stay and returns { checkIn, checkOut, nights }
function parseStay(checkInValue, checkOutValue, maxNights) {
  const checkIn = parseDateOnly(checkInValue, 'checkInDate');
  const checkOut = parseDateOnly(checkOutValue, 'checkOutDate');

  if (checkIn < startOfTodayUtc()) throw ApiError.badRequest('checkInDate cannot be in the past');
  if (checkOut <= checkIn) throw ApiError.badRequest('checkOutDate must be after checkInDate');

  const nights = nightsBetween(checkIn, checkOut);
  if (nights > maxNights) throw ApiError.badRequest(`A stay cannot be longer than ${maxNights} nights`);

  return { checkIn, checkOut, nights };
}

function stayIncludesWeekend(checkIn, checkOut) {
  for (let t = checkIn.getTime(); t < checkOut.getTime(); t += DAY_MS) {
    const day = new Date(t).getUTCDay();
    if (day === 5 || day === 6) return true; // Friday or Saturday night
  }
  return false;
}

function toDateOnlyString(date) {
  return date ? date.toISOString().slice(0, 10) : null;
}

module.exports = {
  DAY_MS,
  parseDateOnly,
  parseStay,
  startOfTodayUtc,
  nightsBetween,
  stayIncludesWeekend,
  toDateOnlyString,
};
