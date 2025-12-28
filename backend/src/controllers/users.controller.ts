import { Response } from 'express';
import { query } from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';
import path from 'path';
import fs from 'fs';

/**
 * Get current user profile with statistics
 */
export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        const userId = req.user.id;

        // Get user basic info
        const userResult = await query(
            `SELECT id, email, role, full_name, profile_photo_url, bio, department, created_at 
       FROM users WHERE id = $1`,
            [userId]
        );

        if (userResult.rows.length === 0) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        const user = userResult.rows[0];

        // Calculate statistics for interns
        let stats = {};
        if (user.role === 'intern') {
            // Attendance summary
            const attendanceResult = await query(
                `SELECT 
          COUNT(*) as total_days,
          SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_days,
          SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_days,
          SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_days
        FROM attendance WHERE user_id = $1`,
                [userId]
            );

            // Task completion rate
            const taskResult = await query(
                `SELECT 
          COUNT(*) as total_assignments,
          SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) as submitted,
          SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late,
          SUM(CASE WHEN status = 'missed' THEN 1 ELSE 0 END) as missed
        FROM task_assignments WHERE intern_id = $1`,
                [userId]
            );

            // Average rating
            const ratingResult = await query(
                `SELECT AVG(tr.rating)::DECIMAL(3,2) as avg_rating
        FROM task_ratings tr
        JOIN task_submissions ts ON tr.task_submission_id = ts.id
        JOIN task_assignments ta ON ts.task_assignment_id = ta.id
        WHERE ta.intern_id = $1`,
                [userId]
            );

            stats = {
                attendance: attendanceResult.rows[0],
                tasks: taskResult.rows[0],
                avgRating: ratingResult.rows[0]?.avg_rating || null,
            };
        }

        res.json({
            user,
            stats,
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
};

/**
 * Update user profile
 */
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        const { full_name, bio, department } = req.body;
        const userId = req.user.id;

        // Build dynamic update query
        const updates: string[] = [];
        const values: any[] = [];
        let paramCount = 1;

        if (full_name !== undefined) {
            updates.push(`full_name = $${paramCount++}`);
            values.push(full_name);
        }
        if (bio !== undefined) {
            updates.push(`bio = $${paramCount++}`);
            values.push(bio);
        }
        if (department !== undefined) {
            updates.push(`department = $${paramCount++}`);
            values.push(department);
        }

        if (updates.length === 0) {
            res.status(400).json({ error: 'No fields to update' });
            return;
        }

        values.push(userId);

        const result = await query(
            `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $${paramCount} 
       RETURNING id, email, role, full_name, profile_photo_url, bio, department`,
            values
        );

        res.json({ user: result.rows[0] });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
};

/**
 * Upload profile photo
 */
export const uploadProfilePhoto = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }

        const userId = req.user.id;
        const photoUrl = `/uploads/${req.file.filename}`;

        // Get old photo to delete if exists
        const oldPhotoResult = await query(
            'SELECT profile_photo_url FROM users WHERE id = $1',
            [userId]
        );

        // Update user photo URL
        await query(
            'UPDATE users SET profile_photo_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [photoUrl, userId]
        );

        // Delete old photo file if exists
        if (oldPhotoResult.rows[0]?.profile_photo_url) {
            const oldPath = path.join(
                process.env.UPLOAD_DIR || './uploads',
                path.basename(oldPhotoResult.rows[0].profile_photo_url)
            );
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
        }

        res.json({ photoUrl });
    } catch (error) {
        console.error('Upload photo error:', error);
        res.status(500).json({ error: 'Failed to upload photo' });
    }
};

/**
 * Get all interns (admin only)
 */
export const getAllInterns = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const result = await query(
            `SELECT 
        u.id, u.email, u.full_name, u.profile_photo_url, u.department, u.created_at,
        COUNT(DISTINCT a.id) as total_attendance,
        COUNT(DISTINCT ta.id) as total_tasks,
        AVG(tr.rating)::DECIMAL(3,2) as avg_rating
      FROM users u
      LEFT JOIN attendance a ON u.id = a.user_id
      LEFT JOIN task_assignments ta ON u.id = ta.intern_id
      LEFT JOIN task_submissions ts ON ta.id = ts.task_assignment_id
      LEFT JOIN task_ratings tr ON ts.id = tr.task_submission_id
      WHERE u.role = 'intern'
      GROUP BY u.id
      ORDER BY u.created_at DESC`
        );

        res.json({ interns: result.rows });
    } catch (error) {
        console.error('Get all interns error:', error);
        res.status(500).json({ error: 'Failed to fetch interns' });
    }
};

/**
 * Get specific intern by ID (admin only)
 */
export const getInternById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const userResult = await query(
            'SELECT id, email, role, full_name, profile_photo_url, bio, department, created_at FROM users WHERE id = $1 AND role = $2',
            [id, 'intern']
        );

        if (userResult.rows.length === 0) {
            res.status(404).json({ error: 'Intern not found' });
            return;
        }

        // Get detailed statistics
        const attendanceResult = await query(
            `SELECT 
        COUNT(*) as total_days,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_days,
        SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_days,
        SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_days
      FROM attendance WHERE user_id = $1`,
            [id]
        );

        const taskResult = await query(
            `SELECT 
        COUNT(*) as total_assignments,
        SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) as submitted,
        SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late,
        SUM(CASE WHEN status = 'missed' THEN 1 ELSE 0 END) as missed
      FROM task_assignments WHERE intern_id = $1`,
            [id]
        );

        const ratingResult = await query(
            `SELECT AVG(tr.rating)::DECIMAL(3,2) as avg_rating
      FROM task_ratings tr
      JOIN task_submissions ts ON tr.task_submission_id = ts.id
      JOIN task_assignments ta ON ts.task_assignment_id = ta.id
      WHERE ta.intern_id = $1`,
            [id]
        );

        res.json({
            user: userResult.rows[0],
            stats: {
                attendance: attendanceResult.rows[0],
                tasks: taskResult.rows[0],
                avgRating: ratingResult.rows[0]?.avg_rating || null,
            },
        });
    } catch (error) {
        console.error('Get intern by ID error:', error);
        res.status(500).json({ error: 'Failed to fetch intern details' });
    }
};
