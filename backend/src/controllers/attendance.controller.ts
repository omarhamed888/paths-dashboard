import { Response } from 'express';
import { query } from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';
import { createNotification } from '../services/notification.service';

/**
 * Mark attendance for an intern
 * AUTOMATION RULE: Checks for 2 consecutive absent days and creates critical notification
 */
export const markAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { user_id, date, status, check_in_time } = req.body;

        // Validate input
        if (!user_id || !date || !status) {
            res.status(400).json({ error: 'user_id, date, and status are required' });
            return;
        }

        if (!['present', 'absent', 'late'].includes(status)) {
            res.status(400).json({ error: 'Invalid status. Must be: present, absent, or late' });
            return;
        }

        // Check if attendance already exists for this date
        const existing = await query(
            'SELECT id FROM attendance WHERE user_id = $1 AND date = $2',
            [user_id, date]
        );

        let result;
        if (existing.rows.length > 0) {
            // Update existing
            result = await query(
                `UPDATE attendance 
         SET status = $1, check_in_time = $2
         WHERE user_id = $3 AND date = $4
         RETURNING *`,
                [status, check_in_time || null, user_id, date]
            );
        } else {
            // Insert new
            result = await query(
                `INSERT INTO attendance (user_id, date, status, check_in_time)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
                [user_id, date, status, check_in_time || null]
            );
        }

        // AUTOMATION RULE: Check for 2 consecutive absent days
        if (status === 'absent') {
            await checkConsecutiveAbsences(user_id, date);
        }

        res.json({ attendance: result.rows[0] });
    } catch (error) {
        console.error('Mark attendance error:', error);
        res.status(500).json({ error: 'Failed to mark attendance' });
    }
};

/**
 * Helper function to check for 2 consecutive absent days
 * Creates critical notification if found
 */
const checkConsecutiveAbsences = async (userId: string, currentDate: string): Promise<void> => {
    try {
        // Get last 2 days of attendance
        const result = await query(
            `SELECT date, status
       FROM attendance
       WHERE user_id = $1 AND date <= $2
       ORDER BY date DESC
       LIMIT 2`,
            [userId, currentDate]
        );

        if (result.rows.length >= 2) {
            const [day1, day2] = result.rows;

            // Check if both days are absent
            if (day1.status === 'absent' && day2.status === 'absent') {
                // Check if notification already sent to avoid duplicates
                const notificationExists = await query(
                    `SELECT id FROM notifications
           WHERE user_id = $1
           AND type = 'attendance'
           AND severity = 'critical'
           AND created_at > CURRENT_TIMESTAMP - INTERVAL '3 days'`,
                    [userId]
                );

                if (notificationExists.rows.length === 0) {
                    // Create critical notification for intern
                    await createNotification(
                        userId,
                        'attendance',
                        'Critical: Consecutive Absences',
                        'You have been absent for 2 consecutive days. Please contact your supervisor immediately.',
                        'critical'
                    );

                    // Create notification for admin
                    const userResult = await query('SELECT full_name FROM users WHERE id = $1', [userId]);
                    const userName = userResult.rows[0]?.full_name || 'Intern';

                    const adminResult = await query("SELECT id FROM users WHERE role = 'admin'");
                    for (const admin of adminResult.rows) {
                        await createNotification(
                            admin.id,
                            'attendance',
                            'Alert: Intern Consecutive Absences',
                            `${userName} has been absent for 2 consecutive days.`,
                            'critical'
                        );
                    }

                    console.log(`🚨 Consecutive absence alert created for user ${userId}`);
                }
            }
        }
    } catch (error) {
        console.error('Error checking consecutive absences:', error);
    }
};

/**
 * Get attendance history for a user
 */
export const getUserAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { userId } = req.params;
        const { startDate, endDate, limit = 30 } = req.query;

        let queryText = `
      SELECT date, status, check_in_time, created_at
      FROM attendance
      WHERE user_id = $1
    `;
        const params: any[] = [userId];
        let paramCount = 2;

        if (startDate) {
            queryText += ` AND date >= $${paramCount++}`;
            params.push(startDate);
        }
        if (endDate) {
            queryText += ` AND date <= $${paramCount++}`;
            params.push(endDate);
        }

        queryText += ` ORDER BY date DESC LIMIT $${paramCount}`;
        params.push(limit);

        const result = await query(queryText, params);

        res.json({ attendance: result.rows });
    } catch (error) {
        console.error('Get user attendance error:', error);
        res.status(500).json({ error: 'Failed to fetch attendance' });
    }
};

/**
 * Get attendance summary for dashboard
 */
export const getAttendanceSummary = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        let summary;

        if (req.user.role === 'admin') {
            // Admin: Get overall attendance statistics
            const result = await query(`
        SELECT 
          COUNT(DISTINCT user_id) as total_interns,
          COUNT(*) as total_records,
          SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as total_present,
          SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as total_absent,
          SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as total_late
        FROM attendance
        WHERE date >= CURRENT_DATE - INTERVAL '30 days'
      `);

            summary = result.rows[0];
        } else {
            // Intern: Get personal attendance summary
            const result = await query(`
        SELECT 
          COUNT(*) as total_days,
          SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_days,
          SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_days,
          SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_days
        FROM attendance
        WHERE user_id = $1
      `, [req.user.id]);

            summary = result.rows[0];
        }

        res.json({ summary });
    } catch (error) {
        console.error('Get attendance summary error:', error);
        res.status(500).json({ error: 'Failed to fetch attendance summary' });
    }
};
