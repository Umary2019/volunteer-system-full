const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'new_program',
        'application_status',
        'upcoming_program',
        'organizer_update',
        'attendance_info',
        'profile_status_change',
        'volunteer_removed',
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    relatedProgram: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', default: null },
    relatedApplication: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
