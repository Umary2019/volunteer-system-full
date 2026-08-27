const Notification = require('../models/Notification');
const User = require('../models/User');
const sendEmail = require('./sendEmail');

/**
 * Creates an in-app notification for a user, and optionally emails them too.
 * userId: the User._id to notify
 */
const notifyUser = async ({ userId, type, title, message, relatedProgram = null, relatedApplication = null, alsoEmail = false }) => {
  await Notification.create({
    user: userId,
    type,
    title,
    message,
    relatedProgram,
    relatedApplication,
  });

  if (alsoEmail) {
    const user = await User.findById(userId);
    if (user) {
      await sendEmail({
        to: user.email,
        subject: title,
        html: `<p>${message}</p>`,
      });
    }
  }
};

module.exports = notifyUser;
