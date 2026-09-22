import { FastifyReply, FastifyRequest } from 'fastify';
import { OrgHierarchyLevel } from '@prisma/client';
import { successResponse } from '../../common/response.js';
import { assertUnitAccess } from '../../middleware/rbac.js';
import { prisma } from '../../lib/prisma.js';
import { AnalyticsService } from './analytics.service.js';

export class AnalyticsController {
  static async getStateAnalytics(req: FastifyRequest, reply: FastifyReply) {
    let stateUnit = await prisma.organizationUnit.findFirst({
      where: { level: OrgHierarchyLevel.STATE },
      orderBy: { createdAt: 'desc' },
    });
    if (!stateUnit) {
      const state = await prisma.state.findFirst();
      if (state) {
        stateUnit = await prisma.organizationUnit.findFirst({ where: { code: { contains: state.code } } });
      }
    }
    const targetUnitId = stateUnit?.id || (await prisma.organizationUnit.findFirst())?.id || 'default-state';
    const data = await AnalyticsService.computeAnalyticsForUnit(targetUnitId);
    return reply.send(successResponse(data));
  }

  static async getLiveVotes(req: FastifyRequest<{ Querystring: { unitId?: string; limit?: string } }>, reply: FastifyReply) {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
    const events = await AnalyticsService.getLiveVotes(req.query.unitId, limit);
    return reply.send(successResponse(events));
  }

  static async getTurnoutSummary(req: FastifyRequest<{ Querystring: { unitId?: string } }>, reply: FastifyReply) {
    const summary = await AnalyticsService.getTurnoutSummary(req.query.unitId);
    return reply.send(successResponse(summary));
  }

  static async getZoneAnalytics(req: FastifyRequest, reply: FastifyReply) {
    const params = req.params as { id: string };
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.id);
    const zone = isUuid
      ? await prisma.zone.findUnique({ where: { id: params.id } })
      : await prisma.zone.findFirst({ where: { OR: [{ code: { contains: params.id, mode: 'insensitive' as const } }, { name: { contains: params.id, mode: 'insensitive' as const } }] } });
    const unit = await prisma.organizationUnit.findFirst({
      where: {
        OR: [
          ...(isUuid ? [{ id: params.id }] : []),
          { code: { contains: params.id, mode: 'insensitive' as const } },
          { name: { contains: params.id, mode: 'insensitive' as const } },
          ...(zone?.code ? [{ code: { contains: zone.code, mode: 'insensitive' as const } }] : []),
          ...(zone?.name ? [{ name: { contains: zone.name, mode: 'insensitive' as const } }] : []),
        ],
      },
    });
    const targetUnitId = unit?.id ?? (req.user?.unitId || params.id);
    if (!assertUnitAccess(req, reply, targetUnitId)) return;

