const mongoose = require('mongoose');

/**
 * One Attendance document per program per "session" the organizer opens.
 * Stores the active QR token and which applications have checked in.
 */
const attendanceSchema = new mongoose.Schema(
  {
    program: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Program',
      required: true,
    },
    qrToken: { type: String, required: true }, // random token embedded in the QR code
    qrExpiresAt: { type: Date, required: true },
    isActive: { type: Boolean, default: true },

    checkIns: [
      {
        application: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true },
        volunteer: { type: mongoose.Schema.Types.ObjectId, ref: 'VolunteerProfile', required: true },
        checkedInAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Attendance', attendanceSchema);
