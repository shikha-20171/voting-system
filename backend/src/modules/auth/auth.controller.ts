import { FastifyReply, FastifyRequest } from 'fastify';
import { errorResponse, successResponse } from '../../common/response.js';
import { AuthService } from './auth.service.js';
import { RequestOtpDto, VerifyOtpDto } from './auth.schema.js';

export class AuthController {
  static async requestOtp(req: FastifyRequest, reply: FastifyReply) {
    const body = req.body as RequestOtpDto;
    try {
      const result = await AuthService.requestOtp(body, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });
      return reply.status(200).send(successResponse(result, 'OTP verification code dispatched successfully.'));
    } catch (err: any) {
      const statusCode = err.statusCode || 400;
      const code = err.code || 'OTP_REQUEST_FAILED';
      return reply.status(statusCode).send(errorResponse(err.message, code, {
        retryAfter: err.retryAfter,
      }));
    }
  }

  static async verifyOtp(req: FastifyRequest, reply: FastifyReply) {
    const body = req.body as VerifyOtpDto;
    try {
      const result = await AuthService.verifyOtp(body, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });

      // Set httpOnly Access Token Cookie
      reply.setCookie('access_token', result.token, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 86400, // 24 hours
      });

      // Set httpOnly Refresh Token Cookie
      reply.setCookie('refresh_token', result.refreshToken, {
        path: '/api/auth',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 86400, // 7 days
      });

      return reply.status(200).send(successResponse(result, 'OTP successfully verified and session created.'));
    } catch (err: any) {
      const statusCode = err.statusCode || 400;
      const code = err.code || 'VERIFICATION_FAILED';
      return reply.status(statusCode).send(errorResponse(err.message, code, {
        remainingAttempts: err.remainingAttempts,
      }));
    }
  }

  static async refresh(req: FastifyRequest, reply: FastifyReply) {
    const body = req.body as any;
    const cookies = (req as any).cookies || {};
    const refreshToken = body?.refreshToken || cookies?.refresh_token;

    if (!refreshToken) {
      return reply.status(401).send(errorResponse('Refresh token is required.', 'NO_REFRESH_TOKEN'));
    }

    try {
      const result = await AuthService.refreshSession(refreshToken, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });

      reply.setCookie('access_token', result.token, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 86400,
      });

      return reply.status(200).send(successResponse(result, 'Session refreshed successfully.'));
    } catch (err: any) {
      const statusCode = err.statusCode || 401;
      const code = err.code || 'REFRESH_FAILED';
      return reply.status(statusCode).send(errorResponse(err.message, code));
    }
  }

  static async logout(req: FastifyRequest, reply: FastifyReply) {
    const token = req.cookies?.access_token || req.headers.authorization?.replace('Bearer ', '');
    const userId = req.user?.userId;

    if (userId) {
      await AuthService.logout(userId, token, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });
    }

    reply.clearCookie('access_token', { path: '/' });
    reply.clearCookie('refresh_token', { path: '/api/auth' });

    return reply.status(200).send(successResponse({ loggedOut: true }, 'Logged out successfully.'));
  }

  static async me(req: FastifyRequest, reply: FastifyReply) {
    if (!req.user) {
      return reply.status(401).send(errorResponse('Authentication required.', 'UNAUTHORIZED'));
    }

    try {
      const user = await AuthService.getMe(req.user.userId);
      return reply.status(200).send(successResponse(user));
    } catch (err: any) {
      const statusCode = err.statusCode || 404;
      return reply.status(statusCode).send(errorResponse(err.message, err.code || 'USER_NOT_FOUND'));
    }
  }
}
