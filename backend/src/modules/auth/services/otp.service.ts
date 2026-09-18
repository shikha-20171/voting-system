import { env } from '../../../config/env.js';
import { prisma } from '../../../lib/prisma.js';
import { generateSecureOtp, hashOtp, verifyOtpHash } from '../../../lib/crypto.js';
import { logAudit } from '../../../middleware/audit.js';
import { AuditAction, RoleType } from '@prisma/client';

export interface GeneratedOtp {
  record: {
    id: string;
    expiresAt: Date;
    userId: string | null;
  };
  rawOtp: string;
}

export class OtpService {
  /**
   * Enforces resend cooldown (e.g. 30s) to prevent spamming SMS/OTP requests.
   */
  static async enforceCooldown(cleanMobile: string, role: RoleType, cooldownMs = 30000): Promise<void> {
    const latestOtp = await prisma.oTPVerification.findFirst({
      where: {
        mobileNumber: cleanMobile,
        role,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (latestOtp) {
      const timeSinceLastOtp = Date.now() - latestOtp.createdAt.getTime();
      if (timeSinceLastOtp < cooldownMs) {
        const waitSeconds = Math.ceil((cooldownMs - timeSinceLastOtp) / 1000);
        const error: any = new Error(`Please wait ${waitSeconds}s before requesting a new OTP.`);
        error.code = 'OTP_COOLDOWN_ACTIVE';
        error.statusCode = 429;
        error.retryAfter = waitSeconds;
        throw error;
      }
    }
  }

  /**
   * Generates a cryptographically secure OTP, hashes it, and persists the record.
   */
  static async generateAndSaveOtp(cleanMobile: string, role: RoleType, userId: string): Promise<GeneratedOtp> {
    const rawOtp = generateSecureOtp();
    const hashedOtp = hashOtp(rawOtp, cleanMobile);
    const expiresAt = new Date(Date.now() + env.OTP_EXPIRY_MS);

    const record = await prisma.oTPVerification.create({
      data: {
        mobileNumber: cleanMobile,
        role,
        otpCode: hashedOtp,
        expiresAt,
        userId,
        attempts: 0,
      },
      select: {
        id: true,
        expiresAt: true,
        userId: true,
      },
    });

    return { record, rawOtp };
  }

  /**
   * Validates OTP verification record and checks code hash, expirations, and attempt limits.
   */
  static async validateOtpAttempt(
    record: any,
    otpCode: string,
    reqInfo?: { ip?: string; userAgent?: string }
  ): Promise<void> {
    if (record.verifiedAt) {
      const error: any = new Error('This OTP code has already been used. Please request a new code.');
      error.code = 'OTP_ALREADY_USED';
      error.statusCode = 400;
      throw error;
    }

    if (record.attempts >= env.OTP_MAX_ATTEMPTS) {
      const error: any = new Error('Maximum OTP verification attempts exceeded. Please request a new OTP.');
      error.code = 'OTP_MAX_ATTEMPTS_EXCEEDED';
      error.statusCode = 429;
      throw error;
    }

    if (record.expiresAt.getTime() < Date.now()) {
      const error: any = new Error('OTP has expired. Please request a new OTP code.');
      error.code = 'OTP_EXPIRED';
      error.statusCode = 400;
      throw error;
    }

    const isValid = verifyOtpHash(otpCode, record.mobileNumber, record.otpCode);

    if (!isValid) {
      const updatedRecord = await prisma.oTPVerification.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });

      const remainingAttempts = Math.max(0, env.OTP_MAX_ATTEMPTS - updatedRecord.attempts);

      await logAudit({
        action: AuditAction.LOGIN,
        entityType: 'User',
        entityId: record.userId || record.id,
        userId: record.userId || record.id,
        ipAddress: reqInfo?.ip,
        userAgent: reqInfo?.userAgent,
        metadata: {
          event: 'OTP_FAILED_ATTEMPT',
          attempts: updatedRecord.attempts,
          remainingAttempts,
        },
      });

      const error: any = new Error(
        remainingAttempts > 0
          ? `Incorrect OTP code. ${remainingAttempts} attempt${remainingAttempts === 1 ? '' : 's'} remaining.`
          : 'Maximum attempts exceeded. This OTP has been invalidated.'
      );
      error.code = 'INCORRECT_OTP';
      error.statusCode = 400;
      error.remainingAttempts = remainingAttempts;
      throw error;
    }

    await prisma.oTPVerification.update({
      where: { id: record.id },
      data: { verifiedAt: new Date() },
    });
  }
}
