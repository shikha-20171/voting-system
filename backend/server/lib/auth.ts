import jwt, { type SignOptions } from 'jsonwebtoken';
import { RoleType } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'kondapi-dev-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface AuthTokenPayload {
  sub: string;
  userCode: string;
  role: RoleType;
  unitId: string;
}

export function signAccessToken(payload: AuthTokenPayload): string {
  const options: SignOptions = { expiresIn: JWT_EXPIRES_IN as SignOptions['expiresIn'] };
  return jwt.sign(payload, JWT_SECRET, options);
}

export function verifyAccessToken(token: string): AuthTokenPayload {
  return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
}

export function extractBearerToken(headerValue?: string | string[]): string | null {
  if (!headerValue || Array.isArray(headerValue)) {
    return null;
  }

  const [scheme, token] = headerValue.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return null;
  }

  return token;
}
