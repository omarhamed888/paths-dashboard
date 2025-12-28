import { query } from '../config/db';

/**
 * Create a notification for a user
 * Used across multiple modules for automation rules
 */
export const createNotification = async (
    userId: string,
    type: 'task' | 'attendance' | 'rating' | 'system',
    title: string,
    message: string,
    severity: 'info' | 'warning' | 'critical' = 'info'
): Promise<void> => {
    try {
        await query(
            `INSERT INTO notifications (user_id, type, title, message, severity)
       VALUES ($1, $2, $3, $4, $5)`,
            [userId, type, title, message, severity]
        );
        console.log(`📬 Notification created for user ${userId}: ${title}`);
    } catch (error) {
        console.error('Create notification error:', error);
        throw error;
    }
};
