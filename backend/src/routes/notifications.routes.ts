import { Router } from 'express';
import {
    getNotifications,
    markAsRead,
    markAllAsRead,
    getUnreadCount,
} from '../controllers/notifications.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

/**
 * GET /api/notifications
 * Get user notifications with filtering
 */
router.get('/', authenticateToken, getNotifications);

/**
 * PUT /api/notifications/mark-all-read
 * Mark all notifications as read
 */
router.put('/mark-all-read', authenticateToken, markAllAsRead);

/**
 * PUT /api/notifications/:id/read
 * Mark notification as read
 */
router.put('/:id/read', authenticateToken, markAsRead);

/**
 * GET /api/notifications/unread-count
 * Get count of unread notifications
 */
router.get('/unread-count', authenticateToken, getUnreadCount);

export default router;
