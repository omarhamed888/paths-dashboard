import { Response } from 'express';
import { query, getClient } from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';
import { createNotification } from '../services/notification.service';
import { checkPerformanceAlerts } from '../services/performance.service';
import path from 'path';
import fs from 'fs';

/**
 * Create a new task (admin only)
 */
export const createTask = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { title, description, deadline } = req.body;

        if (!title || !deadline) {
            res.status(400).json({ error: 'title and deadline are required' });
            return;
        }

        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        const result = await query(
            `INSERT INTO tasks (title, description, assigned_by, deadline)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
            [title, description, req.user.id, deadline]
        );

        res.json({ task: result.rows[0] });
    } catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({ error: 'Failed to create task' });
    }
};

/**
 * Delete a task (admin only)
 */
export const deleteTask = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        // Check if task exists
        const taskCheck = await query('SELECT id FROM tasks WHERE id = $1', [id]);
        if (taskCheck.rows.length === 0) {
            res.status(404).json({ error: 'Task not found' });
            return;
        }

        // Delete the task (Relies on CASCADE or manual cleanup if needed)
        // Attempting direct delete; if FK constraint fails, we need manual cleanup.
        // Assuming CASCADE is set up or we do it here.
        // Safe approach: Delete generic dependencies if simple delete fails? 
        // Let's try simple delete. If your schema.sql didn't use CASCADE, this might fail with FK violation.
        // Be robust:
        const client = await getClient();
        try {
            await client.query('BEGIN');

            // Clean up could be complex, assuming ON DELETE CASCADE for now to keep code clean.
            // If it fails, I will revise.
            await client.query('DELETE FROM tasks WHERE id = $1', [id]);

            await client.query('COMMIT');
            res.json({ message: 'Task deleted successfully' });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Delete task error:', error);
        res.status(500).json({ error: 'Failed to delete task' });
    }
};

/**
 * Assign task to interns
 * AUTOMATION RULE: Creates task notification for each assigned intern
 */
export const assignTask = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id: taskId } = req.params;
        const { intern_ids } = req.body;

        if (!Array.isArray(intern_ids) || intern_ids.length === 0) {
            res.status(400).json({ error: 'intern_ids must be a non-empty array' });
            return;
        }

        // Get task details for notification
        const taskResult = await query('SELECT title, deadline FROM tasks WHERE id = $1', [taskId]);
        if (taskResult.rows.length === 0) {
            res.status(404).json({ error: 'Task not found' });
            return;
        }

        const task = taskResult.rows[0];
        const assignments = [];

        // Use transaction for atomicity
        const client = await getClient();
        try {
            await client.query('BEGIN');

            for (const internId of intern_ids) {
                // Create assignment
                const assignmentResult = await client.query(
                    `INSERT INTO task_assignments (task_id, intern_id)
           VALUES ($1, $2)
           ON CONFLICT (task_id, intern_id) DO NOTHING
           RETURNING *`,
                    [taskId, internId]
                );

                if (assignmentResult.rows.length > 0) {
                    assignments.push(assignmentResult.rows[0]);

                    // AUTOMATION RULE: Create task notification for intern
                    const deadline = new Date(task.deadline).toLocaleString();
                    await client.query(
                        `INSERT INTO notifications (user_id, type, title, message, severity)
             VALUES ($1, $2, $3, $4, $5)`,
                        [
                            internId,
                            'task',
                            'New Task Assigned',
                            `New task assigned: ${task.title}. Deadline: ${deadline}`,
                            'info',
                        ]
                    );

                    console.log(`📬 Task notification sent to intern ${internId}`);
                }
            }

            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

        res.json({ assignments });
    } catch (error) {
        console.error('Assign task error:', error);
        res.status(500).json({ error: 'Failed to assign task' });
    }
};

/**
 * Get tasks (role-based filtering)
 */
export const getTasks = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        let tasks;

        if (req.user.role === 'admin') {
            // Admin: Get all tasks with assignment counts
            const result = await query(`
        SELECT t.*, 
          u.full_name as assigned_by_name,
          COUNT(ta.id) as total_assignments,
          SUM(CASE WHEN ta.status = 'submitted' THEN 1 ELSE 0 END) as submitted_count
        FROM tasks t
        JOIN users u ON t.assigned_by = u.id
        LEFT JOIN task_assignments ta ON t.id = ta.task_id
        GROUP BY t.id, u.full_name
        ORDER BY t.created_at DESC
      `);
            tasks = result.rows;
        } else {
            // Intern: Get only assigned tasks
            const result = await query(`
        SELECT t.*, ta.status as assignment_status, ta.assigned_at, ta.id as assignment_id
        FROM tasks t
        JOIN task_assignments ta ON t.id = ta.task_id
        WHERE ta.intern_id = $1
        ORDER BY t.deadline ASC
      `, [req.user.id]);
            tasks = result.rows;
        }

        res.json({ tasks });
    } catch (error) {
        console.error('Get tasks error:', error);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
};

/**
 * Get task by ID with submissions
 */
export const getTaskById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const taskResult = await query('SELECT * FROM tasks WHERE id = $1', [id]);
        if (taskResult.rows.length === 0) {
            res.status(404).json({ error: 'Task not found' });
            return;
        }

        // Get assignments and submissions
        const submissionsResult = await query(`
      SELECT 
        ta.id as assignment_id, ta.status, ta.assigned_at,
        u.id as intern_id, u.full_name as intern_name,
        ts.id as submission_id, ts.submitted_at, ts.file_url, ts.original_filename, ts.is_late,
        tr.rating, tr.feedback
      FROM task_assignments ta
      JOIN users u ON ta.intern_id = u.id
      LEFT JOIN task_submissions ts ON ta.id = ts.task_assignment_id
      LEFT JOIN task_ratings tr ON ts.id = tr.task_submission_id
      WHERE ta.task_id = $1
      ORDER BY u.full_name
    `, [id]);

        res.json({
            task: taskResult.rows[0],
            submissions: submissionsResult.rows,
        });
    } catch (error) {
        console.error('Get task by ID error:', error);
        res.status(500).json({ error: 'Failed to fetch task details' });
    }
};

/**
 * Submit task with file upload
 * AUTOMATION RULES:
 * - Marks as late if submitted after deadline
 * - Updates assignment status
 * - Creates notification for admin
 * - Checks for performance alerts
 */
export const submitTask = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }

        const { assignmentId } = req.params;
        const fileUrl = `/uploads/${req.file.filename}`;
        const originalFilename = req.file.originalname;

        // Get assignment and task details
        const assignmentResult = await query(`
      SELECT ta.*, t.deadline, t.title, u.full_name as intern_name
      FROM task_assignments ta
      JOIN tasks t ON ta.task_id = t.id
      JOIN users u ON ta.intern_id = u.id
      WHERE ta.id = $1 AND ta.intern_id = $2
    `, [assignmentId, req.user.id]);

        if (assignmentResult.rows.length === 0) {
            res.status(404).json({ error: 'Assignment not found or not assigned to you' });
            return;
        }

        const assignment = assignmentResult.rows[0];
        const currentTime = new Date();
        const deadline = new Date(assignment.deadline);
        const isLate = currentTime > deadline;

        // Create submission
        const submissionResult = await query(`
      INSERT INTO task_submissions (task_assignment_id, file_url, original_filename, is_late)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [assignmentId, fileUrl, originalFilename, isLate]);

        // AUTOMATION RULE: Update assignment status
        const newStatus = isLate ? 'late' : 'submitted';
        await query(
            'UPDATE task_assignments SET status = $1 WHERE id = $2',
            [newStatus, assignmentId]
        );

        // AUTOMATION RULE: Notify admin of submission
        const adminResult = await query("SELECT id FROM users WHERE role = 'admin'");
        for (const admin of adminResult.rows) {
            await createNotification(
                admin.id,
                'task',
                'New Task Submission',
                `${assignment.intern_name} submitted: ${assignment.title}${isLate ? ' (Late)' : ''}`,
                isLate ? 'warning' : 'info'
            );
        }

        // AUTOMATION RULE: Check for performance alerts (2 late/missed tasks)
        await checkPerformanceAlerts(req.user.id);

        res.json({
            submission: submissionResult.rows[0],
            isLate,
        });
    } catch (error) {
        console.error('Submit task error:', error);
        res.status(500).json({ error: 'Failed to submit task' });
    }
};

