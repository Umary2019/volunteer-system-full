const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Sends an email. Used for OTP codes and all system notifications
 * (organizer approval/rejection, application status, volunteer removal, etc).
 */
const sendEmail = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({
      from: `"Student Volunteer Program" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error.message);
    // Do not throw - a failed email should not necessarily break the request flow
    // for non-critical notifications. Callers that need guaranteed delivery (OTP)
    // should check this and handle accordingly.
    return false;
  }
  return true;
};

module.exports = sendEmail;
