import { Router } from 'express';
import { login, logout, getCurrentUser } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

/**
 * POST /api/auth/login
 * Login with email and password
 * Returns JWT token in httpOnly cookie
 */
router.post('/login', login);

/**
 * POST /api/auth/logout
 * Clear authentication cookie
 */
router.post('/logout', logout);

/**
 * GET /api/auth/me
 * Get current authenticated user profile
 * Requires authentication
 */
router.get('/me', authenticateToken, getCurrentUser);

export default router;