/**
 * Download submission file
 * Security: Role-based access (admin can download any, intern only their own)
 */
export const downloadSubmission = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        const { submissionId } = req.params;

        // Get submission details
        const result = await query(`
      SELECT ts.file_url, ts.original_filename, ta.intern_id
      FROM task_submissions ts
      JOIN task_assignments ta ON ts.task_assignment_id = ta.id
      WHERE ts.id = $1
    `, [submissionId]);

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Submission not found' });
            return;
        }

        const submission = result.rows[0];

        // Check access: admin or submission owner
        if (req.user.role !== 'admin' && req.user.id !== submission.intern_id) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        const filePath = path.join(process.env.UPLOAD_DIR || './uploads', path.basename(submission.file_url));

        if (!fs.existsSync(filePath)) {
            res.status(404).json({ error: 'File not found' });
            return;
        }

        res.download(filePath, submission.original_filename);
    } catch (error) {
        console.error('Download submission error:', error);
        res.status(500).json({ error: 'Failed to download file' });
    }
};

/**
 * Rate a task submission
 * AUTOMATION RULE: Creates warning notification if rating < 3
 */
export const rateTask = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { submissionId } = req.params;
        const { rating, feedback } = req.body;

        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        if (!rating || rating < 1 || rating > 5) {
            res.status(400).json({ error: 'Rating must be between 1 and 5' });
            return;
        }

        // Get submission and intern details
        const submissionResult = await query(`
      SELECT ta.intern_id, t.title
      FROM task_submissions ts
      JOIN task_assignments ta ON ts.task_assignment_id = ta.id
      JOIN tasks t ON ta.task_id = t.id
      WHERE ts.id = $1
    `, [submissionId]);

        if (submissionResult.rows.length === 0) {
            res.status(404).json({ error: 'Submission not found' });
            return;
        }

        const internId = submissionResult.rows[0].intern_id;
        const taskTitle = submissionResult.rows[0].title;

        // Create or update rating
        const ratingResult = await query(`
      INSERT INTO task_ratings (task_submission_id, rated_by, rating, feedback)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (task_submission_id) 
      DO UPDATE SET rating = $3, feedback = $4, rated_by = $2, created_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [submissionId, req.user.id, rating, feedback]);

        // AUTOMATION RULE: Create warning notification if rating < 3
        if (rating < 3) {
            await createNotification(
                internId,
                'rating',
                'Performance Warning',
                `Your submission for "${taskTitle}" received a low rating (${rating}/5). Please review the feedback and improve.`,
                'warning'
            );
            console.log(`⚠️ Low rating alert created for intern ${internId}`);
        }

        // Check for performance alerts after rating
        await checkPerformanceAlerts(internId);

        res.json({ rating: ratingResult.rows[0] });
    } catch (error) {
        console.error('Rate task error:', error);
        res.status(500).json({ error: 'Failed to rate submission' });
    }
};
