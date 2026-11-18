const { Router } = require('express');
const mongoose = require('mongoose');
const guestRoutes = require('./guest.routes');

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

router.use('/guests', guestRoutes);

module.exports = router;
