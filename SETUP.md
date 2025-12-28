# Quick Setup Guide

## PostgreSQL Installation Required

The application needs PostgreSQL to run. Here are your options:

### Option 1: Install PostgreSQL (Recommended)

1. **Download PostgreSQL**:
   - Visit: https://www.postgresql.org/download/windows/
   - Download the Windows installer (version 14 or higher)
   - Run the installer and follow the setup wizard
   - Remember the password you set for the `postgres` user

2. **After Installation**:
   - Open Command Prompt or PowerShell as Administrator
   - Navigate to PostgreSQL bin directory (usually `C:\Program Files\PostgreSQL\16\bin`)
   - Or add it to your PATH environment variable

3. **Set up the Database**:
   ```bash
   psql -U postgres
   # Enter your password when prompted
   # Then run:
   CREATE DATABASE intern_management;
   \q
   ```

4. **Run Migration Files**:
   ```bash
   psql -U postgres -d intern_management -f d:\Programming\Paths\Dashboard\database\schema.sql
   psql -U postgres -d intern_management -f d:\Programming\Paths\Dashboard\database\seed.sql
   ```

### Option 2: Use Docker (If you have Docker installed)

```bash
docker run --name intern-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:14
docker exec -i intern-postgres psql -U postgres < database/schema.sql
docker exec -i intern-postgres psql -U postgres < database/seed.sql
```

## After PostgreSQL is Set Up

1. **Configure Backend Environment**:
   - The `.env` file has been created for you
   - Update `DB_PASSWORD` with your PostgreSQL password

2. **Start Backend Server**:
   ```bash
   cd backend
   npm run dev
   ```
   Server runs on: http://localhost:5000

3. **Start Frontend Server** (in a new terminal):
   ```bash
   cd frontend
   npm run dev
   ```
   App opens at: http://localhost:5173

## Demo Credentials

Once running, login with:
- **Admin**: admin@example.com / Admin123!
- **Intern**: sarah.j@example.com / Admin123!

## Troubleshooting

If you get connection errors:
1. Make sure PostgreSQL service is running
2. Verify database credentials in `backend/.env`
3. Check that database `intern_management` exists
4. Ensure port 5432 is not blocked
