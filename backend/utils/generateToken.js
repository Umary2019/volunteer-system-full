const jwt = require('jsonwebtoken');

const generateToken = (userId, role) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET is not configured on the server');
    }
    console.warn('[Auth] Warning: JWT_SECRET not configured, using fallback secret for development.');
    return jwt.sign({ id: userId, role }, 'volunteer-system-dev-jwt-secret-fallback', {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
  }
  return jwt.sign({ id: userId, role }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

module.exports = generateToken;
