const { Router } = require('express');
const c = require('../controllers/access.controller');
const { authenticate } = require('../middlewares/auth');

const router = Router();

router.use(authenticate);
router.post('/tokens', c.generateToken);
router.get('/tokens', c.listTokens);
router.post('/tokens/:tokenId/revoke', c.revokeToken);
router.get('/logs', c.listAccessLogs);

module.exports = router;
