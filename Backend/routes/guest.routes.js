const { Router } = require('express');
const {
  listGuests,
  getGuest,
  createGuest,
  updateGuest,
  deleteGuest,
} = require('../controllers/guest.controller');

const router = Router();

router.route('/').get(listGuests).post(createGuest);
router.route('/:id').get(getGuest).patch(updateGuest).delete(deleteGuest);

module.exports = router;
