-- Seed data for Intern Management System
-- Provides initial data for development and testing

\c intern_management;

-- Clear existing data (in reverse order of dependencies)
TRUNCATE notifications, task_ratings, task_submissions, task_assignments, tasks, attendance, users RESTART IDENTITY CASCADE;

------------------------------------------------------------
-- Insert Users
------------------------------------------------------------
-- Password for all users: Admin123! (bcrypt hash)
-- Hash generated with bcrypt rounds=10
INSERT INTO users (id, role, full_name, email, password_hash, department, bio, is_active) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'admin', 'John Admin', 'admin@example.com', 
   '$2b$10$YQ98PzVbXsmVPqJQtBMZOeVFXJKXxvJxZVKHxLbAWLxQGqJXoqA8i', 
   'Human Resources', 'System administrator with full access to intern management.', true),
  
  ('b2222222-2222-2222-2222-222222222222', 'intern', 'Sarah Johnson', 'sarah.j@example.com',
   '$2b$10$YQ98PzVbXsmVPqJQtBMZOeVFXJKXxvJxZVKHxLbAWLxQGqJXoqA8i',
   'Engineering', 'Software engineering intern focusing on full-stack development.', true),
  
  ('b3333333-3333-3333-3333-333333333333', 'intern', 'Michael Chen', 'michael.c@example.com',
   '$2b$10$YQ98PzVbXsmVPqJQtBMZOeVFXJKXxvJxZVKHxLbAWLxQGqJXoqA8i',
   'Engineering', 'Backend development intern specializing in APIs and databases.', true),
  
  ('b4444444-4444-4444-4444-444444444444', 'intern', 'Emma Williams', 'emma.w@example.com',
   '$2b$10$YQ98PzVbXsmVPqJQtBMZOeVFXJKXxvJxZVKHxLbAWLxQGqJXoqA8i',
   'Design', 'UI/UX design intern with a passion for user experience.', true);

------------------------------------------------------------
-- Insert Attendance Records
------------------------------------------------------------
-- Recent attendance for the past 10 days
INSERT INTO attendance (user_id, date, status, check_in_time) VALUES
  -- Sarah Johnson - Good attendance
  ('b2222222-2222-2222-2222-222222222222', CURRENT_DATE - INTERVAL '9 days', 'present', CURRENT_TIMESTAMP - INTERVAL '9 days' + INTERVAL '9 hours'),
  ('b2222222-2222-2222-2222-222222222222', CURRENT_DATE - INTERVAL '8 days', 'present', CURRENT_TIMESTAMP - INTERVAL '8 days' + INTERVAL '8 hours 45 minutes'),
  ('b2222222-2222-2222-2222-222222222222', CURRENT_DATE - INTERVAL '7 days', 'present', CURRENT_TIMESTAMP - INTERVAL '7 days' + INTERVAL '9 hours 10 minutes'),
  ('b2222222-2222-2222-2222-222222222222', CURRENT_DATE - INTERVAL '6 days', 'present', CURRENT_TIMESTAMP - INTERVAL '6 days' + INTERVAL '8 hours 30 minutes'),
  ('b2222222-2222-2222-2222-222222222222', CURRENT_DATE - INTERVAL '5 days', 'present', CURRENT_TIMESTAMP - INTERVAL '5 days' + INTERVAL '9 hours'),
  
  -- Michael Chen - Has 2 consecutive absences (should trigger alert)
  ('b3333333-3333-3333-3333-333333333333', CURRENT_DATE - INTERVAL '9 days', 'present', CURRENT_TIMESTAMP - INTERVAL '9 days' + INTERVAL '9 hours'),
  ('b3333333-3333-3333-3333-333333333333', CURRENT_DATE - INTERVAL '8 days', 'present', CURRENT_TIMESTAMP - INTERVAL '8 days' + INTERVAL '9 hours'),
  ('b3333333-3333-3333-3333-333333333333', CURRENT_DATE - INTERVAL '7 days', 'absent', NULL),
  ('b3333333-3333-3333-3333-333333333333', CURRENT_DATE - INTERVAL '6 days', 'absent', NULL),
  ('b3333333-3333-3333-3333-333333333333', CURRENT_DATE - INTERVAL '5 days', 'present', CURRENT_TIMESTAMP - INTERVAL '5 days' + INTERVAL '9 hours'),
  
  -- Emma Williams - Mixed attendance with some late arrivals
  ('b4444444-4444-4444-4444-444444444444', CURRENT_DATE - INTERVAL '9 days', 'present', CURRENT_TIMESTAMP - INTERVAL '9 days' + INTERVAL '9 hours'),
  ('b4444444-4444-4444-4444-444444444444', CURRENT_DATE - INTERVAL '8 days', 'late', CURRENT_TIMESTAMP - INTERVAL '8 days' + INTERVAL '10 hours 30 minutes'),
  ('b4444444-4444-4444-4444-444444444444', CURRENT_DATE - INTERVAL '7 days', 'present', CURRENT_TIMESTAMP - INTERVAL '7 days' + INTERVAL '8 hours 45 minutes'),
  ('b4444444-4444-4444-4444-444444444444', CURRENT_DATE - INTERVAL '6 days', 'present', CURRENT_TIMESTAMP - INTERVAL '6 days' + INTERVAL '9 hours'),
  ('b4444444-4444-4444-4444-444444444444', CURRENT_DATE - INTERVAL '5 days', 'late', CURRENT_TIMESTAMP - INTERVAL '5 days' + INTERVAL '10 hours 15 minutes');

