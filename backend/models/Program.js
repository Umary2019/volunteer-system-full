const mongoose = require('mongoose');

const programSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true }, // e.g. ICT, Student/University, Association/Departmental - free text, not hard-coded to a fixed list
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'OrganizerProfile',
      required: true,
    },
    date: { type: Date, required: true },
    startTime: { type: String, required: true }, // e.g. "09:00"
    endTime: { type: String, required: true },
    venue: { type: String, required: true },
    maxVolunteerCapacity: { type: Number, required: true },
    registrationDeadline: { type: Date, required: true },
    volunteerRoles: [{ type: String }], // flexible list, e.g. ["Registration", "Logistics"]
    imageUrl: { type: String, default: '' },

    status: {
      type: String,
      enum: ['draft', 'open', 'closed', 'cancelled', 'completed'],
      default: 'draft',
    },
    applicationsOpen: { type: Boolean, default: false },
  },
  { timestamps: true }
);

/**
 * Program editing restriction: an organizer can modify a program until one
 * day before the event date. Called before allowing edits.
 */
programSchema.methods.isModifiable = function () {
  const oneDayBeforeEvent = new Date(this.date);
  oneDayBeforeEvent.setDate(oneDayBeforeEvent.getDate() - 1);
  oneDayBeforeEvent.setHours(23, 59, 59, 999);
  return new Date() <= oneDayBeforeEvent;
};

module.exports = mongoose.model('Program', programSchema);
