# Volunteer System - Debugging & Deployment Guide

## 🚨 Current Issues Fixed

### Issue 1: Broken Vercel Serverless Export ✅
**Problem:** `api/index.js` was incorrectly trying to call `app` as a function
```javascript
// ❌ WRONG (was calling app as function)
module.exports = (req, res) => {
  return app(req, res);
};
```

**Solution:** Express app objects work directly as Vercel handlers
```javascript
// ✅ CORRECT
module.exports = app;
```

### Issue 2: Database Connection Middleware Issues ✅
**Problems:**
- Connection timeout was too aggressive (5s) - Vercel can be slow
- Path doubling middleware was corrupting URLs
- Every request tried to reconnect to database

**Solutions:**
- Increased timeouts to 10s for production
- Removed path manipulation middleware
- Better error logging for debugging

### Issue 3: Missing Environment Variables on Vercel ✅
**Problem:** `.env` file is not deployed to Vercel
**Solution:** Configure all variables manually in Vercel dashboard

---

## 📋 DEPLOYMENT CHECKLIST

### Step 1: Add Environment Variables to Vercel
Go to: https://vercel.com/dashboard → Your Project → Settings → Environment Variables

Add these variables:
```
MONGO_URI=mongodb+srv://umarelnafatee_db_user:Umary2019@kolleproject.h5orncc.mongodb.net/?appName=kolleproject
JWT_SECRET=volunteer-system-local-development-secret-2026
JWT_EXPIRES_IN=7d
NODE_ENV=production

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=usmanadamuusman94@gmail.com
EMAIL_PASS=kjlompfpwmmskegx

ADMIN_EMAIL=usmanadamuusman94@gmail.com
ADMIN_PASSWORD=usmana2004
ADMIN_NAME=System Administrator

FRONTEND_URL=https://volunteer-system-full.vercel.app
```

**⚠️ SECURITY WARNING:** Do NOT commit `.env` file with passwords to git!

### Step 2: Check MongoDB Atlas Whitelist
1. Go to: https://cloud.mongodb.com
2. Navigate to: Network Access → IP Whitelist
3. Add Vercel IP address: `0.0.0.0/0` or use Vercel's IP ranges
4. Ensure your IP allows incoming connections

### Step 3: Redeploy on Vercel
```bash
git add .
git commit -m "Fix: Database connection and Vercel serverless handler"
git push origin main
```

Vercel will automatically redeploy. Monitor logs at:
https://vercel.com/dashboard → Your Project → Deployments → Logs

---

## 🔍 Testing & Verification

### Test 1: Health Check (No DB Required)
```bash
curl https://volunteer-system-full.vercel.app/api/health
```
Expected: `{"status":"ok","message":"Volunteer Management System API running"}`

### Test 2: Login Endpoint (DB Required)
```bash
curl -X POST https://volunteer-system-full.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Test 3: Check Logs
In Vercel dashboard:
1. Go to Deployments
2. Click on the latest deployment
3. Check "Function Logs" for any errors

---

## 📊 API Routes Overview

| Method | Route | Purpose | Auth |
|--------|-------|---------|------|
| POST | `/api/auth/register` | Create account | ❌ |
| POST | `/api/auth/verify-otp` | Verify email | ❌ |
| POST | `/api/auth/login` | Login user | ❌ |
| GET | `/api/auth/me` | Get current user | ✅ |
| POST | `/api/profiles/volunteer` | Create volunteer profile | ✅ |
| POST | `/api/profiles/organizer` | Create organizer profile | ✅ |
| POST | `/api/programs` | Create program | ✅ |
| GET | `/api/programs` | List programs | ❌ |
| POST | `/api/applications` | Apply to program | ✅ |
| GET | `/api/health` | Health check | ❌ |

---

## 🐛 Troubleshooting

### Error: "Database service is temporarily unavailable"

**Cause 1: MONGO_URI not set**
- ✅ Solution: Add MONGO_URI to Vercel Environment Variables

**Cause 2: MongoDB network timeout**
- ✅ Solution: Whitelist `0.0.0.0/0` in MongoDB Atlas Network Access

**Cause 3: Wrong credentials**
- ✅ Solution: Verify MONGO_URI includes correct username:password
- Check that special characters in password are URL encoded

**Cause 4: MongoDB connection limit exceeded**
- ✅ Solution: MongoDB free tier has 500 connections limit
- Each Vercel function creates new connection
- Use connection pooling with `connectTimeoutMS` settings

### Error: "Failed to load resource: 404"

**Cause 1: Frontend API URL misconfigured**
- Check: `frontend/src/api/client.js` - `baseURL` should be `/api`
- Check: `VITE_API_URL` environment variable in frontend

**Cause 2: Routes not registered**
- Verify routes in `backend/server.js`:
```javascript
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/profiles', require('./routes/profileRoutes'));
// ... etc
```

### Error: "Failed to load resource: 503"

This is the database connection error. Follow the checklist above.

---

## 🔧 Local Testing

To test locally before deploying:

```bash
# Terminal 1: Start MongoDB (if using local)
mongod

# Terminal 2: Start backend
cd backend
npm install
npm run dev

# Terminal 3: Start frontend
cd frontend
npm install
npm run dev
```

Visit: http://localhost:5173 (frontend)
API: http://localhost:5000/api

---

## 📝 Key Files Modified

1. **`api/index.js`** - Fixed serverless handler export
2. **`backend/server.js`** - Improved middleware and error handling
3. **`backend/config/db.js`** - Better connection management and logging

---

## 🚀 Next Steps

1. Add all environment variables to Vercel
2. Whitelist Vercel IP in MongoDB Atlas
3. Redeploy to Vercel
4. Test health endpoint first
5. Test login endpoint
6. Check Vercel logs for any errors
7. Monitor MongoDB Atlas metrics

---

## 📞 Quick Commands

```bash
# Push changes to Vercel
git push origin main

# Check deployment status
vercel status

# View logs
vercel logs --follow

# Rollback to previous version
vercel rollback
```

---

## ⚡ Performance Tips for Vercel

1. **Connection Pooling:** MongoDB Vercel connector can reuse connections
2. **Caching:** Use Redis for session storage if scaling
3. **Database Indexing:** Ensure indexes on frequently queried fields
4. **Cold Starts:** Minimize dependencies in `api/index.js`

---

**Last Updated:** 2026-09-14
**Status:** Ready for deployment ✅
