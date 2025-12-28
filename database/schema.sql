-- Intern Management System Database Schema
-- Production-ready with proper constraints, indexes, and data integrity

-- Drop existing database if exists and create fresh
DROP DATABASE IF EXISTS intern_management;
CREATE DATABASE intern_management;

-- Connect to the database
\c intern_management;

-- Create ENUM types
CREATE TYPE user_role AS ENUM ('admin', 'intern');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late');
CREATE TYPE task_status AS ENUM ('assigned', 'submitted', 'late', 'missed');
CREATE TYPE notification_type AS ENUM ('task', 'attendance', 'rating', 'system');
CREATE TYPE notification_severity AS ENUM ('info', 'warning', 'critical');

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

------------------------------------------------------------
-- Table: users
------------------------------------------------------------
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role user_role NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  profile_photo_url TEXT,
  bio TEXT,
  department VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster email lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

------------------------------------------------------------
-- Table: attendance
------------------------------------------------------------
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status attendance_status NOT NULL,
  check_in_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, date)
);

-- Indexes for attendance queries
CREATE INDEX idx_attendance_user_date ON attendance(user_id, date DESC);
CREATE INDEX idx_attendance_status ON attendance(status);

------------------------------------------------------------
-- Table: tasks
------------------------------------------------------------
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  assigned_by UUID NOT NULL REFERENCES users(id),
  deadline TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for deadline-based queries
CREATE INDEX idx_tasks_deadline ON tasks(deadline);
CREATE INDEX idx_tasks_assigned_by ON tasks(assigned_by);

------------------------------------------------------------
-- Table: task_assignments
------------------------------------------------------------
CREATE TABLE task_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  intern_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status task_status DEFAULT 'assigned',
  UNIQUE(task_id, intern_id)
);

-- Indexes for assignment queries
CREATE INDEX idx_task_assignments_intern ON task_assignments(intern_id);
CREATE INDEX idx_task_assignments_task ON task_assignments(task_id);
CREATE INDEX idx_task_assignments_status ON task_assignments(status);

------------------------------------------------------------
-- Table: task_submissions
------------------------------------------------------------
CREATE TABLE task_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_assignment_id UUID NOT NULL REFERENCES task_assignments(id) ON DELETE CASCADE,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  file_url TEXT NOT NULL,
  original_filename VARCHAR(255),
  is_late BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(task_assignment_id)
);

-- Index for submission queries
CREATE INDEX idx_task_submissions_assignment ON task_submissions(task_assignment_id);
CREATE INDEX idx_task_submissions_submitted_at ON task_submissions(submitted_at DESC);

------------------------------------------------------------
-- Table: task_ratings
------------------------------------------------------------
CREATE TABLE task_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_submission_id UUID NOT NULL REFERENCES task_submissions(id) ON DELETE CASCADE,
  rated_by UUID NOT NULL REFERENCES users(id),
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  feedback TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(task_submission_id)
);

-- Index for rating queries
CREATE INDEX idx_task_ratings_submission ON task_ratings(task_submission_id);
CREATE INDEX idx_task_ratings_rating ON task_ratings(rating);

------------------------------------------------------------
-- Table: notifications
------------------------------------------------------------
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  severity notification_severity DEFAULT 'info',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for notification queries
CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_severity ON notifications(severity);

------------------------------------------------------------
-- Trigger: Update updated_at timestamp
------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_app_user;

-- Schema creation complete
