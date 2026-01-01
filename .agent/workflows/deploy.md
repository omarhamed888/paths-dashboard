---
description: Deploy the project to Vercel (easiest method)
---

# 🚀 Automated Deployment Workflow

This workflow deploys your full-stack project using Vercel for both frontend and backend, with Supabase for the database.

## Prerequisites

1. **GitHub Account** - To host your repository
2. **Vercel Account** - Sign up at [vercel.com](https://vercel.com) (free tier)
3. **Supabase Account** - Already configured ✅

## Step 1: Push to GitHub

```bash
# turbo
cd "d:\1Repos\omarinteren managment\paths-dashboard"
git add .
git commit -m "Prepare for deployment"
git push origin main
```

> If you don't have a GitHub repository yet, create one at [github.com/new](https://github.com/new) and follow the instructions to push your code.

## Step 2: Deploy Backend to Vercel

### 2.1 Create New Vercel Project for Backend

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click "Import Git Repository"
3. Select your repository: `paths-dashboard`
4. Click "Import"

### 2.2 Configure Backend Deployment

**Root Directory:** `backend`

**Build Settings:**
- Framework Preset: `Other`
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

**Environment Variables** (click "Add" for each):

```env
NODE_ENV=production
PORT=5000

# Database - Get these from Supabase Dashboard
DB_HOST=YOUR_SUPABASE_DB_HOST
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=YOUR_SUPABASE_DB_PASSWORD

# Security - Generate a random 32+ character string
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-change-this
JWT_EXPIRES_IN=7d

# File Upload
UPLOAD_DIR=/tmp/uploads
MAX_FILE_SIZE=5242880

# CORS - Will update after frontend deployment
CORS_ORIGIN=*
```

### 2.3 Get Supabase Database Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project: `wiuephmqbmvdeaghmlku`
3. Click "Settings" → "Database"
4. Find "Connection String" section
5. Copy the connection details:
   - `DB_HOST`: Found in connection string (e.g., `db.xxx.supabase.co`)
   - `DB_PASSWORD`: Your database password

### 2.4 Deploy Backend

Click **"Deploy"** button

⏱️ Deployment takes ~2-3 minutes

✅ Once complete, copy your backend URL (e.g., `https://your-backend.vercel.app`)

## Step 3: Deploy Frontend to Vercel

### 3.1 Create New Vercel Project for Frontend

1. Go to [vercel.com/new](https://vercel.com/new) again
2. Select the SAME repository: `paths-dashboard`
3. Click "Import"

### 3.2 Configure Frontend Deployment

**Root Directory:** `frontend`

**Build Settings:**
- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

**Environment Variables:**

```env
VITE_API_URL=https://your-backend.vercel.app/api
```

> Replace `your-backend.vercel.app` with your actual backend URL from Step 2.4

### 3.3 Deploy Frontend

Click **"Deploy"** button

⏱️ Deployment takes ~2-3 minutes

✅ Once complete, copy your frontend URL (e.g., `https://your-frontend.vercel.app`)

## Step 4: Update CORS Configuration

Now that you have your frontend URL, update the backend's CORS setting:

1. Go to your backend project in Vercel
2. Click "Settings" → "Environment Variables"
3. Find `CORS_ORIGIN` and click "Edit"
4. Change value to your frontend URL: `https://your-frontend.vercel.app`
5. Click "Save"
6. Go to "Deployments" tab
7. Click "..." on the latest deployment → "Redeploy"

## Step 5: Initialize Database

The database schema should already be set up in Supabase. If not:

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click "SQL Editor"
4. Run the setup scripts from `database/schema.sql`

## Step 6: Test Your Deployment

### 6.1 Test Frontend
Visit your frontend URL: `https://your-frontend.vercel.app`

- ✅ Page should load
- ✅ Login form should appear

### 6.2 Test Admin Login

**Default Credentials:**
- Email: `admin@example.com`
- Password: `admin123`

> ⚠️ Change these credentials immediately after first login!

### 6.3 Verify Features
- [ ] Admin dashboard loads
- [ ] Can create/view interns
- [ ] Can create/assign tasks
- [ ] Attendance marking works

## 🎉 Deployment Complete!

Your application is now live at:
- **Frontend:** `https://your-frontend.vercel.app`
- **Backend API:** `https://your-backend.vercel.app`

## Auto-Deploy Setup (Bonus)

Both projects are now configured for automatic deployment:

- Every push to `main` branch → Automatic deployment
- Pull requests → Preview deployments
- Commit history → One-click rollbacks

## Troubleshooting

### Backend shows 500 error
- Check Vercel logs: Project → "Logs" tab
- Verify all environment variables are set correctly
- Ensure Supabase database credentials are correct

### Frontend can't connect to backend
- Check browser console for CORS errors
- Verify `VITE_API_URL` is set correctly
- Ensure `CORS_ORIGIN` on backend matches frontend URL exactly

### Database connection fails
- Verify Supabase database is running
- Check database credentials in Vercel environment variables
- Ensure Supabase allows connections (usually automatic)

## Cost Breakdown

| Service | Free Tier | Paid Plan |
|---------|-----------|-----------|
| Vercel Frontend | ✅ Unlimited | $20/month per member |
| Vercel Backend | ✅ 100GB-hrs/month | $20/month per member |
| Supabase | ✅ 500MB database, 2GB file storage | $25/month |

**Total for small project:** $0/month (free tier is sufficient)

## Next Steps

1. **Custom Domain** (Optional)
   - Add your domain in Vercel project settings
   - Update CORS_ORIGIN with custom domain

2. **Security Hardening**
   - Change default admin password
   - Generate strong JWT_SECRET
   - Review Supabase RLS (Row Level Security) policies

3. **Monitoring**
   - Enable Vercel Analytics (free)
   - Set up error alerts in Vercel

---

**Last Updated:** 2026-01-01  
**Estimated Time:** 10-15 minutes total
