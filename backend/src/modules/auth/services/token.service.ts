import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../../../config/env.js';
import { prisma } from '../../../lib/prisma.js';
import { hashOtp } from '../../../lib/crypto.js';
import { AuthenticatedUserPayload } from '../../../common/types.js';

export interface IssuedTokens {
  token: string;
  refreshToken: string;
  sessionId: string;
}

export class TokenService {
  /**
   * Signs standard JWT access token and refresh token.
   */
  static generateTokens(payload: AuthenticatedUserPayload): IssuedTokens {
    const sessionId = crypto.randomUUID();

    const tokenOptions: SignOptions = {
      expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
      jwtid: sessionId,
    };

    const refreshTokenOptions: SignOptions = {
      expiresIn: env.REFRESH_TOKEN_EXPIRES_IN as SignOptions['expiresIn'],
      jwtid: crypto.randomUUID(),
    };

    const token = jwt.sign(payload, env.JWT_SECRET, tokenOptions);
    const refreshToken = jwt.sign({ userId: payload.userId, sessionId }, env.JWT_SECRET, refreshTokenOptions);

    return { token, refreshToken, sessionId };
  }

  /**
   * Generates a single access token for session refreshes.
   */
  static generateAccessToken(payload: AuthenticatedUserPayload): string {
    const tokenOptions: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'] };
    return jwt.sign(payload, env.JWT_SECRET, tokenOptions);
  }

  /**
   * Verifies a refresh token and extracts decoded userId.
   */
  static verifyRefreshToken(refreshTokenString: string): { userId: string } {
    return jwt.verify(refreshTokenString, env.JWT_SECRET) as { userId: string };
  }

  /**
   * Persists a login session in the database.
   */
  static async recordLoginSession(
    userId: string,
    mobileNumber: string,
    token: string,
    sessionId: string,
    reqInfo?: { ip?: string; userAgent?: string }
  ) {
    const sessionExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return prisma.loginSession.create({
      data: {
        userId,
        tokenHash: hashOtp(`${token.slice(-32)}:${sessionId}`, mobileNumber),
        ipAddress: reqInfo?.ip,
        deviceInfo: reqInfo?.userAgent,
        expiresAt: sessionExpiresAt,
      },
    });
  }

  /**
   * Revokes all active login sessions for a user upon logout.
   */
  static async revokeSessions(userId: string): Promise<void> {
    await prisma.loginSession.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }
}
