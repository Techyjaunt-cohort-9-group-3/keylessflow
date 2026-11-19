const { Router } = require('express');
const c = require('../controllers/room.controller');
const { authenticate, allow } = require('../middlewares/auth');

const router = Router();

router.get('/', c.listRooms);
router.get('/availability', c.checkAvailability); // must come before /:id
router.get('/:id', c.getRoom);
router.post('/', authenticate, allow('admin'), c.createRoom);
router.patch('/:id', authenticate, allow('admin'), c.updateRoom);

module.exports = router;
