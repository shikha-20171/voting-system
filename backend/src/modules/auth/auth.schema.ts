import { z } from 'zod';
import { RoleType } from '@prisma/client';

export const requestOtpSchema = z.object({
  mobileNumber: z.string().min(10, 'Mobile number must be at least 10 digits').max(15),
  role: z.nativeEnum(RoleType),
});

export const verifyOtpSchema = z.object({
  requestId: z.string().uuid(),
  otpCode: z.string().length(6, 'OTP must be 6 digits'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().optional(),
});

export type RequestOtpDto = z.infer<typeof requestOtpSchema>;
export type VerifyOtpDto = z.infer<typeof verifyOtpSchema>;
