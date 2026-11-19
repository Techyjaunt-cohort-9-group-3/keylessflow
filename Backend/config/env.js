require('dotenv').config({ quiet: true });

const required = ['MONGO_URI', 'JWT_SECRET'];
const missing = required.filter((key) => !process.env[key]);

if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(', ')}`);
  console.error('Copy .env.example to .env and fill in the values.');
  process.exit(1);
}

const num = (value, fallback) => (Number.isFinite(Number(value)) && value !== '' ? Number(value) : fallback);

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: num(process.env.PORT, 5000),
  mongoUri: process.env.MONGO_URI,
  dbName: process.env.DB_NAME || 'keylessflow',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  trustProxy: process.env.TRUST_PROXY === 'true',
  frontendUrl: (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, ''),

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  paystack: {
    secretKey: process.env.PAYSTACK_SECRET_KEY || '',
    baseUrl: (process.env.PAYSTACK_BASE_URL || 'https://api.paystack.co').replace(/\/$/, ''),
    callbackUrl: process.env.PAYSTACK_CALLBACK_URL || '',
  },

  booking: {
    currency: process.env.CURRENCY || 'NGN',
    holdMinutes: num(process.env.BOOKING_HOLD_MINUTES, 30),
    maxNights: num(process.env.BOOKING_MAX_NIGHTS, 30),
    nudgeAfterMinutes: num(process.env.ABANDONMENT_NUDGE_AFTER_MINUTES, 60),
  },

  checkIn: {
    windowHours: num(process.env.CHECKIN_WINDOW_HOURS, 48),
    maxVerificationAttempts: num(process.env.MAX_VERIFICATION_ATTEMPTS, 3),
  },

  access: {
    checkoutHourUtc: num(process.env.CHECKOUT_HOUR_UTC, 11),
  },

  jobs: {
    intervalMinutes: num(process.env.JOB_INTERVAL_MINUTES, 5),
  },
};
