const Program = require('../models/Program');
const OrganizerProfile = require('../models/OrganizerProfile');
const VolunteerProfile = require('../models/VolunteerProfile');
const { sortProgramsByRelevance } = require('../utils/recommendation');

const isValidTime = (value) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

/**
 * Confirms the logged-in user has an APPROVED organizer profile.
 * Returns the OrganizerProfile document or null.
 */
const getApprovedOrganizerProfile = async (userId) => {
  const profile = await OrganizerProfile.findOne({ user: userId, status: 'approved' });
  return profile;
};

const createProgram = async (req, res) => {
  try {
    const organizerProfile = await getApprovedOrganizerProfile(req.user._id);
    if (!organizerProfile) {
      return res.status(403).json({ message: 'Only approved organizers can create programs' });
    }

    const {
      title,
      description,
      category,
      date,
      startTime,
      endTime,
      venue,
      maxVolunteerCapacity,
      registrationDeadline,
      volunteerRoles,
      imageUrl,
    } = req.body;

    if (!title || !description || !category || !date || !startTime || !endTime || !venue || !maxVolunteerCapacity || !registrationDeadline) {
      return res.status(400).json({ message: 'Missing required program fields' });
    }
    if (!Number.isInteger(Number(maxVolunteerCapacity)) || Number(maxVolunteerCapacity) < 1 || Number.isNaN(new Date(date).getTime()) || Number.isNaN(new Date(registrationDeadline).getTime()) || new Date(registrationDeadline) > new Date(date) || !isValidTime(startTime) || !isValidTime(endTime) || startTime >= endTime) {
      return res.status(400).json({ message: 'Capacity, dates, and times are invalid' });
    }

    const program = await Program.create({
      title,
      description,
      category, // free text - new categories/programs are allowed, nothing hard-coded
      organizer: organizerProfile._id,
      date,
      startTime,
      endTime,
      venue,
      maxVolunteerCapacity,
      registrationDeadline,
      volunteerRoles: volunteerRoles || [],
      imageUrl: imageUrl || '',
      status: 'draft',
      applicationsOpen: false,
    });

    res.status(201).json({ message: 'Program created', program });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating program' });
  }
};

/**
 * Edit a program - blocked once we're within 1 day of the event date (spec section 10).
 */
const updateProgram = async (req, res) => {
  try {
    const organizerProfile = await getApprovedOrganizerProfile(req.user._id);
    if (!organizerProfile) {
      return res.status(403).json({ message: 'Only approved organizers can edit programs' });
    }

    const program = await Program.findById(req.params.id);
    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }
    if (String(program.organizer) !== String(organizerProfile._id)) {
      return res.status(403).json({ message: 'You do not own this program' });
    }
    if (!program.isModifiable()) {
      return res.status(403).json({ message: 'This program is locked and can no longer be modified (within 1 day of event)' });
    }
    const nextDate = req.body.date || program.date;
    const nextStartTime = req.body.startTime || program.startTime;
    const nextEndTime = req.body.endTime || program.endTime;
    const nextDeadline = req.body.registrationDeadline || program.registrationDeadline;
    const nextCapacity = req.body.maxVolunteerCapacity ?? program.maxVolunteerCapacity;
    if (!Number.isInteger(Number(nextCapacity)) || Number(nextCapacity) < 1 || Number.isNaN(new Date(nextDate).getTime()) || Number.isNaN(new Date(nextDeadline).getTime()) || new Date(nextDeadline) > new Date(nextDate) || !isValidTime(nextStartTime) || !isValidTime(nextEndTime) || nextStartTime >= nextEndTime) {
      return res.status(400).json({ message: 'Capacity, dates, and times are invalid' });
    }

    const editableFields = [
      'title', 'description', 'category', 'date', 'startTime', 'endTime',
      'venue', 'maxVolunteerCapacity', 'registrationDeadline', 'volunteerRoles', 'imageUrl',
    ];
    editableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        program[field] = req.body[field];
      }
    });

    await program.save();
    res.json({ message: 'Program updated', program });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating program' });
  }
};

/**
 * Cancel/delete a program.
 */
const cancelProgram = async (req, res) => {
  try {
    const organizerProfile = await getApprovedOrganizerProfile(req.user._id);
    if (!organizerProfile) {
      return res.status(403).json({ message: 'Only approved organizers can cancel programs' });
    }

    const program = await Program.findById(req.params.id);
    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }
    if (String(program.organizer) !== String(organizerProfile._id)) {
      return res.status(403).json({ message: 'You do not own this program' });
    }

    program.status = 'cancelled';
    program.applicationsOpen = false;
    await program.save();

    res.json({ message: 'Program cancelled', program });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error cancelling program' });
  }
};

/**
 * Open / close / reopen applications for a program.
 */
const setApplicationsOpenState = async (req, res) => {
  try {
    const { open } = req.body;
    if (typeof open !== 'boolean') {
      return res.status(400).json({ message: 'The open field must be a boolean' });
    }
    const organizerProfile = await getApprovedOrganizerProfile(req.user._id);
    if (!organizerProfile) {
      return res.status(403).json({ message: 'Only approved organizers can manage applications' });
    }

    const program = await Program.findById(req.params.id);
    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }
    if (program.status === 'cancelled') {
      return res.status(400).json({ message: 'Cancelled programs cannot reopen applications' });
    }
    if (String(program.organizer) !== String(organizerProfile._id)) {
      return res.status(403).json({ message: 'You do not own this program' });
    }

    program.applicationsOpen = !!open;
    program.status = open ? 'open' : 'closed';
    await program.save();

    res.json({ message: `Applications ${open ? 'opened' : 'closed'}`, program });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating application state' });
  }
};

/**
 * Browse/search/filter all programs. Available to any logged-in user,
 * even one without any profile yet (spec section 23).
 * If the user has a Volunteer Profile, results are ordered by relevance (recommendation),
 * but nothing is excluded.
 */
const listPrograms = async (req, res) => {
  try {
    const { search, category, status } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { title: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
        { description: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
      ];
    }
    if (category) filter.category = category;
    if (status) filter.status = status;
    else filter.status = { $ne: 'cancelled' };

    let programs = await Program.find(filter).populate('organizer', 'name organization').sort({ date: 1 });

    if (req.user && req.user.volunteerProfile) {
      const volunteerProfile = await VolunteerProfile.findById(req.user.volunteerProfile);
      if (volunteerProfile) {
        programs = sortProgramsByRelevance(programs, volunteerProfile);
      }
    }

    res.json({ programs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error listing programs' });
  }
};

const getProgramById = async (req, res) => {
  try {
    const program = await Program.findById(req.params.id).populate('organizer', 'name organization');
    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }
    res.json({ program });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching program' });
  }
};

/**
 * Programs created by the logged-in organizer.
 */
const getMyPrograms = async (req, res) => {
  try {
    const organizerProfile = await OrganizerProfile.findOne({ user: req.user._id });
    if (!organizerProfile) {
      return res.status(404).json({ message: 'No Organizer Profile found' });
    }
    const programs = await Program.find({ organizer: organizerProfile._id }).sort({ date: 1 });
    res.json({ programs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching your programs' });
  }
};

module.exports = {
  createProgram,
  updateProgram,
  cancelProgram,
  setApplicationsOpenState,
  listPrograms,
  getProgramById,
  getMyPrograms,
};
