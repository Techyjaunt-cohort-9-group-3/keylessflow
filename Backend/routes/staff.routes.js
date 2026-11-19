const { Router } = require('express');
const c = require('../controllers/staff.controller');
const { authenticate, allow } = require('../middlewares/auth');

const router = Router();

router.use(authenticate, allow('admin'));
router.get('/', c.listStaff);
router.post('/', c.createStaff);
router.patch('/:id', c.updateStaff);

module.exports = router;
