import { Router } from 'express';
import {
    markAttendance,
    getUserAttendance,
    getAttendanceSummary,
} from '../controllers/attendance.controller';
import { authenticateToken, requireAdmin, requireAdminOrSelf } from '../middleware/auth.middleware';

const router = Router();

/**
 * POST /api/attendance
 * Mark attendance for an intern (admin only)
 * Automatically triggers 2-day absence alert if applicable
 */
router.post('/', authenticateToken, requireAdmin, markAttendance);

/**
 * GET /api/attendance/user/:userId
 * Get attendance history for a specific user
 * Admin can view any user, interns can only view their own
 */
router.get('/user/:userId', authenticateToken, requireAdminOrSelf, getUserAttendance);

/**
 * GET /api/attendance/summary
 * Get attendance summary for dashboard
 */
router.get('/summary', authenticateToken, getAttendanceSummary);

export default router;
