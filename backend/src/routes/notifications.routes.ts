import { Router } from 'express';
import {
    getNotifications,
    markAsRead,
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
