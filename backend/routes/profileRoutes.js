const express = require('express');
const router = express.Router();
const {
  createVolunteerProfile,
  createOrganizerProfile,
  getVolunteerProfile,
  getOrganizerProfile,
} = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');

router.post('/volunteer', protect, createVolunteerProfile);
router.get('/volunteer', protect, getVolunteerProfile);

router.post('/organizer', protect, createOrganizerProfile);
router.get('/organizer', protect, getOrganizerProfile);

module.exports = router;
