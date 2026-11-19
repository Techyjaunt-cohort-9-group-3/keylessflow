const crypto = require('crypto');
const { paystack } = require('../config/env');
const ApiError = require('../utils/ApiError');

function ensureConfigured() {
  if (!paystack.secretKey) {
    throw new ApiError(503, 'Payments are not configured. Set PAYSTACK_SECRET_KEY in .env');
  }
}

async function request(method, path, body) {
  ensureConfigured();

  let res;
  try {
    res = await fetch(`${paystack.baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${paystack.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(15000),
    });
  } catch (err) {
    throw new ApiError(502, `Could not reach Paystack: ${err.message}`);
  }

  const json = await res.json().catch(() => null);
  if (!res.ok || !json || !json.status) {
    const message = (json && json.message) || `Paystack request failed with status ${res.status}`;
    throw new ApiError(502, `Paystack: ${message}`);
  }
  return json.data;
}

// amountKobo: integer amount in the lowest currency unit (kobo for NGN)
function initializeTransaction({ email, amountKobo, reference, currency, callbackUrl, metadata }) {
  return request('POST', '/transaction/initialize', {
    email,
    amount: amountKobo,
    reference,
    currency,
    ...(callbackUrl && { callback_url: callbackUrl }),
    metadata,
  });
}

function verifyTransaction(reference) {
  return request('GET', `/transaction/verify/${encodeURIComponent(reference)}`);
}

// Paystack signs webhook bodies with HMAC-SHA512 using the secret key
function isValidWebhookSignature(rawBody, signature) {
  if (!paystack.secretKey || !rawBody || typeof signature !== 'string') return false;
  const expected = crypto.createHmac('sha512', paystack.secretKey).update(rawBody).digest('hex');
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(signature, 'utf8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

module.exports = { initializeTransaction, verifyTransaction, isValidWebhookSignature };
