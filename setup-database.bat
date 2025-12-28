@echo off
echo ===================================================
echo  Intern Management System - Database Setup
echo ===================================================
echo.

REM PostgreSQL 18 detected
set PSQL="C:\Program Files\PostgreSQL\18\bin\psql.exe"

echo Step 1: Creating Database...
echo You will be prompted for your PostgreSQL password (3 times)
echo.

%PSQL% -U postgres -c "CREATE DATABASE intern_management;"
if %errorlevel% neq 0 (
    echo Database may already exist or password incorrect
    echo Continuing with migrations...
)

echo.
echo Step 2: Running Schema Migration...
%PSQL% -U postgres -d intern_management -f "d:\Programming\Paths\Dashboard\database\schema.sql"

echo.
echo Step 3: Loading Seed Data...
%PSQL% -U postgres -d intern_management -f "d:\Programming\Paths\Dashboard\database\seed.sql"

echo.
echo ===================================================
echo  Database Setup Complete!
echo ===================================================
echo.
echo You can now start the application:
echo   1. Backend:  cd backend ^&^& npm run dev
echo   2. Frontend: cd frontend ^&^& npm run dev  
echo   3. Open: http://localhost:5173
echo.
pause
