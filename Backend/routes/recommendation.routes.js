const { Router } = require('express');
const c = require('../controllers/recommendation.controller');
const { authenticate, optionalAuthenticate, allow } = require('../middlewares/auth');

const router = Router();

router.get('/', optionalAuthenticate, c.listRecommendations);
router.post('/', authenticate, allow('admin'), c.createRecommendation);
router.patch('/:id', authenticate, allow('admin'), c.updateRecommendation);
router.delete('/:id', authenticate, allow('admin'), c.deleteRecommendation);

module.exports = router;
