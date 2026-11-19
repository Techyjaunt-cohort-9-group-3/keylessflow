const { Router } = require('express');
const c = require('../controllers/access.controller');
const { lockLimiter } = require('../middlewares/rateLimit');

const router = Router();

// Simulated door lock. The access token in the body is the credential.
router.post('/validate', lockLimiter, c.validateAtLock);

module.exports = router;
