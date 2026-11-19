const { Router } = require('express');
const c = require('../controllers/booking.controller');
const { authenticate, allow } = require('../middlewares/auth');

const router = Router();

router.use(authenticate);
router.post('/', allow('guest'), c.createBooking);
router.get('/', c.listBookings);
router.get('/:reference', c.getBooking);
router.get('/:reference/confirmation', c.getConfirmation);
router.post('/:reference/cancel', c.cancelBooking);
router.post('/:reference/check-out', allow('staff', 'admin'), c.checkOutBooking);

module.exports = router;
