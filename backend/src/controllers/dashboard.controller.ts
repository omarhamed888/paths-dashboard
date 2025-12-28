import { Response } from 'express';
import { query } from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';

/**
 * Get admin dashboard KPIs
 */
export const getAdminDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        // Total interns
        const internsResult = await query(
            "SELECT COUNT(*) as count FROM users WHERE role = 'intern' AND is_active = true"
        );
        const totalInterns = parseInt(internsResult.rows[0].count);

        // Interns at risk (with low ratings or performance alerts)
        const atRiskResult = await query(`
      SELECT COUNT(DISTINCT u.id) as count
      FROM users u
      LEFT JOIN task_assignments ta ON u.id = ta.intern_id
      LEFT JOIN task_submissions ts ON ta.id = ts.task_assignment_id
      LEFT JOIN task_ratings tr ON ts.id = tr.task_submission_id
      LEFT JOIN notifications n ON u.id = n.user_id AND n.severity = 'critical' AND n.is_read = false
      WHERE u.role = 'intern' 
      AND (tr.rating < 3 OR n.id IS NOT NULL OR ta.status IN ('late', 'missed'))
      GROUP BY u.id
      HAVING COUNT(DISTINCT CASE WHEN ta.status IN ('late', 'missed') THEN ta.id END) >= 2
         OR COUNT(DISTINCT CASE WHEN tr.rating < 3 THEN tr.id END) >= 1
         OR COUNT(DISTINCT n.id) >= 1
    `);
        const internsAtRisk = parseInt(atRiskResult.rows[0]?.count || 0);

        // Overdue tasks
        const overdueResult = await query(`
      SELECT COUNT(*) as count
      FROM tasks t
      JOIN task_assignments ta ON t.id = ta.task_id
      WHERE t.deadline < CURRENT_TIMESTAMP 
      AND ta.status IN ('assigned', 'late', 'missed')
    `);
        const overdueTasks = parseInt(overdueResult.rows[0].count);

        // Absence alerts (critical notifications about attendance)
        const absenceAlertsResult = await query(`
      SELECT COUNT(*) as count
      FROM notifications
      WHERE type = 'attendance' 
      AND severity = 'critical' 
      AND is_read = false
    `);
        const absenceAlerts = parseInt(absenceAlertsResult.rows[0].count);

        // Recent task submissions
        const submissionsResult = await query(`
      SELECT 
        ts.id, ts.submitted_at, ts.is_late, ts.original_filename,
        t.title as task_title,
        u.full_name as intern_name,
        tr.rating
      FROM task_submissions ts
      JOIN task_assignments ta ON ts.task_assignment_id = ta.id
      JOIN tasks t ON ta.task_id = t.id
      JOIN users u ON ta.intern_id = u.id
      LEFT JOIN task_ratings tr ON ts.id = tr.task_submission_id
      ORDER BY ts.submitted_at DESC
      LIMIT 10
    `);

        // Active alerts
        const alertsResult = await query(`
      SELECT 
        n.id, n.title, n.message, n.severity, n.created_at,
        u.full_name as user_name
      FROM notifications n
      JOIN users u ON n.user_id = u.id
      WHERE n.severity IN ('warning', 'critical') AND n.is_read = false
      ORDER BY 
        CASE n.severity 
          WHEN 'critical' THEN 1 
          WHEN 'warning' THEN 2 
          ELSE 3 
        END,
        n.created_at DESC
      LIMIT 20
    `);

        res.json({
            kpis: {
                totalInterns,
                internsAtRisk,
                overdueTasks,
                absenceAlerts,
            },
            recentSubmissions: submissionsResult.rows,
            activeAlerts: alertsResult.rows,
        });
    } catch (error) {
        console.error('Get admin dashboard error:', error);
        res.status(500).json({ error: 'Failed to fetch admin dashboard' });
    }
};

/**
 * Get intern dashboard
 */
export const getInternDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        const internId = req.user.id;

        // Assigned tasks with details
        const tasksResult = await query(`
      SELECT 
        t.id, t.title, t.description, t.deadline,
        ta.status, ta.assigned_at, ta.id as assignment_id,
        ts.submitted_at, ts.is_late,
        tr.rating, tr.feedback
      FROM task_assignments ta
      JOIN tasks t ON ta.task_id = t.id
      LEFT JOIN task_submissions ts ON ta.id = ts.task_assignment_id
      LEFT JOIN task_ratings tr ON ts.id = tr.task_submission_id
      WHERE ta.intern_id = $1
      ORDER BY t.deadline ASC
    `, [internId]);

        // Attendance summary
        const attendanceResult = await query(`
      SELECT 
        COUNT(*) as total_days,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_days,
        SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_days,
        SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_days
      FROM attendance
      WHERE user_id = $1
    `, [internId]);

        // Recent ratings
        const ratingsResult = await query(`
      SELECT tr.rating, tr.feedback, tr.created_at, t.title as task_title
      FROM task_ratings tr
      JOIN task_submissions ts ON tr.task_submission_id = ts.id
      JOIN task_assignments ta ON ts.task_assignment_id = ta.id
      JOIN tasks t ON ta.task_id = t.id
      WHERE ta.intern_id = $1
      ORDER BY tr.created_at DESC
      LIMIT 5
    `, [internId]);

        // Unread notifications
        const notificationsResult = await query(`
      SELECT id, type, title, message, severity, created_at
      FROM notifications
      WHERE user_id = $1 AND is_read = false
      ORDER BY created_at DESC
      LIMIT 10
    `, [internId]);

        res.json({
            tasks: tasksResult.rows,
            attendance: attendanceResult.rows[0],
            recentRatings: ratingsResult.rows,
            notifications: notificationsResult.rows,
        });
    } catch (error) {
        console.error('Get intern dashboard error:', error);
        res.status(500).json({ error: 'Failed to fetch intern dashboard' });
    }
};

/**
 * Get active alerts (role-based)
 */
export const getAlerts = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        let alerts;

        if (req.user.role === 'admin') {
            // Admin: See all critical alerts
            const result = await query(`
        SELECT 
          n.id, n.title, n.message, n.severity, n.created_at,
          u.full_name as user_name, u.id as user_id
        FROM notifications n
        JOIN users u ON n.user_id = u.id
        WHERE n.severity IN ('warning', 'critical') AND n.is_read = false
        ORDER BY 
          CASE n.severity 
            WHEN 'critical' THEN 1 
            WHEN 'warning' THEN 2 
          END,
          n.created_at DESC
      `);
            alerts = result.rows;
        } else {
            // Intern: See own alerts
            const result = await query(`
        SELECT id, title, message, severity, created_at
        FROM notifications
        WHERE user_id = $1 
        AND severity IN ('warning', 'critical') 
        AND is_read = false
        ORDER BY 
          CASE severity 
            WHEN 'critical' THEN 1 
            WHEN 'warning' THEN 2 
          END,
          created_at DESC
      `, [req.user.id]);
            alerts = result.rows;
        }

        res.json({ alerts });
    } catch (error) {
        console.error('Get alerts error:', error);
        res.status(500).json({ error: 'Failed to fetch alerts' });
    }
};
