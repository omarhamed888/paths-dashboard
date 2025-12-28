# 📦 Quick Start Package

This package contains everything needed to deploy the Intern Management System.

## 📂 What's Included

```
Dashboard/
├── backend/           # Backend API (Node.js + Express)
├── frontend/          # Frontend App (React + Vite)
├── database/          # Database schemas & seeds
├── DEPLOYMENT.md      # 👈 START HERE - Full deployment guide
├── SETUP.md          # Development setup
└── README.md         # This file
```

## 🚀 Quick Deploy (5 Steps)

### 1. Install Requirements
- Node.js 18+ ([Download](https://nodejs.org/))
- PostgreSQL 14+ ([Download](https://www.postgresql.org/download/))

### 2. Setup Database
```bash
createdb intern_management
psql -d intern_management -f database/schema.sql
```

### 3. Configure Backend
```bash
cd backend
cp .env.production .env
# Edit .env with your settings
npm install
npm run build
npm start
```

### 4. Configure Frontend
```bash
cd frontend
# Edit .env.production with backend URL
npm install
npm run build
```

### 5. Deploy
- Upload `frontend/dist` to your web server
- Keep backend running (use PM2 for production)

## 📖 Full Instructions

**👉 See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment guide**

Includes:
- Detailed setup instructions
- Production configuration
- Nginx setup
- Security checklist
- Troubleshooting guide

## 🔑 Default Login (After seed.sql)

- **Email**: admin@example.com
- **Password**: admin123
- ⚠️ Change immediately in production!

## 🎯 System Features

### For Admins
- 📊 Dashboard with KPIs
- 👥 Intern management
- 📝 Task creation & assignment
- 📅 Attendance tracking
- ⭐ Submission rating
- 🔔 Alert monitoring

### For Interns
- 📱 Personal dashboard
- ✅ Task submission
- 📈 Performance tracking
- 👤 Profile with photo
- 🔔 Notifications

### Automated
- Auto-alerts for absences
- Performance monitoring
- Late submission tracking

## 🛠️ Tech Stack

- **Backend**: Node.js, Express, TypeScript, PostgreSQL
- **Frontend**: React, TypeScript, Vite
- **Security**: JWT, bcrypt, httpOnly cookies

## 📞 Support

Questions? Check:
1. [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide
2. [SETUP.md](./SETUP.md) - Development guide
3. Contact developer: [Your Contact]

## 🔄 System Health

To verify deployment:
- Backend: Should run on port 5000
- Frontend: Should serve from dist folder
- Database: 7 tables created successfully

## 📦 Deployment Checklist

- [ ] PostgreSQL installed and running
- [ ] Database created with schema.sql
- [ ] Backend .env configured
- [ ] Backend built and running
- [ ] Frontend .env.production configured
- [ ] Frontend built successfully
- [ ] Frontend deployed to web server
- [ ] HTTPS enabled (recommended)
- [ ] Default password changed
- [ ] Backups configured

---

**Project**: Intern Management System
**Version**: 1.0.0
**Status**: ✅ Production Ready
**Date**: December 28, 2025
