const path = require('path');

// Ensure environment variables are loaded in Vercel serverless functions
require('dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config();

const { app } = require('../backend/server');

module.exports = (req, res) => {
  return app(req, res);
};