------------------------------------------------------------
-- Insert Tasks
------------------------------------------------------------
INSERT INTO tasks (id, title, description, assigned_by, deadline) VALUES
  ('t1111111-1111-1111-1111-111111111111', 'Complete Onboarding Documentation', 
   'Read through all onboarding materials and complete the new hire checklist.', 
   'a1111111-1111-1111-1111-111111111111', CURRENT_TIMESTAMP - INTERVAL '3 days'),
  
  ('t2222222-2222-2222-2222-222222222222', 'Setup Development Environment',
   'Install all required development tools, IDEs, and configure your local environment according to the setup guide.',
   'a1111111-1111-1111-1111-111111111111', CURRENT_TIMESTAMP - INTERVAL '1 day'),
  
  ('t3333333-3333-3333-3333-333333333333', 'First Week Report',
   'Submit a summary of your first week experience, learnings, and any questions or concerns.',
   'a1111111-1111-1111-1111-111111111111', CURRENT_TIMESTAMP + INTERVAL '3 days'),
  
  ('t4444444-4444-4444-4444-444444444444', 'Code Review Exercise',
   'Review the provided codebase and submit a document highlighting potential improvements, bugs, or best practice violations.',
   'a1111111-1111-1111-1111-111111111111', CURRENT_TIMESTAMP + INTERVAL '5 days');

------------------------------------------------------------
-- Insert Task Assignments
------------------------------------------------------------
INSERT INTO task_assignments (id, task_id, intern_id, status) VALUES
  -- Sarah's assignments - Good performance
  ('ta111111-1111-1111-1111-111111111111', 't1111111-1111-1111-1111-111111111111', 'b2222222-2222-2222-2222-222222222222', 'submitted'),
  ('ta222222-2222-2222-2222-222222222222', 't2222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222', 'submitted'),
  ('ta333333-3333-3333-3333-333333333333', 't3333333-3333-3333-3333-333333333333', 'b2222222-2222-2222-2222-222222222222', 'assigned'),
  
  -- Michael's assignments - Has late submissions
  ('ta444444-4444-4444-4444-444444444444', 't1111111-1111-1111-1111-111111111111', 'b3333333-3333-3333-3333-333333333333', 'late'),
  ('ta555555-5555-5555-5555-555555555555', 't2222222-2222-2222-2222-222222222222', 'b3333333-3333-3333-3333-333333333333', 'missed'),
  ('ta666666-6666-6666-6666-666666666666', 't4444444-4444-4444-4444-444444444444', 'b3333333-3333-3333-3333-333333333333', 'assigned'),
  
  -- Emma's assignments
  ('ta777777-7777-7777-7777-777777777777', 't1111111-1111-1111-1111-111111111111', 'b4444444-4444-4444-4444-444444444444', 'submitted'),
  ('ta888888-8888-8888-8888-888888888888', 't3333333-3333-3333-3333-333333333333', 'b4444444-4444-4444-4444-444444444444', 'assigned');

------------------------------------------------------------
-- Insert Task Submissions
------------------------------------------------------------
INSERT INTO task_submissions (task_assignment_id, submitted_at, file_url, original_filename, is_late) VALUES
  -- Sarah's submissions - on time
  ('ta111111-1111-1111-1111-111111111111', CURRENT_TIMESTAMP - INTERVAL '4 days', '/uploads/onboarding-sarah.pdf', 'onboarding-checklist.pdf', false),
  ('ta222222-2222-2222-2222-222222222222', CURRENT_TIMESTAMP - INTERVAL '2 days', '/uploads/setup-sarah.pdf', 'dev-environment-setup.pdf', false),
  
  -- Michael's submission - late
  ('ta444444-4444-4444-4444-444444444444', CURRENT_TIMESTAMP - INTERVAL '2 days', '/uploads/onboarding-michael.pdf', 'onboarding-docs.pdf', true),
  
  -- Emma's submission - on time
  ('ta777777-7777-7777-7777-777777777777', CURRENT_TIMESTAMP - INTERVAL '4 days', '/uploads/onboarding-emma.pdf', 'my-onboarding.pdf', false);

