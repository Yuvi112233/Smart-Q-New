import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_COOKIE = 'sq_auth';
const JWT_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function signAuthToken(payload: Record<string, any>): string {
  const secret = process.env.JWT_SECRET || 'dev-secret';
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

function readAuth(req: Request): { userId?: string; isAdmin?: boolean } | null {
  const secret = process.env.JWT_SECRET || 'dev-secret';
  const token = (req as any).cookies?.[JWT_COOKIE] || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : undefined);
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, secret) as any;
    return { userId: decoded.sub, isAdmin: decoded.isAdmin };
  } catch {
    return null;
  }
}

// Simple authentication middleware for development
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  const auth = readAuth(req);
  if (auth?.userId) {
    (req as any).user = { claims: { sub: auth.userId, isAdmin: auth.isAdmin } };
    return next();
  }
  return res.status(401).json({ message: 'Unauthorized' });
}

// Optional authentication - doesn't fail if not authenticated
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const auth = readAuth(req);
  if (auth?.userId) {
    (req as any).user = { claims: { sub: auth.userId, isAdmin: auth.isAdmin } };
  }
  next();
}

export function setAuthCookie(res: Response, userId: string, isAdmin: boolean) {
  const token = signAuthToken({ sub: userId, isAdmin });
  res.cookie(JWT_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: JWT_MAX_AGE_MS,
    path: '/',
  });
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(JWT_COOKIE, { path: '/' });
}