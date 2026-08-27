const Application = require('../models/Application');
const Program = require('../models/Program');
const VolunteerProfile = require('../models/VolunteerProfile');
const OrganizerProfile = require('../models/OrganizerProfile');
const notifyUser = require('../utils/notifyUser');
const { rankApplicants } = require('../utils/ranking');

/**
 * Volunteer applies to a program.
 * Checks: registration period open, not already applied, capacity available.
 */
const applyToProgram = async (req, res) => {
  try {
    const volunteerProfile = await VolunteerProfile.findOne({ user: req.user._id });
    if (!volunteerProfile) {
      return res.status(403).json({ message: 'A Volunteer Profile is required to apply' });
    }

    const program = await Program.findById(req.params.programId);
    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }

    if (!program.applicationsOpen || program.status !== 'open') {
      return res.status(400).json({ message: 'Applications are not currently open for this program' });
    }
    if (new Date() > new Date(program.registrationDeadline)) {
      return res.status(400).json({ message: 'The registration deadline has passed' });
    }

    const existing = await Application.findOne({ volunteer: volunteerProfile._id, program: program._id });
    if (existing) {
      return res.status(409).json({ message: 'You have already applied to this program' });
    }

    const approvedCount = await Application.countDocuments({ program: program._id, status: 'approved' });
    if (approvedCount >= program.maxVolunteerCapacity) {
      return res.status(400).json({ message: 'This program has reached its volunteer capacity' });
    }

    const application = await Application.create({
      volunteer: volunteerProfile._id,
      program: program._id,
      status: 'pending',
    });

    res.status(201).json({ message: 'Application submitted', application });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error applying to program' });
  }
};

/**
 * Volunteer cancels their own application - only allowed while still pending.
 */
