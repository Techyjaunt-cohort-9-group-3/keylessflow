const { Router } = require('express');
const c = require('../controllers/admin.controller');
const { authenticate, allow } = require('../middlewares/auth');

const router = Router();

router.use(authenticate, allow('staff', 'admin'));
router.get('/abandoned-bookings', c.listAbandoned);
router.post('/abandoned-bookings/nudge', allow('admin'), c.nudgeAbandoned);

module.exports = router;
