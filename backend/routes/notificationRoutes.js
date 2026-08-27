const express = require('express');
const router = express.Router();
const { getMyNotifications, markNotificationRead } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getMyNotifications);
router.patch('/:id/read', protect, markNotificationRead);

module.exports = router;
