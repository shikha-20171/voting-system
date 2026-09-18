import { FastifyInstance } from 'fastify';
import { validateBody } from '../../common/validation.js';
import { authenticate } from '../../middleware/auth.js';
import { requestOtpSchema, verifyOtpSchema, refreshTokenSchema } from './auth.schema.js';
import { AuthController } from './auth.controller.js';

export async function authRoutes(fastify: FastifyInstance) {
  // Rate limited OTP generation
  fastify.post(
    '/request-otp',
    {
      config: {
        rateLimit: {
          max: process.env.NODE_ENV === 'test' ? 100 : 10,
          timeWindow: '1 minute',
        },
      },
      preValidation: [validateBody(requestOtpSchema)],
    },
    AuthController.requestOtp,
  );

  // Verify OTP
  fastify.post(
    '/verify-otp',
    {
      config: {
        rateLimit: {
          max: process.env.NODE_ENV === 'test' ? 100 : 20,
          timeWindow: '1 minute',
        },
      },
      preValidation: [validateBody(verifyOtpSchema)],
    },
    AuthController.verifyOtp,
  );

  // Refresh token
  fastify.post(
    '/refresh',
    {
      preValidation: [validateBody(refreshTokenSchema)],
    },
    AuthController.refresh,
  );

  // Logout
  fastify.post('/logout', AuthController.logout);

  // Authenticated user profile
  fastify.get(
    '/me',
    {
      preHandler: [authenticate],
    },
    AuthController.me,
  );
}
