-- Supabase Seed Data for Intern Management System
-- Run this AFTER running supabase_schema.sql

-- Insert Admin User
-- Password: admin123
-- Bcrypt hash for "admin123"
INSERT INTO users (id, role, full_name, email, password_hash, department, bio, is_active) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'admin', 'Admin User', 'admin@example.com', 
   '$2b$10$YQ98PzVbXsmVPqJQtBMZOeVFXJKXxvJxZVKHxLbAWLxQGqJXoqA8i', 
   'Administration', 'System administrator with full access', true)
ON CONFLICT (email) DO NOTHING;

-- Insert Sample Interns
INSERT INTO users (id, role, full_name, email, password_hash, department, bio, is_active) VALUES
  ('b2222222-2222-2222-2222-222222222222', 'intern', 'Sarah Johnson', 'sarah.j@example.com',
   '$2b$10$YQ98PzVbXsmVPqJQtBMZOeVFXJKXxvJxZVKHxLbAWLxQGqJXoqA8i',
   'Engineering', 'Software engineering intern', true),
  
  ('b3333333-3333-3333-3333-333333333333', 'intern', 'Michael Chen', 'michael.c@example.com',
   '$2b$10$YQ98PzVbXsmVPqJQtBMZOeVFXJKXxvJxZVKHxLbAWLxQGqJXoqA8i',
   'Engineering', 'Backend development intern', true),
  
  ('b4444444-4444-4444-4444-444444444444', 'intern', 'Emma Williams', 'emma.w@example.com',
   '$2b$10$YQ98PzVbXsmVPqJQtBMZOeVFXJKXxvJxZVKHxLbAWLxQGqJXoqA8i',
   'Design', 'UI/UX design intern', true)
ON CONFLICT (email) DO NOTHING;

-- Insert Sample Tasks
INSERT INTO tasks (id, title, description, assigned_by, deadline) VALUES
  ('t1111111-1111-1111-1111-111111111111', 'Complete Onboarding Documentation', 
   'Read through all onboarding materials', 
   'a1111111-1111-1111-1111-111111111111', CURRENT_TIMESTAMP + INTERVAL '7 days'),
  
  ('t2222222-2222-2222-2222-222222222222', 'Setup Development Environment',
   'Install required tools and configure environment',
   'a1111111-1111-1111-1111-111111111111', CURRENT_TIMESTAMP + INTERVAL '5 days'),
  
  ('t3333333-3333-3333-3333-333333333333', 'First Week Report',
   'Submit summary of first week',
   'a1111111-1111-1111-1111-111111111111', CURRENT_TIMESTAMP + INTERVAL '10 days')
ON CONFLICT (id) DO NOTHING;

-- Insert Task Assignments
INSERT INTO task_assignments (id, task_id, intern_id, status) VALUES
  ('ta111111-1111-1111-1111-111111111111', 't1111111-1111-1111-1111-111111111111', 'b2222222-2222-2222-2222-222222222222', 'assigned'),
  ('ta222222-2222-2222-2222-222222222222', 't2222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222', 'assigned'),
  ('ta333333-3333-3333-3333-333333333333', 't1111111-1111-1111-1111-111111111111', 'b3333333-3333-3333-3333-333333333333', 'assigned'),
  ('ta444444-4444-4444-4444-444444444444', 't3333333-3333-3333-3333-333333333333', 'b4444444-4444-4444-4444-444444444444', 'assigned')
ON CONFLICT (id) DO NOTHING;

-- Insert Sample Attendance (last 5 days)
INSERT INTO attendance (user_id, date, status, check_in_time) VALUES
  ('b2222222-2222-2222-2222-222222222222', CURRENT_DATE - 4, 'present', CURRENT_TIMESTAMP - INTERVAL '4 days' + INTERVAL '9 hours'),
  ('b2222222-2222-2222-2222-222222222222', CURRENT_DATE - 3, 'present', CURRENT_TIMESTAMP - INTERVAL '3 days' + INTERVAL '9 hours'),
  ('b2222222-2222-2222-2222-222222222222', CURRENT_DATE - 2, 'present', CURRENT_TIMESTAMP - INTERVAL '2 days' + INTERVAL '9 hours'),
  ('b2222222-2222-2222-2222-222222222222', CURRENT_DATE - 1, 'present', CURRENT_TIMESTAMP - INTERVAL '1 days' + INTERVAL '9 hours'),
  ('b2222222-2222-2222-2222-222222222222', CURRENT_DATE, 'present', CURRENT_TIMESTAMP),
  
  ('b3333333-3333-3333-3333-333333333333', CURRENT_DATE - 4, 'present', CURRENT_TIMESTAMP - INTERVAL '4 days' + INTERVAL '9 hours'),
  ('b3333333-3333-3333-3333-333333333333', CURRENT_DATE - 3, 'late', CURRENT_TIMESTAMP - INTERVAL '3 days' + INTERVAL '10 hours'),
  ('b3333333-3333-3333-3333-333333333333', CURRENT_DATE - 2, 'present', CURRENT_TIMESTAMP - INTERVAL '2 days' + INTERVAL '9 hours'),
  
  ('b4444444-4444-4444-4444-444444444444', CURRENT_DATE - 4, 'present', CURRENT_TIMESTAMP - INTERVAL '4 days' + INTERVAL '9 hours'),
  ('b4444444-4444-4444-4444-444444444444', CURRENT_DATE - 3, 'present', CURRENT_TIMESTAMP - INTERVAL '3 days' + INTERVAL '9 hours'),
  ('b4444444-4444-4444-4444-444444444444', CURRENT_DATE - 2, 'late', CURRENT_TIMESTAMP - INTERVAL '2 days' + INTERVAL '10 hours')
ON CONFLICT (user_id, date) DO NOTHING;

SELECT 'Database seeded successfully!' AS status;
SELECT 'Login with: admin@example.com / admin123' AS credentials;