const cancelApplication = async (req, res) => {
  try {
    const volunteerProfile = await VolunteerProfile.findOne({ user: req.user._id });
    if (!volunteerProfile) {
      return res.status(403).json({ message: 'No Volunteer Profile found' });
    }

    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    if (String(application.volunteer) !== String(volunteerProfile._id)) {
      return res.status(403).json({ message: 'This is not your application' });
    }
    if (application.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending applications can be cancelled' });
    }

    await application.deleteOne();
    res.json({ message: 'Application cancelled' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error cancelling application' });
  }
};

/**
 * Volunteer's own applications, with program info.
 */
const getMyApplications = async (req, res) => {
  try {
    const volunteerProfile = await VolunteerProfile.findOne({ user: req.user._id });
    if (!volunteerProfile) {
      return res.status(403).json({ message: 'No Volunteer Profile found' });
    }
    const applications = await Application.find({ volunteer: volunteerProfile._id })
      .populate('program')
      .sort({ createdAt: -1 });
    res.json({ applications });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching applications' });
  }
};

/**
 * Organizer views + ranks applicants for one of their programs.
 * Ranking is decision support only - does NOT change application status.
 */
const getRankedApplicants = async (req, res) => {
  try {
    const organizerProfile = await OrganizerProfile.findOne({ user: req.user._id, status: 'approved' });
    if (!organizerProfile) {
      return res.status(403).json({ message: 'Only approved organizers can view applicants' });
    }

    const program = await Program.findById(req.params.programId);
    if (!program || String(program.organizer) !== String(organizerProfile._id)) {
      return res.status(404).json({ message: 'Program not found or not owned by you' });
    }

    const applications = await Application.find({ program: program._id, status: 'pending' }).populate('volunteer');

    const entries = applications
      .filter((app) => app.volunteer) // guard against orphaned refs
      .map((app) => ({ application: app, volunteerProfile: app.volunteer }));

    const ranked = rankApplicants(entries, program);

    res.json({
      message: 'Ranking is decision support only - you make the final selection.',
      ranked: ranked.map((entry) => ({
        rank: entry.rank,
        score: entry.score,
        application: entry.application,
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error ranking applicants' });
  }
};

/**
 * Organizer approves an applicant, optionally assigning a role immediately.
 */
const approveApplication = async (req, res) => {
  try {
    const organizerProfile = await OrganizerProfile.findOne({ user: req.user._id, status: 'approved' });
    if (!organizerProfile) {
      return res.status(403).json({ message: 'Only approved organizers can review applications' });
    }

    const application = await Application.findById(req.params.id).populate('program').populate('volunteer');
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    if (!application.program || !application.volunteer) {
      return res.status(409).json({ message: 'Application references missing program or volunteer data' });
    }
    if (String(application.program.organizer) !== String(organizerProfile._id)) {
      return res.status(403).json({ message: 'You do not own this program' });
    }
    if (application.status !== 'pending' || application.isRemoved) {
      return res.status(400).json({ message: 'Only pending applications can be approved' });
    }

    const approvedCount = await Application.countDocuments({ program: application.program._id, status: 'approved' });
    if (approvedCount >= application.program.maxVolunteerCapacity) {
      return res.status(400).json({ message: 'Volunteer capacity already reached' });
    }

    application.status = 'approved';
    if (req.body.assignedRole) application.assignedRole = req.body.assignedRole;
    await application.save();

    await notifyUser({
      userId: application.volunteer.user,
      type: 'application_status',
      title: 'Application Approved',
      message: `Your application for "${application.program.title}" has been approved.`,
      relatedProgram: application.program._id,
      relatedApplication: application._id,
      alsoEmail: true,
    });

    res.json({ message: 'Application approved', application });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error approving application' });
  }
};

/**
 * Organizer rejects an applicant - reason is mandatory.
 */
const rejectApplication = async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) {
      return res.status(400).json({ message: 'A rejection reason is required' });
    }

    const organizerProfile = await OrganizerProfile.findOne({ user: req.user._id, status: 'approved' });
    if (!organizerProfile) {
      return res.status(403).json({ message: 'Only approved organizers can review applications' });
    }

    const application = await Application.findById(req.params.id).populate('program').populate('volunteer');
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    if (!application.program || !application.volunteer) {
      return res.status(409).json({ message: 'Application references missing program or volunteer data' });
    }
    if (String(application.program.organizer) !== String(organizerProfile._id)) {
      return res.status(403).json({ message: 'You do not own this program' });
    }
    if (application.status !== 'pending' || application.isRemoved) {
      return res.status(400).json({ message: 'Only pending applications can be rejected' });
    }

    application.status = 'rejected';
    application.rejectionReason = reason;
    await application.save();

    await notifyUser({
      userId: application.volunteer.user,
      type: 'application_status',
      title: 'Application Rejected',
      message: `Your application for "${application.program.title}" was rejected. Reason: ${reason}`,
      relatedProgram: application.program._id,
      relatedApplication: application._id,
      alsoEmail: true,
    });

    res.json({ message: 'Application rejected', application });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error rejecting application' });
  }
};

/**
 * Organizer assigns/updates a role for an already-approved volunteer.
 */
const assignRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!role) {
      return res.status(400).json({ message: 'A role is required' });
    }

    const organizerProfile = await OrganizerProfile.findOne({ user: req.user._id, status: 'approved' });
    if (!organizerProfile) {
      return res.status(403).json({ message: 'Only approved organizers can assign roles' });
    }

    const application = await Application.findById(req.params.id).populate('program');
    if (!application || application.status !== 'approved') {
      return res.status(400).json({ message: 'Application must be approved before assigning a role' });
    }
    if (String(application.program.organizer) !== String(organizerProfile._id)) {
      return res.status(403).json({ message: 'You do not own this program' });
    }

    application.assignedRole = role;
    await application.save();

    res.json({ message: 'Role assigned', application });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error assigning role' });
  }
};

/**
 * Organizer removes an already-approved volunteer. Reason mandatory (spec section 15).
 */
const removeApprovedVolunteer = async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) {
      return res.status(400).json({ message: 'A reason is required to remove a volunteer' });
    }

    const organizerProfile = await OrganizerProfile.findOne({ user: req.user._id, status: 'approved' });
    if (!organizerProfile) {
      return res.status(403).json({ message: 'Only approved organizers can remove volunteers' });
    }

    const application = await Application.findById(req.params.id).populate('program').populate('volunteer');
    if (!application || application.status !== 'approved') {
      return res.status(400).json({ message: 'Only approved volunteers can be removed' });
    }
    if (String(application.program.organizer) !== String(organizerProfile._id)) {
      return res.status(403).json({ message: 'You do not own this program' });
    }

    application.isRemoved = true;
    application.removedReason = reason;
    application.status = 'rejected'; // no longer an active approved volunteer
    await application.save();

    await notifyUser({
      userId: application.volunteer.user,
      type: 'volunteer_removed',
      title: 'Removed from Program',
      message: `You have been removed from "${application.program.title}". Reason: ${reason}`,
      relatedProgram: application.program._id,
      relatedApplication: application._id,
      alsoEmail: true,
    });

    res.json({ message: 'Volunteer removed', application });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error removing volunteer' });
  }
};

/**
 * Organizer view: all applications for one of their programs (any status).
 */
const getApplicationsForProgram = async (req, res) => {
  try {
    const organizerProfile = await OrganizerProfile.findOne({ user: req.user._id, status: 'approved' });
    if (!organizerProfile) {
      return res.status(403).json({ message: 'Only approved organizers can view applications' });
    }

    const program = await Program.findById(req.params.programId);
    if (!program || String(program.organizer) !== String(organizerProfile._id)) {
      return res.status(404).json({ message: 'Program not found or not owned by you' });
    }

    const applications = await Application.find({ program: program._id }).populate('volunteer');
    res.json({ applications });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching applications' });
  }
};

module.exports = {
  applyToProgram,
  cancelApplication,
  getMyApplications,
  getRankedApplicants,
  approveApplication,
  rejectApplication,
  assignRole,
  removeApprovedVolunteer,
  getApplicationsForProgram,
};
