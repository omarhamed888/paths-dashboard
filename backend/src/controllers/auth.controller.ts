import { Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';

/**
 * Login controller
 * Validates credentials and returns JWT token in httpOnly cookie
 */
export const login = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }

        // Find user by email
        const result = await query(
            'SELECT id, email, password_hash, role, full_name, is_active FROM users WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        const user = result.rows[0];

        // Check if user is active
        if (!user.is_active) {
            res.status(403).json({ error: 'Account is inactive' });
            return;
        }

        // Verify password
        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatch) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        // Generate JWT token
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            console.error('JWT_SECRET not configured');
            res.status(500).json({ error: 'Server configuration error' });
            return;
        }

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role,
            },
            secret,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        // Set httpOnly cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        // Return user info (without password)
        res.json({
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                full_name: user.full_name,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
};

/**
 * Logout controller
 * Clears the authentication cookie
 */
export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
};

/**
 * Get current user controller
 * Returns current authenticated user information
 */
export const getCurrentUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        // Fetch full user details from database
        const result = await query(
            `SELECT id, email, role, full_name, profile_photo_url, bio, department, created_at 
       FROM users WHERE id = $1`,
            [req.user.id]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.json({ user: result.rows[0] });
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({ error: 'Failed to fetch user data' });
    }
};
