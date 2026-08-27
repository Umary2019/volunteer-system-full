const mongoose = require('mongoose');

/**
 * A single account per person.
 * role: 'user' for normal students (they layer Volunteer/Organizer profiles on top),
 *       'admin' for the system-level administrator account.
 * A 'user' does NOT choose volunteer/organizer at registration - profiles are separate documents
 * referenced from here, created later, optionally both.
 */
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true, // always stored hashed, never plaintext
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    // References - a user can have 0 or 1 of each
    volunteerProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VolunteerProfile',
      default: null,
    },
    organizerProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'OrganizerProfile',
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true, // account activated after OTP verification
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
