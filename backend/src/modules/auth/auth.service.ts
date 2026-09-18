import jwt, { type SignOptions } from 'jsonwebtoken';
import { AuditAction, OrgHierarchyLevel, RoleType } from '@prisma/client';
import { env } from '../../config/env.js';
import { prisma } from '../../lib/prisma.js';
import { AuthenticatedUserPayload } from '../../common/types.js';
import { logAudit } from '../../middleware/audit.js';
import { generateSecureOtp, hashOtp, verifyOtpHash } from '../../lib/crypto.js';
import { SmsProviderFactory } from '../../lib/sms/factory.js';
import { RequestOtpDto, VerifyOtpDto } from './auth.schema.js';

export class AuthService {
  static async requestOtp(dto: RequestOtpDto, reqInfo?: { ip?: string; userAgent?: string }) {
    const cleanMobile = dto.mobileNumber.replace(/\D/g, '').slice(-10);

    // 1. Verify or dynamically associate user for given role and mobile number
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

    let roleRecord = await prisma.role.findFirst({ where: { code: dto.role } });
    if (!roleRecord) {
      const org = await prisma.organisation.findFirst();
      if (org) {
        try {
          roleRecord = await prisma.role.create({
            data: {
              organisationId: org.id,
              code: dto.role,
              name: dto.role.replace(/_/g, ' '),
              hierarchyLevel: 'CONSTITUENCY',
            },
          });
        } catch {
          roleRecord = await prisma.role.findFirst({ where: { code: dto.role } });
        }
      }
    }

    if (user) {
      if (user.role !== dto.role) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            role: dto.role,
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
          userCode: `USR-${dto.role.slice(0, 4)}-${cleanMobile.slice(-4)}-${Date.now().toString().slice(-4)}`,
          name: `${dto.role.replace(/_/g, ' ')} Officer`,
          mobileNumber: cleanMobile,
          role: dto.role,
          roleId: roleRecord?.id,
          accountStatus: 'ACTIVE',
          isVerified: true,
        },
        include: { organisation: true, roleRef: true },
      });
    }

    if (user.accountStatus !== 'ACTIVE') {
      throw new Error('This user account is currently suspended or inactive.');
    }

    // Ensure user has valid organizationUnit and userHierarchyAssignment
    const existingAssignment = await prisma.userHierarchyAssignment.findFirst({
      where: { userId: user.id, isActive: true },
    });

    if (!existingAssignment || !user.unitId) {
      let resolvedUnitId: string | null = null;
      const assignmentData: any = {
        userId: user.id,
        roleType: dto.role,
        isActive: true,
      };

      const constituency = await prisma.constituency.findFirst();
      const state = await prisma.state.findFirst();
      const zone = await prisma.zone.findFirst();
      const parliament = await prisma.parliament.findFirst();

      if (dto.role === RoleType.SUPER_ADMIN || dto.role === RoleType.STATE_ADMIN) {
        const stateUnit = await prisma.organizationUnit.findFirst({ where: { level: OrgHierarchyLevel.STATE } });
        resolvedUnitId = stateUnit?.id || null;
        if (state) assignmentData.stateId = state.id;
      } else if (dto.role === RoleType.ZONE_INCHARGE) {
        const zoneUnit = await prisma.organizationUnit.findFirst({ where: { level: OrgHierarchyLevel.ZONE } });
        resolvedUnitId = zoneUnit?.id || null;
        if (state) assignmentData.stateId = state.id;
        if (zone) assignmentData.zoneId = zone.id;
      } else if (dto.role === RoleType.PARLIAMENT_INCHARGE) {
        const parUnit = await prisma.organizationUnit.findFirst({ where: { level: OrgHierarchyLevel.PARLIAMENT } });
        resolvedUnitId = parUnit?.id || null;
        if (state) assignmentData.stateId = state.id;
        if (zone) assignmentData.zoneId = zone.id;
        if (parliament) assignmentData.parliamentId = parliament.id;
      } else if (dto.role === RoleType.CONSTITUENCY_INCHARGE || dto.role === RoleType.VIEWER) {
        const constUnit = await prisma.organizationUnit.findFirst({ where: { level: OrgHierarchyLevel.CONSTITUENCY } });
        resolvedUnitId = constUnit?.id || null;
        if (constituency) assignmentData.constituencyId = constituency.id;
      } else if (dto.role === RoleType.MANDAL_INCHARGE) {
        const mandal = await prisma.mandal.findFirst({ where: { constituencyId: constituency?.id } });
        const mandalUnit = mandal ? await prisma.organizationUnit.findFirst({ where: { name: mandal.name, level: OrgHierarchyLevel.MANDAL } }) : null;
        resolvedUnitId = mandalUnit?.id || null;
        if (constituency) assignmentData.constituencyId = constituency.id;
        if (mandal) assignmentData.mandalId = mandal.id;
      } else if (dto.role === RoleType.VILLAGE_INCHARGE) {
        const village = await prisma.village.findFirst({ include: { mandal: true } });
        const villageUnit = village ? await prisma.organizationUnit.findFirst({ where: { name: village.name, level: OrgHierarchyLevel.VILLAGE } }) : null;
        resolvedUnitId = villageUnit?.id || null;
        if (constituency) assignmentData.constituencyId = constituency.id;
        if (village?.mandalId) assignmentData.mandalId = village.mandalId;
        if (village) assignmentData.villageId = village.id;
      } else if (dto.role === RoleType.BOOTH_PRESIDENT || dto.role === RoleType.BOOTH_INCHARGE || dto.role === RoleType.POLLING_AGENT) {
        const booth = await prisma.booth.findFirst({ include: { village: true } });
        const boothUnit = booth ? await prisma.organizationUnit.findFirst({ where: { name: booth.name, level: OrgHierarchyLevel.BOOTH } }) : null;
        resolvedUnitId = boothUnit?.id || null;
        if (constituency) assignmentData.constituencyId = constituency.id;
        if (booth?.village?.mandalId) assignmentData.mandalId = booth.village.mandalId;
        if (booth?.villageId) assignmentData.villageId = booth.villageId;
        if (booth) assignmentData.boothId = booth.id;
      } else if (dto.role === RoleType.VOTER_100_INCHARGE) {
        const voterGroup = await prisma.voterGroup.findFirst({ include: { booth: { include: { village: true } } } });
        const vgUnit = voterGroup ? await prisma.organizationUnit.findFirst({ where: { code: voterGroup.code, level: OrgHierarchyLevel.VOTER_GROUP } }) : null;
        resolvedUnitId = vgUnit?.id || null;
        if (constituency) assignmentData.constituencyId = constituency.id;
        if (voterGroup?.booth?.village?.mandalId) assignmentData.mandalId = voterGroup.booth.village.mandalId;
        if (voterGroup?.booth?.villageId) assignmentData.villageId = voterGroup.booth.villageId;
        if (voterGroup?.boothId) assignmentData.boothId = voterGroup.boothId;
        if (voterGroup) assignmentData.voterGroupId = voterGroup.id;
      }

      if (resolvedUnitId && !user.unitId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { unitId: resolvedUnitId },
          include: { organisation: true, roleRef: true },
        });
      }

      if (!existingAssignment && (assignmentData.stateId || assignmentData.constituencyId || assignmentData.mandalId || assignmentData.villageId || assignmentData.boothId || assignmentData.voterGroupId)) {
        await prisma.userHierarchyAssignment.create({
          data: assignmentData,
        });
      }
    }

    const now = Date.now();

    // 2. Enforce Resend Cooldown (e.g. 30s)
    const latestOtp = await prisma.oTPVerification.findFirst({
      where: {
        mobileNumber: cleanMobile,
        role: dto.role,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (latestOtp && now - latestOtp.createdAt.getTime() < 30000) {
      const waitSeconds = Math.ceil((30000 - (now - latestOtp.createdAt.getTime())) / 1000);
      const error: any = new Error(`Please wait ${waitSeconds}s before requesting a new OTP.`);
      error.code = 'OTP_COOLDOWN_ACTIVE';
      error.statusCode = 429;
      error.retryAfter = waitSeconds;
      throw error;
    }

    // 3. Generate OTP Code
    const rawOtp = generateSecureOtp();

    // Hash OTP before persistence
    const hashedOtp = hashOtp(rawOtp, cleanMobile);
    const expiresAt = new Date(now + env.OTP_EXPIRY_MS);

    // 4. Save OTP Record
    const record = await prisma.oTPVerification.create({
      data: {
        mobileNumber: cleanMobile,
        role: dto.role,
        otpCode: hashedOtp,
        expiresAt,
        userId: user.id,
        attempts: 0,
      },
    });

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

    // Check if already used
    if (record.verifiedAt) {
      const error: any = new Error('This OTP code has already been used. Please request a new code.');
      error.code = 'OTP_ALREADY_USED';
      error.statusCode = 400;
      throw error;
    }

    // Check maximum attempts exceeded
    if (record.attempts >= env.OTP_MAX_ATTEMPTS) {
      const error: any = new Error('Maximum OTP verification attempts exceeded. Please request a new OTP.');
      error.code = 'OTP_MAX_ATTEMPTS_EXCEEDED';
      error.statusCode = 429;
      throw error;
    }

    // Check expired
    if (record.expiresAt.getTime() < Date.now()) {
      const error: any = new Error('OTP has expired. Please request a new OTP code.');
      error.code = 'OTP_EXPIRED';
      error.statusCode = 400;
      throw error;
    }

    // Verify OTP code hash
    const isValid = verifyOtpHash(dto.otpCode, record.mobileNumber, record.otpCode);

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

    // Mark verified
    await prisma.oTPVerification.update({
      where: { id: record.id },
      data: { verifiedAt: new Date() },
    });

    const user = record.user;
    if (!user) {
      throw new Error('User account not found for this verification.');
    }

    if (user.accountStatus !== 'ACTIVE') {
      throw new Error('User account is currently inactive.');
    }

    // Construct authenticated payload
    const payload: AuthenticatedUserPayload = {
      userId: user.id,
      userCode: user.userCode,
      mobileNumber: user.mobileNumber,
      role: user.role,
      organisationId: user.organisationId,
      unitId: user.unitId,
    };

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
    const refreshToken = jwt.sign({ userId: user.id, sessionId }, env.JWT_SECRET, refreshTokenOptions);

    // Create LoginSession
    const sessionExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const loginSession = await prisma.loginSession.create({
      data: {
        userId: user.id,
        tokenHash: hashOtp(`${token.slice(-32)}:${sessionId}`, user.mobileNumber),
        ipAddress: reqInfo?.ip,
        deviceInfo: reqInfo?.userAgent,
        expiresAt: sessionExpiresAt,
      },
    });

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
        hierarchyAssignment: primaryAssignment ? {
          id: primaryAssignment.id,
          roleType: primaryAssignment.roleType,
          state: primaryAssignment.state,
          zone: primaryAssignment.zone,
          parliament: primaryAssignment.parliament,
          constituency: primaryAssignment.constituency,
          mandal: primaryAssignment.mandal,
          village: primaryAssignment.village,
          booth: primaryAssignment.booth,
          voterGroup: primaryAssignment.voterGroup,
        } : null,
      },
    };
  }

  static async refreshSession(refreshTokenString: string, reqInfo?: { ip?: string; userAgent?: string }) {
    try {
      const decoded = jwt.verify(refreshTokenString, env.JWT_SECRET) as { userId: string };
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

      const tokenOptions: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'] };
      const token = jwt.sign(payload, env.JWT_SECRET, tokenOptions);

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

  static async logout(userId: string, tokenString?: string, reqInfo?: { ip?: string; userAgent?: string }) {
    if (tokenString) {
      const hash = hashOtp(tokenString.slice(-32), 'logout');
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
      hierarchyAssignment: primaryAssignment ? {
        id: primaryAssignment.id,
        roleType: primaryAssignment.roleType,
        state: primaryAssignment.state,
        zone: primaryAssignment.zone,
        parliament: primaryAssignment.parliament,
        constituency: primaryAssignment.constituency,
        mandal: primaryAssignment.mandal,
        village: primaryAssignment.village,
        booth: primaryAssignment.booth,
        voterGroup: primaryAssignment.voterGroup,
      } : null,
      hierarchyAssignments: user.hierarchyAssignments,
    };
  }
}
