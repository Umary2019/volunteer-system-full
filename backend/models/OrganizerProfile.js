const mongoose = require('mongoose');

const organizerProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // one organizer profile per user
    },
    name: { type: String, required: true },
    department: { type: String, required: true },
    faculty: { type: String, required: true },
    organization: { type: String, required: true }, // Organization/Association
    position: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    reasonForRequest: { type: String, required: true },
    otherInfo: { type: String, default: '' },

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    rejectionReason: { type: String, default: '' },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // the admin who approved/rejected
      default: null,
    },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('OrganizerProfile', organizerProfileSchema);
