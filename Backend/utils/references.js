const crypto = require('crypto');

// No 0/O or 1/I so references are easy to read out loud at the front desk
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const PREFIXES = {
  booking: 'KFB',
  payment: 'KFP',
  serviceRequest: 'KFR',
};

function generateReference(kind, length = 8) {
  const prefix = PREFIXES[kind];
  if (!prefix) throw new Error(`Unknown reference kind: ${kind}`);
  let code = '';
  for (let i = 0; i < length; i += 1) code += ALPHABET[crypto.randomInt(ALPHABET.length)];
  return `${prefix}-${code}`;
}

// Creates a document with a fresh reference, retrying on the (very rare) collision
async function createWithReference(Model, kind, data, attempts = 3) {
  for (let i = 1; i <= attempts; i += 1) {
    try {
      return await Model.create({ ...data, reference: generateReference(kind) });
    } catch (err) {
      const collided = err.code === 11000 && err.keyPattern && err.keyPattern.reference;
      if (!collided || i === attempts) throw err;
    }
  }
  return null;
}

module.exports = { generateReference, createWithReference, PREFIXES };
