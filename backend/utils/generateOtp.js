/**
 * Generates a 6-digit numeric OTP code as a string, e.g. "045213".
 */
const crypto = require('crypto');

const generateOtp = () => crypto.randomInt(100000, 1000000).toString();

module.exports = generateOtp;
