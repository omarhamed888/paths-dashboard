import { Response } from 'express';
import { query } from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';
import bcrypt from 'bcrypt';

/**
 * Create new user (admin only)
 */
export const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { email, password, full_name, role, department } = req.body;

        // Validate required fields
        if (!email || !password || !full_name) {
            res.status(400).json({ error: 'Email, password, and full name are required' });
            return;
        }

        // Check if user already exists
        const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            res.status(400).json({ error: 'User with this email already exists' });
            return;
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Insert user
        const result = await query(
            `INSERT INTO users (email, password_hash, full_name, role, department)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, role, full_name, department, created_at`,
            [email, passwordHash, full_name, role || 'intern', department]
        );

        res.status(201).json({ user: result.rows[0] });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
};

/**
 * Delete user (admin only)
 */
export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        // Cannot delete yourself
        if (req.user && req.user.id === id) {
            res.status(400).json({ error: 'Cannot delete your own account' });
            return;
        }

        const result = await query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
};
