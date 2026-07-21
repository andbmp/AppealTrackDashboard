import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-dev';

export interface AuthRequest extends Request {
  user?: any;
}

export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
       res.status(401).json({ error: 'Access denied: No token provided' });
       return;
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      req.user = decoded;

      if (!allowedRoles.includes(decoded.role)) {
         res.status(403).json({ error: 'Access denied: Insufficient permissions' });
         return;
      }
      
      next();
    } catch (err) {
      res.status(401).json({ error: 'Invalid token' });
    }
  };
};

export const Roles = {
  ADMIN: 'Admin',
  MANAJEMEN: 'Manajemen',
  STAFF: 'Staff'
};
