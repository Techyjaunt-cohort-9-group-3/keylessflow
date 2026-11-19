const { Router } = require('express');
const mongoose = require('mongoose');

const router = Router();

const DB_STATES = ['disconnected', 'connected', 'connecting', 'disconnecting'];

router.get('/health', (req, res) => {
  const dbState = DB_STATES[mongoose.connection.readyState] || 'unknown';
  res.status(dbState === 'connected' ? 200 : 503).json({
    success: dbState === 'connected',
    service: 'keylessflow-api',
    database: { name: mongoose.connection.name, state: dbState },
    uptime: process.uptime(),
  });
});

router.use('/auth', require('./auth.routes'));
router.use('/guests', require('./guest.routes'));
router.use('/staff', require('./staff.routes'));
router.use('/admin', require('./admin.routes'));
router.use('/notifications', require('./notification.routes'));

// Squad A: booking and payments
router.use('/rooms', require('./room.routes'));
router.use('/bookings', require('./booking.routes'));
router.use('/payments', require('./payment.routes'));

// Squad B: check-in and room access
router.use('/check-in', require('./checkIn.routes'));
router.use('/access', require('./access.routes'));
router.use('/lock', require('./lock.routes'));

// Squad C: guest services
router.use('/service-requests', require('./serviceRequest.routes'));
router.use('/recommendations', require('./recommendation.routes'));

module.exports = router;
