const { Router } = require('express');
const c = require('../controllers/checkIn.controller');
const { authenticate, allow } = require('../middlewares/auth');

const router = Router();

router.use(authenticate);
router.get('/', allow('staff', 'admin'), c.listCheckIns);
router.post('/', allow('guest'), c.initiateCheckIn);
router.get('/:bookingReference', c.getCheckIn);
router.patch('/:bookingReference/details', allow('guest'), c.submitDetails);
router.post('/:bookingReference/verify-identity', allow('guest'), c.verifyIdentity);
router.post('/:bookingReference/verification', allow('staff', 'admin'), c.recordVerification);

module.exports = router;
