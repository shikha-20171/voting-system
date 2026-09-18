import { NextFunction, Request, Response } from 'express';

const otpAttempts = new Map<string, { count: number; resetAt: number }>();
const OTP_RATE_LIMIT = Number(process.env.OTP_RATE_LIMIT || 5);
const OTP_RATE_WINDOW_MS = Number(process.env.OTP_RATE_WINDOW_MS || 15 * 60 * 1000);

export function applySecurityHeaders(_req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-XSS-Protection', '0');
  next();
}

export function otpRateLimiter(req: Request, res: Response, next: NextFunction) {
  const mobile = typeof req.body?.mobileNumber === 'string' ? req.body.mobileNumber : 'unknown';
  const key = `${req.ip}:${mobile}`;
  const now = Date.now();
  const current = otpAttempts.get(key);

  if (!current || current.resetAt <= now) {
    otpAttempts.set(key, { count: 1, resetAt: now + OTP_RATE_WINDOW_MS });
    next();
    return;
  }

  if (current.count >= OTP_RATE_LIMIT) {
    res.status(429).json({ message: 'Too many OTP requests. Try again later.' });
    return;
  }

  current.count += 1;
  otpAttempts.set(key, current);
  next();
}

export function validateProductionEnv() {
  if (process.env.NODE_ENV !== 'production') return;

  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters in production');
  }

  if (process.env.OTP_STATIC_CODE) {
    console.warn('[security] OTP_STATIC_CODE is set in production; real OTP will still be generated');
  }
}
