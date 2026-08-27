const mongoose = require('mongoose');

let connectionPromise;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (connectionPromise) return connectionPromise;
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is missing. Create backend/.env from .env.example.');
  }

  connectionPromise = mongoose.connect(process.env.MONGO_URI)
    .then((conn) => {
      console.log(`MongoDB connected: ${conn.connection.host}`);
      return conn.connection;
    })
    .catch((error) => {
      connectionPromise = null;
      console.error(`MongoDB connection error: ${error.message}`);
      throw error;
    });

  return connectionPromise;
};

module.exports = connectDB;
