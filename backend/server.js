require('dotenv').config();
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is missing. Create backend/.env from .env.example.');
}
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || true }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Volunteer Management System API running' });
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/profiles', require('./routes/profileRoutes'));
app.use('/api/programs', require('./routes/programRoutes'));
app.use('/api/applications', require('./routes/applicationRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/ratings', require('./routes/ratingRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

if (require.main === module) {
  startServer().catch(() => process.exit(1));
}

module.exports = { app, startServer };
