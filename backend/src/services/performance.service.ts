import { query } from '../config/db';
import { createNotification } from './notification.service';

/**
 * Check if intern has 2 or more late/missed task submissions
 * AUTOMATION RULE: Creates performance alert for intern and admins
 */
export const checkPerformanceAlerts = async (internId: string): Promise<void> => {
    try {
        // Count late and missed tasks
        const result = await query(`
      SELECT 
        SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_count,
        SUM(CASE WHEN status = 'missed' THEN 1 ELSE 0 END) as missed_count
      FROM task_assignments
      WHERE intern_id = $1
    `, [internId]);

        const { late_count, missed_count } = result.rows[0];
        const totalIssues = parseInt(late_count || 0) + parseInt(missed_count || 0);

        // AUTOMATION RULE: Create performance alert if 2+ issues
        if (totalIssues >= 2) {
        // Check if alert already exists recently to avoid duplicates
        const existingAlert = await query(`
        SELECT id FROM notifications
        WHERE user_id = $1
        AND type = 'system'
        AND severity = 'critical'
        AND message LIKE '%late or missed%'
        AND created_at > CURRENT_TIMESTAMP - INTERVAL '7 days'
      `, [internId]);

        if (existingAlert.rows.length === 0) {
            // Create critical alert for intern
            await createNotification(
                internId,
                'system',
                'Performance Alert',
                'You have multiple late or missed task submissions. This requires immediate attention and improvement.',
                'critical'
            );

            // Notify admins
            const userResult = await query('SELECT full_name FROM users WHERE id = $1', [internId]);
            const internName = userResult.rows[0]?.full_name || 'Intern';

            const adminResult = await query("SELECT id FROM users WHERE role = 'admin'");
            for (const admin of adminResult.rows) {
                await createNotification(
                    admin.id,
                    'system',
                    'Intern Performance Alert',
                    `${internName} has multiple late or missed submissions and may need additional support.`,
                    'warning'
                );
            }

            console.log(`🚨 Performance alert created for intern ${internId} (${totalIssues} issues)`);
        }
    }
  } catch (error) {
    console.error('Error checking performance alerts:', error);
}
};
