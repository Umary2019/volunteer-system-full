const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const mongoose = require('mongoose');

const connectDB = require('../config/db');
const { app } = require('../server');
const User = require('../models/User');
const Otp = require('../models/Otp');

let server;
let baseUrl;

before(async () => {
  await connectDB();
  // Clear test users and otps
  await User.deleteMany({ email: /test.*@example\.com/ });
  await Otp.deleteMany({ email: /test.*@example\.com/ });

  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      console.log(`[Test Server] Running on ${baseUrl}`);
      resolve();
    });
  });
});

after(async () => {
  await User.deleteMany({ email: /test.*@example\.com/ });
  await Otp.deleteMany({ email: /test.*@example\.com/ });
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await mongoose.connection.close();
});

describe('MongoDB Authentication Flow - Registration & Login', () => {
  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = 'Password123!';

  // --- Registration Tests ---

  it('1. Returns 400 when registration fields are missing', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail }),
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.match(body.message, /Email and password are required/i);
  });

  it('2. Returns 400 for password less than 8 characters', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: 'short' }),
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.match(body.message, /at least 8 characters/i);
  });

  it('3. Returns 400 for invalid email format', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email', password: testPassword }),
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.match(body.message, /valid email/i);
  });

  it('4. Successfully registers new user (returns 201)', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.email, testEmail.toLowerCase());

    const createdUser = await User.findOne({ email: testEmail.toLowerCase() });
    assert.ok(createdUser);
    assert.equal(createdUser.isEmailVerified, false);
    // Password must be hashed with bcrypt, never plaintext
    assert.notEqual(createdUser.password, testPassword);
    assert.ok(createdUser.password.startsWith('$2'));
  });

  it('5. Re-registering unverified user updates record and resends OTP', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });
    assert.equal(res.status, 201);
  });

  // --- Login Tests (Before Verification) ---

  it('6. Returns 403 when trying to log in with unverified email', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.match(body.message, /verify your email/i);
  });

  // --- Verification Flow ---

  it('7. Verifies user via OTP code', async () => {
    const otpRecord = await Otp.findOne({ email: testEmail.toLowerCase() }).sort({ createdAt: -1 });
    assert.ok(otpRecord);

    const res = await fetch(`${baseUrl}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, code: otpRecord.code }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.token);
    assert.equal(body.user.email, testEmail.toLowerCase());

    const verifiedUser = await User.findOne({ email: testEmail.toLowerCase() });
    assert.equal(verifiedUser.isEmailVerified, true);
    assert.equal(verifiedUser.isActive, true);
  });

  // --- Duplicate Registration After Verification ---

  it('8. Returns 409 for duplicate registration of verified account', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });
    assert.equal(res.status, 409);
    const body = await res.json();
    assert.match(body.message, /already exists/i);
  });

  // --- Login Tests (After Verification) ---

  it('9. Returns 400 when login fields are missing', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail }),
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.match(body.message, /Email and password are required/i);
  });

  it('10. Returns 401 for nonexistent user', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nonexistent_user_999@example.com', password: 'Password123!' }),
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.match(body.message, /Invalid email or password/i);
  });

  it('11. Returns 401 for incorrect password', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: 'WrongPassword123' }),
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.match(body.message, /Invalid email or password/i);
  });

  it('12. Successfully logs in with valid credentials (returns 200 + token + user)', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.message, 'Login successful');
    assert.ok(body.token, 'Must return JWT token');
    assert.equal(body.user.email, testEmail.toLowerCase());
    assert.equal(body.user.role, 'user');
    // Ensure sensitive fields (passwords) are NEVER exposed
    assert.equal(body.user.password, undefined);
  });

  it('13. URL Normalization: /auth/login works identically to /api/auth/login', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.message, 'Login successful');
    assert.ok(body.token);
  });

  it('14. Accesses protected /api/auth/me endpoint using token', async () => {
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });
    const { token } = await loginRes.json();

    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(meRes.status, 200);
    const meBody = await meRes.json();
    assert.equal(meBody.user.email, testEmail.toLowerCase());
  });
});
