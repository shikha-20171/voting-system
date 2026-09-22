import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { AuditAction, GroundReportStatus, GroundReportType, Prisma, TaskPriority } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { successResponse } from '../../common/response.js';
import { validateBody } from '../../common/validation.js';
import { authenticate } from '../../middleware/auth.js';
import { populateHierarchyScope } from '../../middleware/rbac.js';
import { logAudit } from '../../middleware/audit.js';
import { emitHierarchyEvent } from '../../lib/socket.js';

const groundReportSchema = z.object({
  reportType: z.nativeEnum(GroundReportType).default(GroundReportType.GENERAL_UPDATE),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  description: z.string().min(3),
  issueCategory: z.string().optional(),
  affectedVotersCount: z.number().optional(),
  constituencyId: z.string().optional(),
  mandalId: z.string().optional(),
  villageId: z.string().optional(),
  boothId: z.string().optional(),
  unitId: z.string().optional(),
});

const pollingReportSchema = z.object({
  mandalName: z.string().optional().default('Kondapi Mandal'),
  boothLabel: z.string().optional().default('General Polling Booth'),
  reporterName: z.string().optional(),
  hourlyTurnoutPct: z.number().optional(),
  tdpVotes: z.number().default(0),
  ysrcpVotes: z.number().default(0),
  jspVotes: z.number().default(0),
  bjpVotes: z.number().default(0),
  incVotes: z.number().default(0),
  othersVotes: z.number().default(0),
  boothId: z.string().optional(),
  unitId: z.string().optional(),
  constituencyId: z.string().optional(),
  notes: z.string().optional(),
});

export async function reportsRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);
  fastify.addHook('preHandler', populateHierarchyScope);

  // List ground reports
  fastify.get('/ground', async (req: FastifyRequest<{ Querystring: { unitId?: string; status?: GroundReportStatus } }>, reply: FastifyReply) => {
    const where: Prisma.GroundReportWhereInput = {};
    if (req.query.status) where.status = req.query.status;
    if (req.query.unitId) {
      where.unitId = req.query.unitId;
    } else if (req.hierarchyScope && !req.hierarchyScope.isGlobalScope && req.hierarchyScope.accessibleUnitIds.size > 0) {
      where.OR = [
        { unitId: { in: Array.from(req.hierarchyScope.accessibleUnitIds) } },
        ...(req.hierarchyScope.accessibleConstituencyIds.size > 0
          ? [{ constituencyId: { in: Array.from(req.hierarchyScope.accessibleConstituencyIds) } }]
          : []),
        { createdById: req.user!.userId },
      ];
    }

    const items = await prisma.groundReport.findMany({
      where,
      include: { createdBy: true, unit: true },
      orderBy: { createdAt: 'desc' },
    });
    return reply.send(successResponse(items));
  });

  // Create ground report
  fastify.post('/ground', { preValidation: [validateBody(groundReportSchema)] }, async (req: FastifyRequest<{ Body: z.infer<typeof groundReportSchema> }>, reply: FastifyReply) => {
    const isUuid = (val?: string | null): boolean =>
      typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

    const unitId = isUuid(req.body.unitId) ? req.body.unitId : (isUuid(req.user?.unitId) ? req.user?.unitId : null);
    const boothId = isUuid(req.body.boothId) ? req.body.boothId : null;
    const constituencyId = isUuid(req.body.constituencyId) ? req.body.constituencyId : null;
    const mandalId = isUuid(req.body.mandalId) ? req.body.mandalId : null;
    const villageId = isUuid(req.body.villageId) ? req.body.villageId : null;

    const report = await prisma.groundReport.create({
      data: {
        reportType: req.body.reportType,
        priority: req.body.priority,
        description: req.body.description,
        issueCategory: req.body.issueCategory,
        affectedVotersCount: req.body.affectedVotersCount,
        constituencyId,
        mandalId,
        villageId,
        boothId,
        unitId,
        createdById: req.user!.userId,
      },
    });

    await logAudit({
      action: AuditAction.CREATE,
      entityType: 'GroundReport',
      entityId: report.id,
      req,
      unitId: report.unitId ?? undefined,
      changes: req.body as unknown as Prisma.InputJsonValue,
    });

    if (report.unitId) {
      await emitHierarchyEvent(report.unitId, 'report:event', {
        type: 'created',
        reportId: report.id,
        description: report.description,
      });
    }

    return reply.status(201).send(successResponse(report, 'Ground report submitted'));
  });

  // List polling booth reports
  fastify.get('/polling', async (req: FastifyRequest<{ Querystring: { unitId?: string } }>, reply: FastifyReply) => {
    const isUuid = (val?: string | null): boolean =>
      typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

    const where: Prisma.PollingReportWhereInput = {};
    if (req.query.unitId && isUuid(req.query.unitId)) {
      where.unitId = req.query.unitId;
    } else if (req.hierarchyScope && !req.hierarchyScope.isGlobalScope && req.hierarchyScope.accessibleUnitIds.size > 0) {
      where.OR = [
        { unitId: { in: Array.from(req.hierarchyScope.accessibleUnitIds) } },
        { createdById: req.user!.userId },
      ];
    }

    const items = await prisma.pollingReport.findMany({
      where,
      include: { createdBy: true, unit: true },
      orderBy: { createdAt: 'desc' },
    });
    return reply.send(successResponse(items));
  });

  // Submit polling booth report
  fastify.post('/polling', { preValidation: [validateBody(pollingReportSchema)] }, async (req: FastifyRequest<{ Body: z.infer<typeof pollingReportSchema> }>, reply: FastifyReply) => {
    const isUuid = (val?: string | null): boolean =>
      typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

    const { tdpVotes = 0, ysrcpVotes = 0, jspVotes = 0, bjpVotes = 0, incVotes = 0, othersVotes = 0 } = req.body;
    const totalVotes = tdpVotes + ysrcpVotes + jspVotes + bjpVotes + incVotes + othersVotes;
    const boothId = isUuid(req.body.boothId) ? req.body.boothId : null;
    const unitId = isUuid(req.body.unitId) ? req.body.unitId : (isUuid(req.user?.unitId) ? req.user?.unitId : null);

    const report = await prisma.pollingReport.create({
      data: {
        mandalName: req.body.mandalName || 'Kondapi Mandal',
        boothLabel: req.body.boothLabel || 'General Polling Booth',
        reporterName: req.body.reporterName || req.user!.userCode,
        tdpVotes,
        ysrcpVotes,
        jspVotes,
        bjpVotes,
        incVotes,
        othersVotes,
        totalVotes,
        boothId,
        unitId,
        createdById: req.user!.userId,
      },
    });

    await logAudit({
      action: AuditAction.CREATE,
      entityType: 'PollingReport',
      entityId: report.id,
      req,
      unitId: report.unitId ?? undefined,
      changes: req.body as unknown as Prisma.InputJsonValue,
    });

    if (report.unitId) {
      await emitHierarchyEvent(report.unitId, 'polling-report:event', {
        reportId: report.id,
        mandal: report.mandalName,
        booth: report.boothLabel,
        totalVotes,
      });
    }

    return reply.status(201).send(successResponse(report, 'Polling report recorded'));
  });
}
