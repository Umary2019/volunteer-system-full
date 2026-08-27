const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema(
  {
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      required: true,
      unique: true, // one rating per application
    },
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
    ratedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    punctuality: { type: Number, min: 1, max: 5, required: true },
    commitment: { type: Number, min: 1, max: 5, required: true },
    teamwork: { type: Number, min: 1, max: 5, required: true },
    communication: { type: Number, min: 1, max: 5, required: true },
    taskCompletion: { type: Number, min: 1, max: 5, required: true },
    overallRating: { type: Number, min: 1, max: 5, required: true },
    comments: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Rating', ratingSchema);
