# Volunteer System

## Local development

1. Install dependencies from the project root:

   ```bash
   npm install
   npm --prefix frontend install
   npm --prefix backend install
   ```

2. Copy `backend/.env.example` to `backend/.env` and set MongoDB, JWT, SMTP, and admin values.

3. Start MongoDB, then run the applications in separate terminals:

   ```bash
   npm run dev:backend
   npm run dev:frontend
   ```

   Open `http://localhost:5173`.

## Vercel deployment

This repository is configured as one Vercel project. The frontend builds from `frontend/`, and the Express API is exposed through `api/index.js`.

1. Push the project to GitHub and import the repository into Vercel.
2. Keep the Vercel project root at the repository root. The included `vercel.json` supplies the install, build, output, function, and SPA rewrite settings.
3. Add these Vercel Environment Variables for Production, Preview, and Development as appropriate:

   ```text
   MONGO_URI
   JWT_SECRET
   JWT_EXPIRES_IN=7d
   EMAIL_HOST
   EMAIL_PORT=587
   EMAIL_USER
   EMAIL_PASS
   FRONTEND_URL=https://your-project.vercel.app
   ADMIN_EMAIL
   ADMIN_PASSWORD
   ADMIN_NAME=System Administrator
   ```

4. Allow the Vercel deployment IP/network in MongoDB Atlas Network Access. For a quick test, Atlas supports `0.0.0.0/0`, but production should use a restricted policy where possible.
5. Deploy. Verify `https://your-project.vercel.app/api/health`.
6. Seed the admin against the production database from a secure machine or one-time job:

   ```bash
   npm run seed:admin
   ```

Do not commit `backend/.env`, tokens, passwords, or private connection strings. Vercel environment variables are not read from local `.env` files during deployment.