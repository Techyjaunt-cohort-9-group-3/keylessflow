const { rateLimit } = require('express-rate-limit');

const limiter = (windowMs, limit, message) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { success: false, message },
  });

module.exports = {
  authLimiter: limiter(15 * 60 * 1000, 30, 'Too many login attempts, please try again later'),
  lockLimiter: limiter(60 * 1000, 60, 'Too many access attempts, please slow down'),
};
