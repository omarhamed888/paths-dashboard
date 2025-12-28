# Intern Management System - Deployment Guide

##  Overview
Production-ready Intern Management System for Paths4 AI with automated monitoring, task management, and attendance tracking.

##  Technology Stack

### Backend
- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL 14+
- **Authentication**: JWT with httpOnly cookies
- **File Storage**: Local file system (configurable to cloud storage)

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **State Management**: React Context API
- **Routing**: React Router v6
- **Styling**: Vanilla CSS with CSS Variables

##  Deployment Steps

### 1. Prerequisites
- Node.js 18 or higher
- PostgreSQL 14 or higher
- npm or yarn package manager
- 500MB+ disk space for file uploads

### 2. Database Setup

```bash
# Create PostgreSQL database
createdb intern_management

# Run schema
psql -d intern_management -f database/schema.sql

# (Optional) Load sample data for testing
psql -d intern_management -f database/seed.sql
```

### 3. Backend Configuration

Create `backend/.env` file:

```env
# Server Configuration
PORT=5000
NODE_ENV=production

# Database Connection
DB_HOST=localhost
DB_PORT=5432
DB_NAME=intern_management
DB_USER=your_db_user
DB_PASSWORD=your_secure_password

# Security
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=7d

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880

# CORS (Frontend URL)
CORS_ORIGIN=https://your-frontend-domain.com
```

### 4. Backend Deployment

```bash
cd backend

# Install dependencies
npm install --production

# Build TypeScript
npm run build

# Start production server
npm start

# OR use PM2 for process management
npm install -g pm2
pm2 start dist/server.js --name "intern-api"
pm2 save
pm2 startup
```

### 5. Frontend Configuration

Create `frontend/.env.production`:

```env
VITE_API_URL=https://your-backend-domain.com/api
```

### 6. Frontend Build & Deployment

```bash
cd frontend

# Install dependencies
npm install

# Build for production
npm run build

# Output will be in 'dist' folder
```

**Deployment Options:**

**Option A: Static Hosting (Netlify/Vercel)**
- Upload `frontend/dist` folder
- Configure redirects for SPA routing
- Set environment variable: `VITE_API_URL`

**Option B: Traditional Server (Nginx)**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/intern-management/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

##  Security Checklist

-  Strong JWT secret (min 32 characters)
-  Secure database password
-  HTTPS enabled in production
-  CORS configured correctly
-  File upload size limits set
-  SQL injection prevention (parameterized queries)
-  Password hashing with bcrypt
-  httpOnly cookies for JWT

##  Database Schema

The system uses 7 main tables:
- `users` - User accounts (admin/intern)
- `attendance` - Daily attendance records
- `tasks` - Task definitions
- `task_assignments` - Task-to-intern assignments
- `task_submissions` - Submitted work
- `task_ratings` - Admin ratings
- `notifications` - System alerts

##  Default Admin Account

After running seed.sql:
- **Email**: admin@example.com
- **Password**: admin123
-  **IMPORTANT**: Change this password immediately in production!

##  Monitoring & Maintenance

### Health Check Endpoints
- Backend: `GET /api/health` (TODO: Add this endpoint)

### Log Files
- Backend logs: Check console output or configure logging
- Database logs: PostgreSQL logs directory

### Backup Strategy
```bash
# Daily database backup
pg_dump intern_management > backup_$(date +%Y%m%d).sql

# Weekly file backup
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz backend/uploads/
```

##  Troubleshooting

### Backend won't start
- Check PostgreSQL is running: `systemctl status postgresql`
- Verify database credentials in `.env`
- Check port 5000 is available: `lsof -i :5000`

### Frontend shows blank page
- Check browser console for errors
- Verify `VITE_API_URL` is correct
- Check CORS configuration on backend

### File uploads failing
- Verify `UPLOAD_DIR` exists and is writable
- Check `MAX_FILE_SIZE` setting
- Ensure sufficient disk space

##  Support

For deployment issues, contact:
- Developer: [Your Contact]
- Documentation: This file
- GitHub: [Repository URL if applicable]

##  Update Process

```bash
# Pull latest changes
git pull origin main

# Backend
cd backend
npm install
npm run build
pm2 restart intern-api

# Frontend
cd ../frontend
npm install
npm run build
# Deploy new dist folder
```

##  Features

### Admin Features
- Dashboard with KPIs
- Intern management (add/remove)
- Task creation and assignment
- Attendance marking
- Submission review and rating
- Alert monitoring

### Intern Features
- Personal dashboard
- Task viewing and submission
- Attendance history
- Notification center
- Profile management with photo upload
- Performance tracking

### Automated Alerts
- 2 consecutive absences  Critical alert
- 2+ late/missed tasks  Performance warning
- Low rating (2 stars)  Performance review

##  System Requirements

### Minimum
- 2 CPU cores
- 4GB RAM
- 10GB storage
- Ubuntu 20.04+ or Windows Server 2019+

### Recommended
- 4 CPU cores
- 8GB RAM
- 50GB SSD storage
- Ubuntu 22.04 LTS

##  License

Internal use only - Paths4 AI

---

**Last Updated**: December 28, 2025
**Version**: 1.0.0
**Status**: Production Ready 
