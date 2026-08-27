const Rating = require('../models/Rating');
const Application = require('../models/Application');
const OrganizerProfile = require('../models/OrganizerProfile');
const VolunteerProfile = require('../models/VolunteerProfile');
const Attendance = require('../models/Attendance');

/**
 * Organizer rates a volunteer after program completion.
 * Recomputes the volunteer's aggregate overallRating across all their ratings.
 */
const rateVolunteer = async (req, res) => {
  try {
    const { punctuality, commitment, teamwork, communication, taskCompletion, comments } = req.body;
    const criteria = { punctuality, commitment, teamwork, communication, taskCompletion };

    for (const [key, value] of Object.entries(criteria)) {
      if (typeof value !== 'number' || value < 1 || value > 5) {
        return res.status(400).json({ message: `Invalid value for ${key} - must be a number 1-5` });
      }
    }

    const organizerProfile = await OrganizerProfile.findOne({ user: req.user._id, status: 'approved' });
    if (!organizerProfile) {
      return res.status(403).json({ message: 'Only approved organizers can rate volunteers' });
    }

    const application = await Application.findById(req.params.applicationId).populate('program').populate('volunteer');
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    if (!application.program || !application.volunteer) {
      return res.status(409).json({ message: 'Application references missing program or volunteer data' });
    }
    if (String(application.program.organizer) !== String(organizerProfile._id)) {
      return res.status(403).json({ message: 'You do not own this program' });
    }
    if (application.status !== 'approved' && application.status !== 'completed') {
      return res.status(400).json({ message: 'Only approved/completed volunteers can be rated' });
    }
    if (new Date(application.program.date) > new Date() && application.program.status !== 'completed') {
      return res.status(400).json({ message: 'Volunteers can only be rated after the program' });
    }
    const attended = await Attendance.exists({
      program: application.program._id,
      'checkIns.application': application._id,
    });
    if (!attended) {
      return res.status(400).json({ message: 'The volunteer must be checked in before being rated' });
    }

    const existing = await Rating.findOne({ application: application._id });
    if (existing) {
      return res.status(409).json({ message: 'This volunteer has already been rated for this program' });
    }

    const overallRating =
      Math.round(((punctuality + commitment + teamwork + communication + taskCompletion) / 5) * 10) / 10;

    const rating = await Rating.create({
      application: application._id,
      volunteer: application.volunteer._id,
      program: application.program._id,
      ratedBy: req.user._id,
      punctuality,
      commitment,
      teamwork,
      communication,
      taskCompletion,
      overallRating,
      comments: comments || '',
    });

    application.status = 'completed';
    await application.save();

    // Recompute the volunteer's aggregate overallRating and programsCompleted count
    const allRatings = await Rating.find({ volunteer: application.volunteer._id });
    const avgRating =
      Math.round((allRatings.reduce((sum, r) => sum + r.overallRating, 0) / allRatings.length) * 10) / 10;

    await VolunteerProfile.findByIdAndUpdate(application.volunteer._id, {
      overallRating: avgRating,
      totalRatingsCount: allRatings.length,
      $inc: { programsCompleted: 1 },
    });

    res.status(201).json({ message: 'Rating submitted', rating });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error submitting rating' });
  }
};

/**
 * Volunteer's own ratings/feedback history.
 */
const getMyRatings = async (req, res) => {
  try {
    const volunteerProfile = await VolunteerProfile.findOne({ user: req.user._id });
    if (!volunteerProfile) {
      return res.status(403).json({ message: 'No Volunteer Profile found' });
    }
    const ratings = await Rating.find({ volunteer: volunteerProfile._id }).populate('program').sort({ createdAt: -1 });
    res.json({ ratings, overallRating: volunteerProfile.overallRating });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching ratings' });
  }
};

module.exports = { rateVolunteer, getMyRatings };
