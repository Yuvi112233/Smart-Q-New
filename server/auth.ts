import { Request, Response, NextFunction } from 'express';

// Simple authentication middleware for development
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  // For development, we'll use a simple approach
  // In production, this should validate JWT tokens or session data
  
  // Check if user is authenticated via session or token
  if (req.session && req.session.userId) {
    // User is authenticated via session
    req.user = { claims: { sub: req.session.userId } };
    return next();
  }
  
  // Check for authorization header (Bearer token)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    // For development, accept any non-empty token
    if (token) {
      req.user = { claims: { sub: 'dev-user' } };
      return next();
    }
  }
  
  // Fallback: allow as dev user when no session/token (to ease local dev)
  const isAdmin = req.session?.isAdmin || false;
  req.user = {
    claims: {
      sub: isAdmin ? 'admin-user' : 'dev-user',
      isAdmin: isAdmin
    }
  } as any;
  return next();
}

// Optional authentication - doesn't fail if not authenticated
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    isAuthenticated(req, res, next);
  } catch (error) {
    // Continue without authentication
    next();
  }
}
