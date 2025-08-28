// server/auth.ts
import jwt from "jsonwebtoken";
import { Response, Request, NextFunction } from "express";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";
export const JWT_COOKIE = "sq_auth";
const JWT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Token payload type
interface AuthClaims {
  sub: string;      // userId
  isAdmin: boolean; // admin flag
}

export function signAuthToken(claims: AuthClaims) {
  return jwt.sign(claims, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyAuthToken(token: string): AuthClaims {
  return jwt.verify(token, JWT_SECRET) as AuthClaims;
}

export function setAuthCookie(res: Response, userId: string, isAdmin: boolean) {
  const token = signAuthToken({ sub: userId, isAdmin });
  const isProd = process.env.NODE_ENV === "production";

  res.cookie(JWT_COOKIE, token, {
    httpOnly: true,
    sameSite: isProd ? "none" : "lax", // allow cross-site only in prod
    secure: isProd,                    // only enforce HTTPS in prod
    maxAge: JWT_MAX_AGE_MS,
    path: "/",
  });
}

export function clearAuthCookie(res: Response) {
  const isProd = process.env.NODE_ENV === "production";

  res.clearCookie(JWT_COOKIE, {
    httpOnly: true,
    sameSite: isProd ? "none" : "lax",
    secure: isProd,
    path: "/",
  });
}

// Middleware: require authentication
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies[JWT_COOKIE];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const claims = verifyAuthToken(token);
    (req as any).user = { claims };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

// Middleware: optional auth (for routes that can accept anonymous)
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies[JWT_COOKIE];
  if (token) {
    try {
      const claims = verifyAuthToken(token);
      (req as any).user = { claims };
    } catch {
      // ignore invalid token
    }
  }
  next();
}
