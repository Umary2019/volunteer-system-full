const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    volunteer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VolunteerProfile',
      required: true,
    },
    program: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Program',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'completed'],
      default: 'pending',
    },
    rejectionReason: { type: String, default: '' },

    assignedRole: { type: String, default: '' },

    // Set when an already-approved volunteer is removed by the organizer
    removedReason: { type: String, default: '' },
    isRemoved: { type: Boolean, default: false },

    // Decision-support ranking score computed at the time the organizer views applicants
    // (not persisted as a permanent rank - recomputed on demand). Kept here only if we want history.
  },
  { timestamps: true }
);

// A volunteer cannot apply to the same program twice
applicationSchema.index({ volunteer: 1, program: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);
