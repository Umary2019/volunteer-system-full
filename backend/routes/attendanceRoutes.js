const express = require('express');
const router = express.Router();
const {
  startAttendance,
  scanAttendance,
  getAttendanceForProgram,
  getMyAttendanceHistory,
} = require('../controllers/attendanceController');
const { protect } = require('../middleware/authMiddleware');

router.post('/program/:programId/start', protect, startAttendance);
router.post('/scan', protect, scanAttendance);
router.get('/program/:programId', protect, getAttendanceForProgram);
router.get('/mine', protect, getMyAttendanceHistory);

module.exports = router;
