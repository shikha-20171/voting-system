import { NextFunction, Request, Response } from 'express';
import { AuthTokenPayload, extractBearerToken, verifyAccessToken } from '../lib/auth.js';

declare global {
  namespace Express {
    interface Request {
      auth?: AuthTokenPayload;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = extractBearerToken(req.headers.authorization);

  if (!token) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  try {
    req.auth = verifyAccessToken(token);
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
}

export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction) {
  const token = extractBearerToken(req.headers.authorization);

  if (token) {
    try {
      req.auth = verifyAccessToken(token);
    } catch {
      // Ignore invalid token for optional auth paths.
    }
  }

  next();
}
