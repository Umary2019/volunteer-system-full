const express = require('express');
const router = express.Router();
const {
  applyToProgram,
  cancelApplication,
  getMyApplications,
  getRankedApplicants,
  approveApplication,
  rejectApplication,
  assignRole,
  removeApprovedVolunteer,
  getApplicationsForProgram,
} = require('../controllers/applicationController');
const { protect } = require('../middleware/authMiddleware');

// Volunteer-facing
router.post('/program/:programId/apply', protect, applyToProgram);
router.delete('/:id', protect, cancelApplication);
router.get('/mine', protect, getMyApplications);

// Organizer-facing
router.get('/program/:programId', protect, getApplicationsForProgram);
router.get('/program/:programId/ranked', protect, getRankedApplicants);
router.patch('/:id/approve', protect, approveApplication);
router.patch('/:id/reject', protect, rejectApplication);
router.patch('/:id/assign-role', protect, assignRole);
router.patch('/:id/remove', protect, removeApprovedVolunteer);

module.exports = router;
