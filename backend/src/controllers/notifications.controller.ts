import { Response } from 'express';
import { query } from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';

/**
 * Get notifications for current user
 */
export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        const { limit = 50, offset = 0, is_read } = req.query;

        let queryText = `
      SELECT id, type, title, message, is_read, severity, created_at
      FROM notifications
      WHERE user_id = $1
    `;
        const params: any[] = [req.user.id];
        let paramCount = 2;

        if (is_read !== undefined) {
            queryText += ` AND is_read = $${paramCount++}`;
            params.push(is_read === 'true');
        }

        queryText += ` ORDER BY created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount}`;
        params.push(limit, offset);

        const result = await query(queryText, params);

        res.json({ notifications: result.rows });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
};

/**
 * Mark notification as read
 */
export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        const { id } = req.params;

        const result = await query(
            'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING *',
            [id, req.user.id]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Notification not found' });
            return;
        }

        res.json({ notification: result.rows[0] });
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
};

/**
 * Get count of unread notifications
 */
export const getUnreadCount = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        const result = await query(
            'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
            [req.user.id]
        );

        res.json({ count: parseInt(result.rows[0].count) });
    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({ error: 'Failed to get unread count' });
    }
};
