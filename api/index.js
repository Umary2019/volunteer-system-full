const { app } = require('../backend/server');
const connectDB = require('../backend/config/db');

module.exports = async (req, res) => {
  try {
    await connectDB();
    return app(req, res);
  } catch (error) {
    return res.status(503).json({ message: 'Database unavailable' });
  }
};