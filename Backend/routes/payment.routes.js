const { Router } = require('express');
const c = require('../controllers/payment.controller');
const { authenticate, allow } = require('../middlewares/auth');

const router = Router();

// Paystack calls this; it is authenticated by the x-paystack-signature header
router.post('/webhook', c.paystackWebhook);

router.post('/initialize', authenticate, allow('guest'), c.initializePayment);
router.get('/verify/:reference', authenticate, c.verifyPayment);
router.get('/:reference', authenticate, c.getPayment);

module.exports = router;
