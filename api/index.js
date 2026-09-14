const path = require('path');

// Ensure environment variables are loaded in Vercel serverless functions
require('dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config();

const { app } = require('../backend/server');
const connectDB = require('../backend/config/db');

module.exports = async (req, res) => {
  try {
    await connectDB();
    return app(req, res);
  } catch (error) {
    console.error('[Vercel Serverless Function Error]', error.message || error);
    return res.status(503).json({ message: 'Database unavailable' });
  }
};