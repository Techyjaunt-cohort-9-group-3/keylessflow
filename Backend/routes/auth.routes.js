const { Router } = require('express');
const c = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth');
const { authLimiter } = require('../middlewares/rateLimit');

const router = Router();

router.post('/register', authLimiter, c.register);
router.post('/login', authLimiter, c.login);
router.post('/staff/login', authLimiter, c.staffLogin);
router.get('/me', authenticate, c.me);
router.patch('/me', authenticate, c.updateMe);
router.post('/change-password', authenticate, c.changePassword);

module.exports = router;
