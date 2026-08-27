const User = require('../models/User');
const VolunteerProfile = require('../models/VolunteerProfile');
const OrganizerProfile = require('../models/OrganizerProfile');

/**
 * Create a Volunteer Profile for the logged-in user.
 * Allowed even if the user already has (or is pending) an Organizer Profile -
 * the two are independent.
 */
const createVolunteerProfile = async (req, res) => {
  try {
    if (req.user.volunteerProfile) {
      return res.status(409).json({ message: 'Volunteer Profile already exists for this account' });
    }

    const {
      fullName,
      matricNumber,
      department,
      faculty,
      level,
      phoneNumber,
      areasOfInterest,
      previousVolunteerParticipation,
    } = req.body;

    if (!fullName || !matricNumber || !department || !faculty || !level || !phoneNumber) {
      return res.status(400).json({ message: 'Missing required volunteer profile fields' });
    }

    const profile = await VolunteerProfile.create({
      user: req.user._id,
      fullName,
      matricNumber,
      department,
      faculty,
      level,
      phoneNumber,
      areasOfInterest: areasOfInterest || [],
      previousVolunteerParticipation: previousVolunteerParticipation || '',
    });

    await User.findByIdAndUpdate(req.user._id, { volunteerProfile: profile._id });

    res.status(201).json({ message: 'Volunteer Profile created', profile });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating volunteer profile' });
  }
};

/**
 * Submit an Organizer Profile request for the logged-in user.
 * Starts as 'pending' - does not grant organizer capability until admin approves.
 * This never touches or restricts an existing Volunteer Profile.
 */
const createOrganizerProfile = async (req, res) => {
  try {
    const existingProfile = await OrganizerProfile.findOne({ user: req.user._id });
    if (existingProfile && existingProfile.status !== 'rejected') {
      return res.status(409).json({ message: 'Organizer Profile request already exists for this account' });
    }

    const {
      name,
      department,
      faculty,
      organization,
      position,
      phoneNumber,
      reasonForRequest,
      otherInfo,
    } = req.body;

    if (!name || !department || !faculty || !organization || !position || !phoneNumber || !reasonForRequest) {
      return res.status(400).json({ message: 'Missing required organizer request fields' });
    }

    const profile = existingProfile || new OrganizerProfile({ user: req.user._id });
    Object.assign(profile, {
      name,
      department,
      faculty,
      organization,
      position,
      phoneNumber,
      reasonForRequest,
      otherInfo: otherInfo || '',
      status: 'pending',
      rejectionReason: '',
      reviewedBy: null,
      reviewedAt: null,
    });
    await profile.save();

    await User.findByIdAndUpdate(req.user._id, { organizerProfile: profile._id });

    res.status(201).json({
      message: 'Organizer request submitted. Awaiting administrator approval.',
      profile,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating organizer profile' });
  }
};

const getVolunteerProfile = async (req, res) => {
  try {
    const profile = await VolunteerProfile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(404).json({ message: 'No Volunteer Profile found' });
    }
    res.json({ profile });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching volunteer profile' });
  }
};

const getOrganizerProfile = async (req, res) => {
  try {
    const profile = await OrganizerProfile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(404).json({ message: 'No Organizer Profile found' });
    }
    res.json({ profile });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching organizer profile' });
  }
};

module.exports = {
  createVolunteerProfile,
  createOrganizerProfile,
  getVolunteerProfile,
  getOrganizerProfile,
};
