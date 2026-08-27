/**
 * Seeds (or updates) the single admin account from environment variables.
 * Run with: npm run seed:admin
 *
 * Credentials live in .env (never committed to git, see .gitignore) and are
 * hashed before being stored - the plaintext password is never saved to the DB.
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');

const run = async () => {
  const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = process.env;

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env before seeding.');
    process.exit(1);
  }

  await connectDB();

  const existing = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });

  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);

  if (existing) {
    existing.password = hashedPassword;
    existing.role = 'admin';
    existing.isEmailVerified = true;
    existing.isActive = true;
    await existing.save();
    console.log(`Admin account updated for ${ADMIN_EMAIL}`);
  } else {
    await User.create({
      email: ADMIN_EMAIL.toLowerCase(),
      password: hashedPassword,
      role: 'admin',
      isEmailVerified: true,
      isActive: true,
    });
    console.log(`Admin account created for ${ADMIN_EMAIL}`);
  }

  console.log('Admin name for reference:', ADMIN_NAME || '(not set)');
  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error('Failed to seed admin:', err);
  process.exit(1);
});
