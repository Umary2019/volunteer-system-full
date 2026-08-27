const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Verifies the JWT from the Authorization header and attaches the user to req.user.
 */
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorized, no token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password');
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Not authorized, account not found or inactive' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, invalid or expired token' });
  }
};

/**
 * Restricts a route to admin accounts only.
 */
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

/**
 * Restricts a route to users who have a Volunteer Profile.
 * Must run after `protect`.
 */
const requireVolunteerProfile = (req, res, next) => {
  if (!req.user.volunteerProfile) {
    return res.status(403).json({ message: 'A Volunteer Profile is required for this action' });
  }
  next();
};

/**
 * Restricts a route to users who have an APPROVED Organizer Profile.
 * Checking approval status happens in the controller since it requires
 * a DB lookup on OrganizerProfile - this just checks the profile reference exists.
 */
const requireOrganizerProfile = (req, res, next) => {
  if (!req.user.organizerProfile) {
    return res.status(403).json({ message: 'An Organizer Profile is required for this action' });
  }
  next();
};

module.exports = { protect, requireAdmin, requireVolunteerProfile, requireOrganizerProfile };