    const data = await AnalyticsService.computeAnalyticsForUnit(targetUnitId);
    return reply.send(successResponse(data));
  }

  static async getParliamentAnalytics(req: FastifyRequest, reply: FastifyReply) {
    const params = req.params as { id: string };
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.id);
    const par = isUuid
      ? await prisma.parliament.findUnique({ where: { id: params.id } })
      : await prisma.parliament.findFirst({ where: { OR: [{ code: { contains: params.id, mode: 'insensitive' as const } }, { name: { contains: params.id, mode: 'insensitive' as const } }] } });
    const unit = await prisma.organizationUnit.findFirst({
      where: {
        OR: [
          ...(isUuid ? [{ id: params.id }] : []),
          { code: { contains: params.id, mode: 'insensitive' as const } },
          { name: { contains: params.id, mode: 'insensitive' as const } },
          ...(par?.code ? [{ code: { contains: par.code, mode: 'insensitive' as const } }] : []),
          ...(par?.name ? [{ name: { contains: par.name, mode: 'insensitive' as const } }] : []),
        ],
      },
    });
    const targetUnitId = unit?.id ?? (req.user?.unitId || params.id);
    if (!assertUnitAccess(req, reply, targetUnitId)) return;

    const data = await AnalyticsService.computeAnalyticsForUnit(targetUnitId);
    return reply.send(successResponse(data));
  }

  static async getConstituencyAnalytics(req: FastifyRequest, reply: FastifyReply) {
    const params = req.params as { id: string };
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.id);
    const ac = isUuid
      ? await prisma.constituency.findUnique({ where: { id: params.id } })
      : await prisma.constituency.findFirst({ where: { OR: [{ code: { contains: params.id, mode: 'insensitive' as const } }, { name: { contains: params.id, mode: 'insensitive' as const } }] } });
    const unit = await prisma.organizationUnit.findFirst({
      where: {
        OR: [
          ...(isUuid ? [{ id: params.id }] : []),
          { code: { contains: params.id, mode: 'insensitive' as const } },
          { name: { contains: params.id, mode: 'insensitive' as const } },
          ...(ac?.code ? [{ code: { contains: ac.code, mode: 'insensitive' as const } }] : []),
          ...(ac?.name ? [{ name: { contains: ac.name, mode: 'insensitive' as const } }] : []),
        ],
      },
    });
    const targetUnitId = unit?.id ?? (req.user?.unitId || params.id);
    if (!assertUnitAccess(req, reply, targetUnitId)) return;

    const data = await AnalyticsService.computeAnalyticsForUnit(targetUnitId);
    return reply.send(successResponse(data));
  }

  static async getMandalAnalytics(req: FastifyRequest, reply: FastifyReply) {
    const params = req.params as { id: string };
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.id);
    const m = isUuid
      ? await prisma.mandal.findUnique({ where: { id: params.id } })
      : await prisma.mandal.findFirst({ where: { OR: [{ code: { contains: params.id, mode: 'insensitive' as const } }, { name: { contains: params.id, mode: 'insensitive' as const } }] } });
    const unit = await prisma.organizationUnit.findFirst({
      where: {
        OR: [
          ...(isUuid ? [{ id: params.id }] : []),
          { code: { contains: params.id, mode: 'insensitive' as const } },
          { name: { contains: params.id, mode: 'insensitive' as const } },
          ...(m?.code ? [{ code: { contains: m.code, mode: 'insensitive' as const } }] : []),
          ...(m?.name ? [{ name: { contains: m.name, mode: 'insensitive' as const } }] : []),
        ],
      },
    });
    const targetUnitId = unit?.id ?? (req.user?.unitId || params.id);
    if (!assertUnitAccess(req, reply, targetUnitId)) return;

    const data = await AnalyticsService.computeAnalyticsForUnit(targetUnitId);
    return reply.send(successResponse(data));
  }

  static async getVillageAnalytics(req: FastifyRequest, reply: FastifyReply) {
    const params = req.params as { id: string };
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.id);
    const v = isUuid
      ? await prisma.village.findUnique({ where: { id: params.id } })
      : await prisma.village.findFirst({ where: { OR: [{ code: { contains: params.id, mode: 'insensitive' as const } }, { name: { contains: params.id, mode: 'insensitive' as const } }] } });
    const unit = await prisma.organizationUnit.findFirst({
      where: {
        OR: [
          ...(isUuid ? [{ id: params.id }] : []),
          { code: { contains: params.id, mode: 'insensitive' as const } },
          { name: { contains: params.id, mode: 'insensitive' as const } },
          ...(v?.code ? [{ code: { contains: v.code, mode: 'insensitive' as const } }] : []),
          ...(v?.name ? [{ name: { contains: v.name, mode: 'insensitive' as const } }] : []),
        ],
      },
    });
    const targetUnitId = unit?.id ?? (req.user?.unitId || params.id);
    if (!assertUnitAccess(req, reply, targetUnitId)) return;

    const data = await AnalyticsService.computeAnalyticsForUnit(targetUnitId);
    return reply.send(successResponse(data));
  }

  static async getBoothAnalytics(req: FastifyRequest, reply: FastifyReply) {
    const params = req.params as { id: string };
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.id);
    const b = isUuid
      ? await prisma.booth.findUnique({ where: { id: params.id } })
      : await prisma.booth.findFirst({ where: { OR: [{ code: { contains: params.id, mode: 'insensitive' as const } }, { name: { contains: params.id, mode: 'insensitive' as const } }] } });
    const unit = await prisma.organizationUnit.findFirst({
      where: {
        OR: [
          ...(isUuid ? [{ id: params.id }] : []),
          { code: { contains: params.id, mode: 'insensitive' as const } },
          { name: { contains: params.id, mode: 'insensitive' as const } },
          ...(b?.code ? [{ code: { contains: b.code, mode: 'insensitive' as const } }] : []),
          ...(b?.name ? [{ name: { contains: b.name, mode: 'insensitive' as const } }] : []),
        ],
      },
    });
    const targetUnitId = unit?.id ?? (req.user?.unitId || params.id);
    if (!assertUnitAccess(req, reply, targetUnitId)) return;

    const data = await AnalyticsService.computeAnalyticsForUnit(targetUnitId);
    return reply.send(successResponse(data));
  }

  static async getVoterInchargeAnalytics(req: FastifyRequest, reply: FastifyReply) {
    const params = req.params as { id: string };
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.id);
    const vg = isUuid
      ? await prisma.voterGroup.findUnique({ where: { id: params.id } })
      : await prisma.voterGroup.findFirst({ where: { OR: [{ code: { contains: params.id, mode: 'insensitive' as const } }, { name: { contains: params.id, mode: 'insensitive' as const } }] } });
    const unit = await prisma.organizationUnit.findFirst({
      where: {
        OR: [
          ...(isUuid ? [{ id: params.id }] : []),
          { code: { contains: params.id, mode: 'insensitive' as const } },
          { name: { contains: params.id, mode: 'insensitive' as const } },
          ...(vg?.code ? [{ code: { contains: vg.code, mode: 'insensitive' as const } }] : []),
          ...(vg?.name ? [{ name: { contains: vg.name, mode: 'insensitive' as const } }] : []),
        ],
      },
    });
    const targetUnitId = unit?.id ?? (req.user?.unitId || params.id);
    if (!assertUnitAccess(req, reply, targetUnitId)) return;

    const data = await AnalyticsService.computeAnalyticsForUnit(targetUnitId);
    return reply.send(successResponse(data));
  }
}

