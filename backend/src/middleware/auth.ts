import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

export interface AuthRequest extends Request {
    userId?: string;
    isAdmin?: boolean;
}

export interface JWTPayload {
    userId: string;
    isAdmin: boolean;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
        req.userId = decoded.userId;
        req.isAdmin = decoded.isAdmin;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

export const generateToken = (userId: string, isAdmin: boolean): string => {
    return jwt.sign({ userId, isAdmin }, JWT_SECRET, { expiresIn: '7d' });
};
