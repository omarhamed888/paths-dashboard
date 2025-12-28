import { Router } from 'express';
import {
    getProfile,
    updateProfile,
    uploadProfilePhoto,
    getAllInterns,
    getInternById,
} from '../controllers/users.controller';
import { createUser, deleteUser } from '../controllers/user-management.controller';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';
import { uploadMiddleware } from '../middleware/upload.middleware';

const router = Router();

/**
 * GET /api/users/profile
 * Get current user profile with statistics
 * Requires authentication
 */
router.get('/profile', authenticateToken, getProfile);

/**
 * PUT /api/users/profile
 * Update current user profile (name, bio, department)
 * Requires authentication
 */
router.put('/profile', authenticateToken, updateProfile);

/**
 * POST /api/users/profile/photo
 * Upload profile photo
 * Requires authentication
 */
router.post('/profile/photo', authenticateToken, uploadMiddleware.single('photo'), uploadProfilePhoto);

/**
 * GET /api/users
 * List all interns (admin only)
 */
router.get('/', authenticateToken, requireAdmin, getAllInterns);

/**
 * POST /api/users
 * Create new user (admin only)
 */
router.post('/', authenticateToken, requireAdmin, createUser);

/**
 * GET /api/users/:id
 * Get specific intern details (admin only)
 */
router.get('/:id', authenticateToken, requireAdmin, getInternById);

/**
 * DELETE /api/users/:id
 * Delete user (admin only)
 */
router.delete('/:id', authenticateToken, requireAdmin, deleteUser);

export default router;
