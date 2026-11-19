const { Router } = require('express');
const c = require('../controllers/guest.controller');
const { authenticate, allow } = require('../middlewares/auth');

const router = Router();

// Staff-facing guest management. Guests use /auth/me for their own profile.
router.use(authenticate, allow('staff', 'admin'));
router.get('/', c.listGuests);
router.get('/:id', c.getGuest);
router.patch('/:id', c.updateGuest);
router.delete('/:id', allow('admin'), c.deleteGuest);

module.exports = router;
