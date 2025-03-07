import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// Protect routes
export const protect = async (req: Request, res: Response, next: NextFunction) => {
  let token;

  // Check if token exists in headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // TEMPORARY: Check for mock token for testing
      if (token === 'mock-token-for-testing') {
        console.log('Using mock token for testing');
        // Create a mock user
        req.user = {
          id: 'mock-user-id',
          username: 'TestPlayer',
          email: 'test@example.com',
          avatar: 'https://via.placeholder.com/150',
          stats: {
            wins: 10,
            losses: 5,
            totalGames: 15,
            totalScore: 150,
            accuracy: 0.75
          }
        };
        return next();
      }

      // Normal token verification
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };

      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');

      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Admin middleware
export const admin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as an admin' });
  }
};
