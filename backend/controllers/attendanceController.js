const crypto = require('crypto');
const QRCode = require('qrcode');
const Attendance = require('../models/Attendance');
const Application = require('../models/Application');
const Program = require('../models/Program');
const OrganizerProfile = require('../models/OrganizerProfile');
const VolunteerProfile = require('../models/VolunteerProfile');

const QR_VALID_MINUTES = 30;

/**
 * Organizer starts attendance for a program - generates a QR code (as a data URL)
 * embedding a random one-time token. Volunteers scan this to check in.
 */
const startAttendance = async (req, res) => {
  try {
    const organizerProfile = await OrganizerProfile.findOne({ user: req.user._id, status: 'approved' });
    if (!organizerProfile) {
      return res.status(403).json({ message: 'Only approved organizers can start attendance' });
    }

    const program = await Program.findById(req.params.programId);
    if (!program || String(program.organizer) !== String(organizerProfile._id)) {
      return res.status(404).json({ message: 'Program not found or not owned by you' });
    }

    // Deactivate any previous active session for this program
    await Attendance.updateMany({ program: program._id, isActive: true }, { isActive: false });

    const qrToken = crypto.randomBytes(24).toString('hex');
    const qrExpiresAt = new Date(Date.now() + QR_VALID_MINUTES * 60 * 1000);

    const attendance = await Attendance.create({
      program: program._id,
      qrToken,
      qrExpiresAt,
      isActive: true,
    });

    // Encode a payload that the volunteer's scan will submit back to the server
    const qrPayload = JSON.stringify({ attendanceId: attendance._id, token: qrToken });
    const qrCodeDataUrl = await QRCode.toDataURL(qrPayload);

    res.status(201).json({
      message: 'Attendance session started',
      attendanceId: attendance._id,
      qrCodeDataUrl,
      expiresAt: qrExpiresAt,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error starting attendance' });
  }
};

/**
 * Volunteer scans the QR code (their client decodes it and posts attendanceId + token here).
 * Verifies: valid/unexpired token, the volunteer has an approved application for this program,
 * and they haven't already checked in.
 */
const scanAttendance = async (req, res) => {
  try {
    const { attendanceId, token } = req.body;
    if (!attendanceId || !token) {
      return res.status(400).json({ message: 'Invalid QR code data' });
    }

    const volunteerProfile = await VolunteerProfile.findOne({ user: req.user._id });
    if (!volunteerProfile) {
      return res.status(403).json({ message: 'A Volunteer Profile is required to check in' });
    }

    const attendance = await Attendance.findById(attendanceId);
    if (!attendance || !attendance.isActive) {
      return res.status(400).json({ message: 'This attendance session is not active' });
    }
    if (attendance.qrToken !== token) {
      return res.status(400).json({ message: 'Invalid QR code' });
    }
    if (new Date() > new Date(attendance.qrExpiresAt)) {
      return res.status(400).json({ message: 'This QR code has expired' });
    }

    const application = await Application.findOne({
      program: attendance.program,
      volunteer: volunteerProfile._id,
      status: 'approved',
    });
    if (!application) {
      return res.status(403).json({ message: 'You do not have an approved application for this program' });
    }

    const alreadyCheckedIn = attendance.checkIns.some(
      (c) => String(c.application) === String(application._id)
    );
    if (alreadyCheckedIn) {
      return res.status(409).json({ message: 'You have already checked in' });
    }

    attendance.checkIns.push({
      application: application._id,
      volunteer: volunteerProfile._id,
    });
    await attendance.save();

    const approvedApplications = await Application.countDocuments({ program: attendance.program, status: { $in: ['approved', 'completed'] } });
    const attendedApplications = await Attendance.aggregate([
      { $match: { program: attendance.program } },
      { $unwind: '$checkIns' },
      { $match: { 'checkIns.volunteer': volunteerProfile._id } },
      { $count: 'total' },
    ]);
    if (approvedApplications > 0) {
      const attendedCount = attendedApplications[0]?.total || 0;
      await VolunteerProfile.findByIdAndUpdate(volunteerProfile._id, {
        attendanceRate: Math.round((attendedCount / approvedApplications) * 100),
      });
    }

    res.json({ message: 'Attendance recorded successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error recording attendance' });
  }
};

/**
 * Organizer view: attendance records for a program.
 */
const getAttendanceForProgram = async (req, res) => {
  try {
    const organizerProfile = await OrganizerProfile.findOne({ user: req.user._id, status: 'approved' });
    if (!organizerProfile) {
      return res.status(403).json({ message: 'Only approved organizers can view attendance' });
    }

    const program = await Program.findById(req.params.programId);
    if (!program || String(program.organizer) !== String(organizerProfile._id)) {
      return res.status(404).json({ message: 'Program not found or not owned by you' });
    }

    const sessions = await Attendance.find({ program: program._id })
      .populate('checkIns.volunteer')
      .sort({ createdAt: -1 });

    res.json({ sessions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching attendance' });
  }
};

/**
 * Volunteer view: their own attendance history across all programs.
 */
const getMyAttendanceHistory = async (req, res) => {
  try {
    const volunteerProfile = await VolunteerProfile.findOne({ user: req.user._id });
    if (!volunteerProfile) {
      return res.status(403).json({ message: 'No Volunteer Profile found' });
    }

    const sessions = await Attendance.find({ 'checkIns.volunteer': volunteerProfile._id })
      .populate('program')
      .sort({ createdAt: -1 });

    const history = sessions.map((s) => ({
      program: s.program,
      checkedInAt: s.checkIns.find((c) => String(c.volunteer) === String(volunteerProfile._id))?.checkedInAt,
    }));

    res.json({ history });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching attendance history' });
  }
};

module.exports = { startAttendance, scanAttendance, getAttendanceForProgram, getMyAttendanceHistory };
