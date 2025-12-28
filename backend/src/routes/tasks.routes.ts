import { Router } from 'express';
import {
    createTask,
    deleteTask,
    assignTask,
    getTasks,
    getTaskById,
    submitTask,
    downloadSubmission,
    rateTask,
} from '../controllers/tasks.controller';
import { authenticateToken, requireAdmin, requireIntern } from '../middleware/auth.middleware';
import { uploadMiddleware } from '../middleware/upload.middleware';

const router = Router();

/**
 * POST /api/tasks
 * Create a new task (admin only)
 */
router.post('/', authenticateToken, requireAdmin, createTask);

/**
 * DELETE /api/tasks/:id
 * Delete a task (admin only)
 */
router.delete('/:id', authenticateToken, requireAdmin, deleteTask);

/**
 * POST /api/tasks/:id/assign
 * Assign task to interns (admin only)
 * AUTOMATION: Creates task notification for each assigned intern
 */
router.post('/:id/assign', authenticateToken, requireAdmin, assignTask);

/**
 * GET /api/tasks
 * List tasks (role-based filtering)
 */
router.get('/', authenticateToken, getTasks);

/**
 * GET /api/tasks/:id
 * Get task details with submissions
 */
router.get('/:id', authenticateToken, getTaskById);

/**
 * POST /api/tasks/submit/:assignmentId
 * Submit task with file upload (intern only)
 * AUTOMATION: Marks as late if past deadline, notifies admin
 */
router.post('/submit/:assignmentId', authenticateToken, requireIntern, uploadMiddleware.single('file'), submitTask);

/**
 * GET /api/tasks/download/:submissionId
 * Download submission file (role-based access)
 */
router.get('/download/:submissionId', authenticateToken, downloadSubmission);

/**
 * POST /api/tasks/rate/:submissionId
 * Rate a task submission (admin only)
 * AUTOMATION: Creates warning if rating < 3
 */
router.post('/rate/:submissionId', authenticateToken, requireAdmin, rateTask);

export default router;
