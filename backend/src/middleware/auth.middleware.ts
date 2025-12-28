import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: 'admin' | 'intern';
    };
}

/**
 * Middleware to verify JWT token from httpOnly cookie
 * Extracts user information and attaches to request object
 */
export const authenticateToken = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void => {
    try {
        const token = req.cookies?.token;

        if (!token) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        const secret = process.env.JWT_SECRET;
        if (!secret) {
            console.error('JWT_SECRET not configured');
            res.status(500).json({ error: 'Server configuration error' });
            return;
        }

        const decoded = jwt.verify(token, secret) as {
            id: string;
            email: string;
            role: 'admin' | 'intern';
        };

        req.user = decoded;
        next();
    } catch (error) {
        res.status(403).json({ error: 'Invalid or expired token' });
    }
};

/**
 * Middleware to require admin role
 * Must be used after authenticateToken
 */
export const requireAdmin = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void => {
    if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
    }

    if (req.user.role !== 'admin') {
        res.status(403).json({ error: 'Admin access required' });
        return;
    }

    next();
};

/**
 * Middleware to require intern role
 * Must be used after authenticateToken
 */
export const requireIntern = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void => {
    if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
    }

    if (req.user.role !== 'intern') {
        res.status(403).json({ error: 'Intern access required' });
        return;
    }

    next();
};

/**
 * Middleware to allow access for either admin or the resource owner
 * Checks if user is admin or if userId matches the requested user_id param
 */
export const requireAdminOrSelf = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void => {
    if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
    }

    const userId = req.params.userId || req.params.id;

    if (req.user.role === 'admin' || req.user.id === userId) {
        next();
    } else {
        res.status(403).json({ error: 'Access denied' });
    }
};
