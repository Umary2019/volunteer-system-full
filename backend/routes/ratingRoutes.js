const express = require('express');
const router = express.Router();
const { rateVolunteer, getMyRatings } = require('../controllers/ratingController');
const { protect } = require('../middleware/authMiddleware');

router.post('/application/:applicationId', protect, rateVolunteer);
router.get('/mine', protect, getMyRatings);

module.exports = router;
