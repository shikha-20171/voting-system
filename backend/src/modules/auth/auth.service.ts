import { AuditAction, RoleType } from '@prisma/client';
import { env } from '../../config/env.js';
import { prisma } from '../../lib/prisma.js';
import { AuthenticatedUserPayload } from '../../common/types.js';
import { logAudit } from '../../middleware/audit.js';
import { SmsProviderFactory } from '../../lib/sms/factory.js';
import { RequestOtpDto, VerifyOtpDto } from './auth.schema.js';
import { OtpService } from './services/otp.service.js';
import { TokenService } from './services/token.service.js';
import { HierarchyAssignmentService } from './services/hierarchy-assignment.service.js';

export class AuthService {
  /**
   * Finds existing user by mobile number or auto-provisions a new user with appropriate role.
   */
  private static async findOrCreateUser(cleanMobile: string, role: RoleType) {
    let user = await prisma.user.findFirst({
      where: {
        mobileNumber: {
          endsWith: cleanMobile,
        },
      },
      include: {
        organisation: true,
        roleRef: true,
      },
    });

    let roleRecord = await prisma.role.findFirst({ where: { code: role } });
    if (!roleRecord) {
      const org = await prisma.organisation.findFirst();
      if (org) {
        try {
          roleRecord = await prisma.role.create({
            data: {
              organisationId: org.id,
              code: role,
              name: role.replace(/_/g, ' '),
              hierarchyLevel: 'CONSTITUENCY',
            },
          });
        } catch {
          roleRecord = await prisma.role.findFirst({ where: { code: role } });
        }
      }
    }

    if (user) {
      if (user.role !== role) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            role,
            roleId: roleRecord?.id || user.roleId,
            accountStatus: 'ACTIVE',
            isVerified: true,
          },
          include: {
            organisation: true,
            roleRef: true,
          },
        });
      }
    } else {
      const org = await prisma.organisation.findFirst();
      user = await prisma.user.create({
        data: {
          organisationId: org?.id || null,
          userCode: `USR-${role.slice(0, 4)}-${cleanMobile.slice(-4)}-${Date.now().toString().slice(-4)}`,
          name: `${role.replace(/_/g, ' ')} Officer`,
          mobileNumber: cleanMobile,
          role,
          roleId: roleRecord?.id,
          accountStatus: 'ACTIVE',
          isVerified: true,
        },
        include: { organisation: true, roleRef: true },
      });
    }

    return user;
  }

  /**
   * Requests a login OTP: provisions identity, checks cooldown, generates OTP, and sends SMS.
   */
  static async requestOtp(dto: RequestOtpDto, reqInfo?: { ip?: string; userAgent?: string }) {
    const cleanMobile = dto.mobileNumber.replace(/\D/g, '').slice(-10);

    // 1. Verify or dynamically associate user for given role and mobile number
    const user = await this.findOrCreateUser(cleanMobile, dto.role);

    if (user.accountStatus !== 'ACTIVE') {
      throw new Error('This user account is currently suspended or inactive.');
    }

    // 2. Ensure user has valid organizationUnit and userHierarchyAssignment
    await HierarchyAssignmentService.resolveUnitAndAssignment(user, dto.role);

    // 3. Enforce Resend Cooldown
    await OtpService.enforceCooldown(cleanMobile, dto.role);

    // 4. Generate and Save OTP Record
    const { record, rawOtp } = await OtpService.generateAndSaveOtp(cleanMobile, dto.role, user.id);

    // 5. Dispatch through configured SMS Provider
    const smsProvider = SmsProviderFactory.getProvider();
    const smsResult = await smsProvider.sendOtp(cleanMobile, rawOtp, {
      senderId: env.SMS_SENDER_ID,
      templateId: env.SMS_TEMPLATE_ID,
    });

    console.log(`[SMS Dispatch] Mobile: +91${cleanMobile}, Role: ${dto.role}, Provider: ${smsProvider.name}, Success: ${smsResult.success}, Error: ${smsResult.error || 'None'}, OTP: ${rawOtp}`);

    // 6. Audit Logging
    await logAudit({
      action: AuditAction.CREATE,
      entityType: 'OTPVerification',
      entityId: record.id,
      userId: user.id,
      changes: {
        role: dto.role,
        provider: smsProvider.name,
        smsDispatched: smsResult.success,
      },
      ipAddress: reqInfo?.ip,
      userAgent: reqInfo?.userAgent,
    });

    return {
      requestId: record.id,
      expiresAt: record.expiresAt,
      cooldownSeconds: 30,
      provider: smsProvider.name,
      devOtp: rawOtp,
    };
  }

  /**
   * Verifies an OTP submission and issues access tokens and login sessions.
   */
  static async verifyOtp(dto: VerifyOtpDto, reqInfo?: { ip?: string; userAgent?: string }) {
    const record = await prisma.oTPVerification.findUnique({
      where: { id: dto.requestId },
      include: {
        user: {
          include: {
            organisation: true,
            roleRef: true,
            cadreProfile: true,
            hierarchyAssignments: {
              where: { isActive: true },
              include: {
                state: true,
                zone: true,
                parliament: true,
                constituency: true,
                mandal: true,
                village: true,
                booth: true,
                voterGroup: true,
              },
            },
            unit: true,
          },
        },
      },
    });

    if (!record) {
      const error: any = new Error('Invalid OTP session request ID.');
      error.code = 'INVALID_OTP_REQUEST';
      error.statusCode = 400;
      throw error;
    }

    // Validate attempts, expiry, and hash
    await OtpService.validateOtpAttempt(record, dto.otpCode, reqInfo);

    const user = record.user;
    if (!user) {
      throw new Error('User account not found for this verification.');
    }

    if (user.accountStatus !== 'ACTIVE') {
      throw new Error('User account is currently inactive.');
    }

    // Construct authenticated payload & issue tokens
    const payload: AuthenticatedUserPayload = {
      userId: user.id,
      userCode: user.userCode,
      mobileNumber: user.mobileNumber,
      role: user.role,
      organisationId: user.organisationId,
      unitId: user.unitId,
    };

    const { token, refreshToken, sessionId } = TokenService.generateTokens(payload);

    // Create LoginSession record
    const loginSession = await TokenService.recordLoginSession(
      user.id,
      user.mobileNumber,
      token,
      sessionId,
      reqInfo
    );

    // Resolve primary hierarchy assignment
    const primaryAssignment = user.hierarchyAssignments[0] || null;

    // Log Audit
    await logAudit({
      action: AuditAction.LOGIN,
      entityType: 'User',
      entityId: user.id,
      userId: user.id,
      unitId: user.unitId ?? undefined,
      ipAddress: reqInfo?.ip,
      userAgent: reqInfo?.userAgent,
      metadata: {
        sessionId: loginSession.id,
        mobileNumber: user.mobileNumber,
        role: user.role,
      },
    });

    return {
      token,
      refreshToken,
      user: {
        id: user.id,
        userCode: user.userCode,
        name: user.name,
        mobileNumber: user.mobileNumber,
        email: user.email,
        role: user.role,
        roleDetails: user.roleRef,
        accountStatus: user.accountStatus,
        organisation: user.organisation,
        unitId: user.unitId,
        unitName: user.unit?.name,
        cadre: user.cadreProfile,
        hierarchyAssignment: HierarchyAssignmentService.formatHierarchyAssignment(primaryAssignment),
      },
    };
  }

  /**
   * Refreshes an active session with a valid refresh token.
   */
  static async refreshSession(refreshTokenString: string, reqInfo?: { ip?: string; userAgent?: string }) {
    try {
      const decoded = TokenService.verifyRefreshToken(refreshTokenString);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: {
          organisation: true,
          roleRef: true,
          unit: true,
          hierarchyAssignments: {
            where: { isActive: true },
            include: {
              state: true,
              zone: true,
              parliament: true,
              constituency: true,
              mandal: true,
              village: true,
              booth: true,
              voterGroup: true,
            },
          },
        },
      });

      if (!user || user.accountStatus !== 'ACTIVE') {
        const error: any = new Error('Account inactive or not found');
        error.statusCode = 401;
        throw error;
      }

      const payload: AuthenticatedUserPayload = {
        userId: user.id,
        userCode: user.userCode,
        mobileNumber: user.mobileNumber,
        role: user.role,
        organisationId: user.organisationId,
        unitId: user.unitId,
      };

      const token = TokenService.generateAccessToken(payload);

      await logAudit({
        action: AuditAction.LOGIN,
        entityType: 'User',
        entityId: user.id,
        userId: user.id,
        unitId: user.unitId ?? undefined,
        ipAddress: reqInfo?.ip,
        userAgent: reqInfo?.userAgent,
        metadata: { event: 'SESSION_REFRESH' },
      });

      return {
        token,
        user: {
          id: user.id,
          userCode: user.userCode,
          name: user.name,
          mobileNumber: user.mobileNumber,
          role: user.role,
          accountStatus: user.accountStatus,
          organisation: user.organisation,
          unitId: user.unitId,
          hierarchyAssignment: user.hierarchyAssignments[0] || null,
        },
      };
    } catch {
      const error: any = new Error('Invalid or expired refresh token.');
      error.code = 'INVALID_REFRESH_TOKEN';
      error.statusCode = 401;
      throw error;
    }
  }

  /**
   * Logs out user and revokes active sessions.
   */
  static async logout(userId: string, _tokenString?: string, reqInfo?: { ip?: string; userAgent?: string }) {
    await TokenService.revokeSessions(userId);

    await logAudit({
      action: AuditAction.LOGOUT,
      entityType: 'User',
      entityId: userId,
      userId,
      ipAddress: reqInfo?.ip,
      userAgent: reqInfo?.userAgent,
      metadata: { event: 'USER_LOGOUT' },
    });

    return { success: true };
  }

  /**
   * Retrieves profile information for the authenticated user.
   */
  static async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        organisation: true,
        roleRef: true,
        cadreProfile: true,
        hierarchyAssignments: {
          where: { isActive: true },
          include: {
            state: true,
            zone: true,
            parliament: true,
            constituency: true,
            mandal: true,
            village: true,
            booth: true,
            voterGroup: true,
          },
        },
        unit: true,
      },
    });

    if (!user) {
      const error: any = new Error('User account not found.');
      error.code = 'USER_NOT_FOUND';
      error.statusCode = 404;
      throw error;
    }

    const primaryAssignment = user.hierarchyAssignments[0] || null;

    return {
      id: user.id,
      userCode: user.userCode,
      name: user.name,
      mobileNumber: user.mobileNumber,
      email: user.email,
      role: user.role,
      roleDetails: user.roleRef,
      accountStatus: user.accountStatus,
      organisation: user.organisation,
      unitId: user.unitId,
      unitName: user.unit?.name,
      cadre: user.cadreProfile,
      hierarchyAssignment: HierarchyAssignmentService.formatHierarchyAssignment(primaryAssignment),
      hierarchyAssignments: user.hierarchyAssignments,
    };
  }
}
