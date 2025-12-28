import { Router } from 'express';
import {
    getAdminDashboard,
    getInternDashboard,
    getAlerts,
} from '../controllers/dashboard.controller';
import { authenticateToken, requireAdmin, requireIntern } from '../middleware/auth.middleware';

const router = Router();

/**
 * GET /api/dashboard/admin
 * Get admin dashboard with KPIs
 */
router.get('/admin', authenticateToken, requireAdmin, getAdminDashboard);

/**
 * GET /api/dashboard/intern
 * Get intern personal dashboard
 */
router.get('/intern', authenticateToken, requireIntern, getInternDashboard);

/**
 * GET /api/dashboard/alerts
 * Get active alerts
 */
router.get('/alerts', authenticateToken, getAlerts);

export default router;
