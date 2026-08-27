const express = require('express');
const router = express.Router();
const {
  getPendingOrganizerRequests,
  getAllOrganizerRequests,
  approveOrganizerRequest,
  rejectOrganizerRequest,
  getAllUsers,
  toggleUserActive,
  getAllProgramsAdmin,
  getAllApplicationsAdmin,
  getDashboardStats,
} = require('../controllers/adminController');
const { protect, requireAdmin } = require('../middleware/authMiddleware');

router.use(protect, requireAdmin);

router.get('/stats', getDashboardStats);

router.get('/organizer-requests/pending', getPendingOrganizerRequests);
router.get('/organizer-requests', getAllOrganizerRequests);
router.patch('/organizer-requests/:id/approve', approveOrganizerRequest);
router.patch('/organizer-requests/:id/reject', rejectOrganizerRequest);

router.get('/users', getAllUsers);
router.patch('/users/:id/toggle-active', toggleUserActive);

router.get('/programs', getAllProgramsAdmin);
router.get('/applications', getAllApplicationsAdmin);

module.exports = router;
