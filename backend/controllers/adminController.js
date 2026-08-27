const OrganizerProfile = require('../models/OrganizerProfile');
const User = require('../models/User');
const Program = require('../models/Program');
const Application = require('../models/Application');
const notifyUser = require('../utils/notifyUser');

const getPendingOrganizerRequests = async (req, res) => {
  try {
    const requests = await OrganizerProfile.find({ status: 'pending' }).populate('user', 'email');
    res.json({ requests });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching organizer requests' });
  }
};

const getAllOrganizerRequests = async (req, res) => {
  try {
    const requests = await OrganizerProfile.find().populate('user', 'email').sort({ createdAt: -1 });
    res.json({ requests });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching organizer requests' });
  }
};

/**
 * Approve an organizer request. Does not touch the user's Volunteer Profile in any way.
 */
const approveOrganizerRequest = async (req, res) => {
  try {
    const profile = await OrganizerProfile.findById(req.params.id).populate('user');
    if (!profile) {
      return res.status(404).json({ message: 'Organizer request not found' });
    }
    if (profile.status !== 'pending') {
      return res.status(400).json({ message: 'This request has already been reviewed' });
    }

    profile.status = 'approved';
    profile.reviewedBy = req.user._id;
    profile.reviewedAt = new Date();
    await profile.save();

    await notifyUser({
      userId: profile.user._id,
      type: 'profile_status_change',
      title: 'Organizer Request Approved',
      message: 'Your organizer request has been approved. You can now create and manage programs.',
      alsoEmail: true,
    });

    res.json({ message: 'Organizer request approved', profile });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error approving organizer request' });
  }
};

/**
 * Reject an organizer request - reason mandatory. Volunteer Profile (if any) is unaffected.
 */
const rejectOrganizerRequest = async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) {
      return res.status(400).json({ message: 'A rejection reason is required' });
    }

    const profile = await OrganizerProfile.findById(req.params.id).populate('user');
    if (!profile) {
      return res.status(404).json({ message: 'Organizer request not found' });
    }
    if (profile.status !== 'pending') {
      return res.status(400).json({ message: 'This request has already been reviewed' });
    }

    profile.status = 'rejected';
    profile.rejectionReason = reason;
    profile.reviewedBy = req.user._id;
    profile.reviewedAt = new Date();
    await profile.save();

    await notifyUser({
      userId: profile.user._id,
      type: 'profile_status_change',
      title: 'Organizer Request Rejected',
      message: `Your organizer request was rejected. Reason: ${reason}`,
      alsoEmail: true,
    });

    res.json({ message: 'Organizer request rejected', profile });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error rejecting organizer request' });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching users' });
  }
};

const toggleUserActive = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot deactivate an admin account' });
    }
    user.isActive = !user.isActive;
    await user.save();
    res.json({ message: `User ${user.isActive ? 'activated' : 'deactivated'}`, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating user status' });
  }
};

const getAllProgramsAdmin = async (req, res) => {
  try {
    const programs = await Program.find().populate('organizer').sort({ createdAt: -1 });
    res.json({ programs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching programs' });
  }
};

const getAllApplicationsAdmin = async (req, res) => {
  try {
    const applications = await Application.find().populate('volunteer').populate('program').sort({ createdAt: -1 });
    res.json({ applications });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching applications' });
  }
};

/**
 * High-level platform stats for the admin dashboard overview.
 */
const getDashboardStats = async (req, res) => {
  try {
    const [userCount, programCount, applicationCount, pendingOrganizerCount] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Program.countDocuments(),
      Application.countDocuments(),
      OrganizerProfile.countDocuments({ status: 'pending' }),
    ]);

    res.json({
      stats: {
        totalUsers: userCount,
        totalPrograms: programCount,
        totalApplications: applicationCount,
        pendingOrganizerRequests: pendingOrganizerCount,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching dashboard stats' });
  }
};

module.exports = {
  getPendingOrganizerRequests,
  getAllOrganizerRequests,
  approveOrganizerRequest,
  rejectOrganizerRequest,
  getAllUsers,
  toggleUserActive,
  getAllProgramsAdmin,
  getAllApplicationsAdmin,
  getDashboardStats,
};
