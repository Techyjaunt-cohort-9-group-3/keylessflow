const { Router } = require('express');
const c = require('../controllers/serviceRequest.controller');
const { authenticate, allow } = require('../middlewares/auth');

const router = Router();

router.get('/categories', c.listCategories);

router.use(authenticate);
router.post('/', allow('guest'), c.createRequest);
router.get('/', c.listRequests);
router.get('/:reference', c.getRequest);
router.patch('/:reference/status', allow('staff', 'admin'), c.updateStatus);
router.post('/:reference/cancel', allow('guest'), c.cancelRequest);

module.exports = router;
