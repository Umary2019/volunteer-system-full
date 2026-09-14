const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Otp = require('../models/Otp');
const generateOtp = require('../utils/generateOtp');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');

const OTP_EXPIRY_MINUTES = 10;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Step 1 of registration: create an unverified account and email an OTP.
 * No role/profile selection happens here - just a normal account.
 */
const register = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    if (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing && existing.isEmailVerified) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    let user;
    if (existing && !existing.isEmailVerified) {
      // Re-registering before verifying - update password and resend OTP
      existing.password = hashedPassword;
      user = await existing.save();
    } else {
      user = await User.create({
        email: normalizedEmail,
        password: hashedPassword,
        isEmailVerified: false,
        isActive: false,
      });
    }

    const code = generateOtp();
    await Otp.create({
      email: user.email,
      code,
      purpose: 'email_verification',
      expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
    });

    let emailSent = false;
    try {
      emailSent = await sendEmail({
        to: user.email,
        subject: 'Verify your email - Student Volunteer Program',
        html: `<p>Your verification code is:</p><h2>${code}</h2><p>This code expires in ${OTP_EXPIRY_MINUTES} minutes.</p>`,
      });
    } catch (mailErr) {
      console.warn(`[Register] Email sending failed: ${mailErr.message}`);
    }

    if (!emailSent) {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[DEV OTP] Verification code for ${user.email}: ${code}`);
        return res.status(201).json({
          message: 'Account created. Development mode: verification code logged to server console.',
          email: user.email,
          devOtp: code,
        });
      }
      return res.status(503).json({
        message: 'Account created, but verification email could not be delivered. Check email configuration and resend the code.',
      });
    }

    return res.status(201).json({
      message: 'Account created. Please check your email for the verification code.',
      email: user.email,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }
    console.error('[Register Error]', error.message || error);
    return res.status(500).json({ message: 'Server error during registration' });
  }
};

/**
 * Step 2: verify the OTP code, activate the account, and log the user in.
 */
const verifyOtp = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ message: 'Email and code are required' });
    }

    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const normalizedCode = typeof code === 'string' ? code.trim() : String(code);

    const otpRecord = await Otp.findOne({
      email: normalizedEmail,
      code: normalizedCode,
      purpose: 'email_verification',
      isUsed: false,
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }
    if (otpRecord.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Verification code has expired, please request a new one' });
    }

    otpRecord.isUsed = true;
    await otpRecord.save();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ message: 'Account not found' });
    }

    user.isEmailVerified = true;
    user.isActive = true;
    await user.save();

    const token = generateToken(user._id, user.role);

    return res.status(200).json({
      message: 'Email verified successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        hasVolunteerProfile: !!user.volunteerProfile,
        hasOrganizerProfile: !!user.organizerProfile,
      },
    });
  } catch (error) {
    console.error('[Verify OTP Error]', error.message || error);
    return res.status(500).json({ message: 'Server error during OTP verification' });
  }
};

/**
 * Resend a fresh OTP code (e.g. if the previous one expired).
 */
const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ message: 'Email is required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ message: 'Account not found' });
    }
    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'This account is already verified' });
    }

    const code = generateOtp();
    await Otp.create({
      email: user.email,
      code,
      purpose: 'email_verification',
      expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
    });

    let emailSent = false;
    try {
      emailSent = await sendEmail({
        to: user.email,
        subject: 'Your new verification code',
        html: `<p>Your new verification code is:</p><h2>${code}</h2><p>This code expires in ${OTP_EXPIRY_MINUTES} minutes.</p>`,
      });
    } catch (mailErr) {
      console.warn(`[Resend OTP] Email sending failed: ${mailErr.message}`);
    }

    if (!emailSent) {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[DEV OTP] Resent verification code for ${user.email}: ${code}`);
        return res.status(200).json({
          message: 'A new verification code has been generated (check server console in development).',
          devOtp: code,
        });
      }
      return res.status(503).json({
        message: 'Verification email could not be delivered. Check email configuration and try again.',
      });
    }

    return res.status(200).json({ message: 'A new verification code has been sent to your email' });
  } catch (error) {
    console.error('[Resend OTP Error]', error.message || error);
    return res.status(500).json({ message: 'Server error while resending code' });
  }
};

/**
 * Login for both normal users and the admin account (same endpoint - role comes back in the response).
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ message: 'Email and password must be valid strings' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({ message: 'Please verify your email before logging in' });
    }
    if (!user.isActive) {
      return res.status(403).json({ message: 'This account has been deactivated' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user._id, user.role);

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        hasVolunteerProfile: !!user.volunteerProfile,
        hasOrganizerProfile: !!user.organizerProfile,
      },
    });
  } catch (error) {
    console.error('[Login Error]', error.message || error);
    return res.status(500).json({ message: 'Server error during login' });
  }
};

/**
 * Returns the currently logged-in user's basic info (used on app load to restore session).
 */
const getMe = async (req, res) => {
  return res.status(200).json({
    user: {
      id: req.user._id,
      email: req.user.email,
      role: req.user.role,
      hasVolunteerProfile: !!req.user.volunteerProfile,
      hasOrganizerProfile: !!req.user.organizerProfile,
    },
  });
};

module.exports = { register, verifyOtp, resendOtp, login, getMe };
