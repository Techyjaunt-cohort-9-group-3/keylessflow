const crypto = require('crypto');
const { jwt } = require('../config/env');

// Simulated identity verification (PRD 6.2.B MVP approach).
// Swap verify() for a real provider (e.g. NIN/BVN lookup) without changing callers.

const ID_FORMATS = {
  passport: { pattern: /^[A-Z0-9]{6,9}$/i, hint: '6-9 letters or digits' },
  national_id: { pattern: /^\d{11}$/, hint: '11 digits (NIN)' },
  drivers_license: { pattern: /^[A-Z0-9]{8,15}$/i, hint: '8-15 letters or digits' },
};

// Test data: any ID number starting with 000 is treated as rejected by the provider
const SIMULATED_REJECT_PREFIX = '000';

const normalise = (s) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

function formatError(idType, idNumber) {
  const format = ID_FORMATS[idType];
  if (!format) return `idType must be one of: ${Object.keys(ID_FORMATS).join(', ')}`;
  if (!format.pattern.test(String(idNumber || '').trim())) return `idNumber for ${idType} must be ${format.hint}`;
  return null;
}

// Returns { verified: boolean, reason?: string }
function verify({ idNumber, nameOnId }, booking) {
  const id = String(idNumber).trim().toUpperCase();
  if (id.startsWith(SIMULATED_REJECT_PREFIX)) {
    return { verified: false, reason: 'The ID document could not be verified by the provider' };
  }

  const nameWords = normalise(nameOnId);
  const firstNameWords = normalise(booking.guestDetails.firstName);
  const lastNameWords = normalise(booking.guestDetails.lastName);
  const matches = [...firstNameWords, ...lastNameWords].every((w) => nameWords.includes(w));
  if (!matches) {
    return { verified: false, reason: 'The name on the ID does not match the name on the reservation' };
  }

  return { verified: true };
}

function hashIdNumber(idNumber) {
  return crypto.createHmac('sha256', jwt.secret).update(String(idNumber).trim().toUpperCase()).digest('hex');
}

module.exports = { ID_FORMATS, SIMULATED_REJECT_PREFIX, formatError, verify, hashIdNumber };
