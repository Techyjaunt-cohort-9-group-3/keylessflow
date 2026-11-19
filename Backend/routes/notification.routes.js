const { Router } = require('express');
const c = require('../controllers/notification.controller');
const { authenticate, allow } = require('../middlewares/auth');

const router = Router();

router.use(authenticate, allow('guest'));
router.get('/', c.listNotifications);
router.patch('/read-all', c.markAllRead);
router.patch('/:id/read', c.markRead);

module.exports = router;
