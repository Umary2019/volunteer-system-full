const mongoose = require('mongoose');

const volunteerProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // one volunteer profile per user
    },
    fullName: { type: String, required: true },
    matricNumber: { type: String, required: true },
    department: { type: String, required: true },
    faculty: { type: String, required: true },
    level: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    areasOfInterest: [{ type: String }],
    previousVolunteerParticipation: { type: String, default: '' },

    // Aggregated stats, updated as the volunteer participates - used for ranking
    overallRating: { type: Number, default: 0 },
    totalRatingsCount: { type: Number, default: 0 },
    attendanceRate: { type: Number, default: 0 }, // percentage 0-100
    programsCompleted: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('VolunteerProfile', volunteerProfileSchema);
