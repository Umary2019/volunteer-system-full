const express = require('express');
const router = express.Router();
const {
  createProgram,
  updateProgram,
  cancelProgram,
  setApplicationsOpenState,
  listPrograms,
  getProgramById,
  getMyPrograms,
} = require('../controllers/programController');
const { protect } = require('../middleware/authMiddleware');

// Browsing is available to any logged-in user, profile or not (spec section 23)
router.get('/', protect, listPrograms);
router.get('/mine', protect, getMyPrograms);
router.get('/:id', protect, getProgramById);

router.post('/', protect, createProgram);
router.put('/:id', protect, updateProgram);
router.delete('/:id', protect, cancelProgram);
router.patch('/:id/applications', protect, setApplicationsOpenState);

module.exports = router;