------------------------------------------------------------
-- Insert Task Ratings
------------------------------------------------------------
INSERT INTO task_ratings (task_submission_id, rated_by, rating, feedback) VALUES
  -- Sarah's ratings - excellent
  ((SELECT id FROM task_submissions WHERE task_assignment_id = 'ta111111-1111-1111-1111-111111111111'), 
   'a1111111-1111-1111-1111-111111111111', 5, 'Excellent work! Very thorough and well-organized.'),
  
  ((SELECT id FROM task_submissions WHERE task_assignment_id = 'ta222222-2222-2222-2222-222222222222'),
   'a1111111-1111-1111-1111-111111111111', 5, 'Great job on the setup. Everything looks perfect.'),
  
  -- Michael's rating - poor (should trigger warning)
  ((SELECT id FROM task_submissions WHERE task_assignment_id = 'ta444444-4444-4444-4444-444444444444'),
   'a1111111-1111-1111-1111-111111111111', 2, 'Submitted late and missing several important sections. Please pay more attention to deadlines and requirements.'),
  
  -- Emma's rating - good
  ((SELECT id FROM task_submissions WHERE task_assignment_id = 'ta777777-7777-7777-7777-777777777777'),
   'a1111111-1111-1111-1111-111111111111', 4, 'Good work overall. Minor improvements needed in documentation clarity.');

------------------------------------------------------------
-- Insert Notifications
------------------------------------------------------------
INSERT INTO notifications (user_id, type, title, message, severity, is_read) VALUES
  -- Critical absence alert for Michael (2 consecutive absent days)
  ('b3333333-3333-3333-3333-333333333333', 'attendance', 'Critical: Consecutive Absences',
   'You have been absent for 2 consecutive days. Please contact your supervisor immediately.', 'critical', false),
  
  ('a1111111-1111-1111-1111-111111111111', 'attendance', 'Alert: Intern Consecutive Absences',
   'Michael Chen has been absent for 2 consecutive days.', 'critical', false),
  
  -- Low rating warning for Michael
  ('b3333333-3333-3333-3333-333333333333', 'rating', 'Performance Warning',
   'Your submission for "Complete Onboarding Documentation" received a low rating (2/5). Please review the feedback and improve.', 'warning', false),
  
  -- Performance alert for Michael (2 strikes: 1 late, 1 missed)
  ('b3333333-3333-3333-3333-333333333333', 'system', 'Performance Alert',
   'You have multiple late or missed task submissions. This requires immediate attention and improvement.', 'critical', false),
  
  ('a1111111-1111-1111-1111-111111111111', 'system', 'Intern Performance Alert',
   'Michael Chen has multiple late or missed submissions and may need additional support.', 'warning', false),
  
  -- Task assignment notifications
  ('b2222222-2222-2222-2222-222222222222', 'task', 'New Task Assigned',
   'New task assigned: First Week Report. Deadline: ' || TO_CHAR(CURRENT_TIMESTAMP + INTERVAL '3 days', 'YYYY-MM-DD HH24:MI'), 'info', false),
  
  ('b4444444-4444-4444-4444-444444444444', 'task', 'New Task Assigned',
   'New task assigned: First Week Report. Deadline: ' || TO_CHAR(CURRENT_TIMESTAMP + INTERVAL '3 days', 'YYYY-MM-DD HH24:MI'), 'info', false),
  
  ('b3333333-3333-3333-3333-333333333333', 'task', 'New Task Assigned',
   'New task assigned: Code Review Exercise. Deadline: ' || TO_CHAR(CURRENT_TIMESTAMP + INTERVAL '5 days', 'YYYY-MM-DD HH24:MI'), 'info', true);

-- Seed data insertion complete
SELECT 'Database seeded successfully!' AS status;
SELECT 'Admin login: admin@example.com / Admin123!' AS admin_credentials;
SELECT 'Intern logins: sarah.j@example.com, michael.c@example.com, emma.w@example.com / Admin123!' AS intern_credentials;
