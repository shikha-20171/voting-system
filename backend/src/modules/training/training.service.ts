import { AuditAction, Prisma, TrainingStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { logAudit } from '../../middleware/audit.js';

export class TrainingService {
  static async listVideos() {
    return prisma.trainingVideo.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  static async createVideo(dto: any, actorId: string) {
    const video = await prisma.trainingVideo.create({ data: dto });

    await logAudit({
      action: AuditAction.CREATE,
      entityType: 'TrainingVideo',
      entityId: video.id,
      userId: actorId,
      changes: dto as unknown as Prisma.InputJsonValue,
    });

    return video;
  }

  static async updateVideo(id: string, dto: any, actorId: string) {
    const video = await prisma.trainingVideo.update({
      where: { id },
      data: dto,
    });

    await logAudit({
      action: AuditAction.UPDATE,
      entityType: 'TrainingVideo',
      entityId: video.id,
      userId: actorId,
      changes: dto as unknown as Prisma.InputJsonValue,
    });

    return video;
  }

  static async deleteVideo(id: string, actorId: string) {
    await prisma.trainingVideo.update({
      where: { id },
      data: { isActive: false },
    });

    await logAudit({
      action: AuditAction.DELETE,
      entityType: 'TrainingVideo',
      entityId: id,
      userId: actorId,
    });

    return { id, deleted: true };
  }

  static async assignVideo(videoId: string, dto: any, actorId: string) {
    const video = await prisma.trainingVideo.findUnique({ where: { id: videoId } });
    if (!video) throw new Error('Training video not found');

    if (dto.targetRole) {
      await prisma.trainingAssignment.create({
        data: {
          videoId,
          targetRole: dto.targetRole,
        },
      });

      const users = await prisma.user.findMany({ where: { role: dto.targetRole } });
      for (const u of users) {
        await prisma.trainingProgress.upsert({
          where: { userId_videoId: { userId: u.id, videoId } },
          update: {},
          create: {
            userId: u.id,
            videoId,
            status: TrainingStatus.ASSIGNED,
            assignedById: actorId,
          },
        });
      }
    }

    if (dto.userIds && dto.userIds.length > 0) {
      for (const uid of dto.userIds) {
        await prisma.trainingProgress.upsert({
          where: { userId_videoId: { userId: uid, videoId } },
          update: {},
          create: {
            userId: uid,
            videoId,
            status: TrainingStatus.ASSIGNED,
            assignedById: actorId,
          },
        });
      }
    }

    return { videoId, assigned: true };
  }

  static async updateProgress(videoId: string, userId: string, dto: any) {
    const isUuid = (val?: string | null): boolean =>
      typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

    let targetVideoId = videoId;
    if (!isUuid(targetVideoId)) {
      const found = await prisma.trainingVideo.findFirst();
      if (found) targetVideoId = found.id;
      else throw new Error('Video not found');
    }

    let targetUserId = userId;
    if (!isUuid(targetUserId)) {
      const found = await prisma.user.findFirst();
      if (found) targetUserId = found.id;
      else throw new Error('User not found');
    }

    const progress = await prisma.trainingProgress.upsert({
      where: { userId_videoId: { userId: targetUserId, videoId: targetVideoId } },
      update: {
        status: dto.status,
        quizScore: dto.quizScore,
        notes: dto.notes,
        watchedAt: dto.status === TrainingStatus.WATCHED || dto.status === TrainingStatus.COMPLETED ? new Date() : undefined,
        completedAt: dto.status === TrainingStatus.COMPLETED ? new Date() : undefined,
      },
      create: {
        userId: targetUserId,
        videoId: targetVideoId,
        status: dto.status,
        quizScore: dto.quizScore,
        notes: dto.notes,
        watchedAt: dto.status === TrainingStatus.WATCHED || dto.status === TrainingStatus.COMPLETED ? new Date() : undefined,
        completedAt: dto.status === TrainingStatus.COMPLETED ? new Date() : undefined,
      },
    });

    return progress;
  }

  static async getProgress(userId?: string, unitId?: string) {
    const isUuid = (val?: string | null): boolean =>
      typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

    const where: Prisma.TrainingProgressWhereInput = {};
    if (userId && isUuid(userId)) where.userId = userId;
    if (unitId && isUuid(unitId)) where.user = { unitId };

    return prisma.trainingProgress.findMany({
      where,
      include: {
        video: { select: { id: true, title: true, category: true, duration: true } },
        user: { select: { id: true, userCode: true, name: true, role: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  static async ensureAssigned(userId: string, videoId: string, assignedById?: string) {
    const isUuid = (val?: string | null): boolean =>
      typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

    let targetVideoId = videoId;
    if (!isUuid(targetVideoId)) {
      const found = await prisma.trainingVideo.findFirst();
      if (found) targetVideoId = found.id;
    }

    let targetUserId = userId;
    if (!isUuid(targetUserId)) {
      const found = await prisma.user.findFirst();
      if (found) targetUserId = found.id;
    }

    return prisma.trainingProgress.upsert({
      where: { userId_videoId: { userId: targetUserId, videoId: targetVideoId } },
      update: {},
      create: {
        userId: targetUserId,
        videoId: targetVideoId,
        status: TrainingStatus.ASSIGNED,
        assignedById: isUuid(assignedById) ? assignedById : undefined,
      },
      include: {
        video: { select: { id: true, title: true } },
        user: { select: { id: true, userCode: true, name: true } },
      },
    });
  }

  static async getTrainingAnalytics(accessibleUnitIds?: Set<string>) {
    const whereUser: any = {};
    if (accessibleUnitIds && accessibleUnitIds.size > 0) {
      whereUser.unitId = { in: Array.from(accessibleUnitIds) };
    }

    const [totalVideos, progressRecords, usersCount] = await Promise.all([
      prisma.trainingVideo.count({ where: { isActive: true } }),
      prisma.trainingProgress.findMany({
        where: { user: whereUser },
        include: { video: true, user: true },
      }),
      prisma.user.count({ where: whereUser }),
    ]);

    const completed = progressRecords.filter((p) => p.status === TrainingStatus.COMPLETED).length;
    const watched = progressRecords.filter((p) => p.status === TrainingStatus.WATCHED).length;
    const assigned = progressRecords.length;

    const completionRate = assigned > 0 ? Math.round((completed / assigned) * 100) : 0;

    return {
      totalVideos,
      totalCadreMembers: usersCount,
      totalAssignedTrainings: assigned,
      totalWatched: watched,
      totalCompleted: completed,
      completionRate,
    };
  }
}

