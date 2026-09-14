const path = require('path');

// Ensure environment variables are loaded regardless of current working directory
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config();

if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET is missing. Set JWT_SECRET in environment variables.');
  } else {
    console.warn('[Server] Warning: JWT_SECRET is missing. Using development fallback secret.');
    process.env.JWT_SECRET = 'volunteer-system-dev-jwt-secret-fallback-2026';
  }
}

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());

// Health check endpoint (does not require DB connection)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Volunteer Management System API running' });
});

// Database connectivity check for API requests (skip for health check)
const dbConnectionMiddleware = async (req, res, next) => {
  if (req.path === '/api/health' || req.path === '/health') return next();
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('[Database Connection Error]', err.message);
    return res.status(503).json({
      message: 'Database service is temporarily unavailable. Please try again shortly.',
      error: process.env.NODE_ENV !== 'production' ? err.message : undefined,
    });
  }
};

app.use(dbConnectionMiddleware);

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/profiles', require('./routes/profileRoutes'));
app.use('/api/programs', require('./routes/programRoutes'));
app.use('/api/applications', require('./routes/applicationRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/ratings', require('./routes/ratingRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.message || err);
  if (res.headersSent) {
    return next(err);
  }
  return res.status(500).json({
    message: process.env.NODE_ENV === 'production'
      ? 'An unexpected server error occurred'
      : (err.message || 'Server error'),
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
  } catch (err) {
    console.error('[Server Start Warning] Initial DB connection failed:', err.message);
  }
  return app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

if (require.main === module) {
  startServer();
}

module.exports = app;
module.exports.app = app;
module.exports.startServer = startServer;
