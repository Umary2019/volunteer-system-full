const path = require('path');
const mongoose = require('mongoose');

// Ensure environment variables are loaded regardless of current working directory
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
require('dotenv').config();

let connectionPromise = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  if (connectionPromise) {
    return connectionPromise;
  }

  let mongoUri = process.env.MONGO_URI;

  // Handle unpopulated template placeholder from MongoDB Atlas connection string
  if (mongoUri && (mongoUri.includes('<db_password>') || mongoUri.includes('<password>'))) {
    console.warn('[MongoDB] Warning: MONGO_URI contains unpopulated password placeholder (<db_password>).');
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[MongoDB] Falling back to local MongoDB at mongodb://127.0.0.1:27017/volunteer_system');
      mongoUri = 'mongodb://127.0.0.1:27017/volunteer_system';
    } else {
      throw new Error('MONGO_URI contains placeholder <db_password>. Please configure the database password.');
    }
  }

  if (!mongoUri) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[MongoDB] MONGO_URI is missing. Falling back to local MongoDB.');
      mongoUri = 'mongodb://127.0.0.1:27017/volunteer_system';
    } else {
      throw new Error('MONGO_URI is missing. Please set MONGO_URI in environment variables on Vercel.');
    }
  }

  const connectionOptions = {
    serverSelectionTimeoutMS: process.env.NODE_ENV === 'production' ? 10000 : 5000,
    socketTimeoutMS: process.env.NODE_ENV === 'production' ? 45000 : 30000,
    connectTimeoutMS: process.env.NODE_ENV === 'production' ? 10000 : 5000,
    retryWrites: true,
    w: 'majority',
  };

  console.log(`[MongoDB] Attempting connection to: ${mongoUri.replace(/:[^:]*@/, ':***@')}`);
  console.log(`[MongoDB] Environment: ${process.env.NODE_ENV}, Timeout: ${connectionOptions.serverSelectionTimeoutMS}ms`);

  connectionPromise = mongoose
    .connect(mongoUri, connectionOptions)
    .then((conn) => {
      console.log(`[MongoDB] ✓ Successfully connected to: ${conn.connection.host}`);
      return conn.connection;
    })
    .catch((error) => {
      connectionPromise = null;
      console.error(`[MongoDB] ✗ Connection error: ${error.message}`);
      if (error.message.includes('ECONNREFUSED')) {
        console.error('[MongoDB] Hint: MongoDB server is not running or not accessible');
      } else if (error.message.includes('authentication failed')) {
        console.error('[MongoDB] Hint: Check MONGO_URI credentials in environment variables');
      } else if (error.message.includes('ETIMEDOUT')) {
        console.error('[MongoDB] Hint: Network timeout - check MongoDB Atlas firewall whitelist');
      }
      throw error;
    });

  return connectionPromise;
};

module.exports = connectDB;
