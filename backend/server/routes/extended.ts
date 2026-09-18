import { AuditAction, ImportJobStatus, NotificationType, Prisma } from '@prisma/client';
import { Express, Request, Response } from 'express';
import type { Server as SocketIOServer } from 'socket.io';
import { generateStrategicIntelligence } from '../lib/ai.js';
import { invalidateAggregateCache } from '../lib/aggregateCache.js';
import { writeAuditLog } from '../lib/audit.js';
import { parseVoterCsv, processVoterImportJob, VoterImportRow } from '../lib/bulkImport.js';
import { createNotification } from '../lib/notifications.js';
import { prisma } from '../lib/prisma.js';

type RouteDeps = {
  io: SocketIOServer;
  assertAuthUnitScope: (authUnitId: string, targetUnitId: string) => Promise<void>;
  resolveUserRecord: (userIdentifier: string) => Promise<{ id: string; userCode: string; name: string; unitId?: string | null } | null>;
};

export function registerExtendedRoutes(app: Express, deps: RouteDeps) {
  const { io, assertAuthUnitScope, resolveUserRecord } = deps;

  app.get('/api/cadre-assignments', async (req: Request, res: Response) => {
    const unitId = typeof req.query.unitId === 'string' ? req.query.unitId : undefined;
    const boothId = typeof req.query.boothId === 'string' ? req.query.boothId : undefined;

    const where: Prisma.CadreAssignmentWhereInput = {};
    if (boothId) {
      where.boothId = boothId;
    } else if (unitId) {
      where.unitId = unitId;
    }

    const items = await prisma.cadreAssignment.findMany({
      where,
      include: {
        unit: true,
        assigneeUser: true,
        assignedBy: true,
      },
      orderBy: [{ slotIndex: 'asc' }],
    });

    res.json({ items });
  });

  app.put('/api/cadre-assignments', async (req, res) => {
    if (!req.auth) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const payload = req.body as {
      unitId: string;
      slotIndex: number;
      roleTitle?: string | null;
      assigneeUserId?: string | null;
    };

    if (!payload.unitId || payload.slotIndex === undefined) {
      res.status(400).json({ message: 'unitId and slotIndex are required' });
      return;
    }

    const unit = await prisma.organizationUnit.findUnique({ where: { id: payload.unitId } });
    if (!unit) {
      res.status(404).json({ message: 'Unit not found' });
      return;
    }

    try {
      await assertAuthUnitScope(req.auth.unitId, payload.unitId);
    } catch (error) {
      res.status((error as Error & { statusCode?: number }).statusCode ?? 403).json({ message: (error as Error).message });
      return;
    }

    let assigneeUserId: string | null = null;
    if (payload.assigneeUserId) {
      const user = await resolveUserRecord(payload.assigneeUserId);
      assigneeUserId = user?.id ?? null;
    }

    const existing = await prisma.cadreAssignment.findFirst({
      where: {
        unitId: payload.unitId,
        slotIndex: payload.slotIndex,
      },
    });

    const item = existing
      ? await prisma.cadreAssignment.update({
          where: { id: existing.id },
          data: {
            roleTitle: payload.roleTitle,
            assigneeUserId,
            assignedById: req.auth.sub,
          },
          include: { unit: true, assigneeUser: true },
        })
      : await prisma.cadreAssignment.create({
          data: {
            unitId: payload.unitId,
            slotIndex: payload.slotIndex,
            roleTitle: payload.roleTitle,
            assigneeUserId,
            assignedById: req.auth.sub,
          },
          include: { unit: true, assigneeUser: true },
        });

    await writeAuditLog({
      action: AuditAction.UPDATE,
      entityType: 'CadreAssignment',
      entityId: item.id,
      userId: req.auth.sub,
      unitId: payload.unitId,
      changes: payload as unknown as Prisma.InputJsonValue,
    });

    if (assigneeUserId) {
      await createNotification(io, {
        type: NotificationType.CADRE_ASSIGNED,
        title: 'Cadre assignment updated',
        message: `You were assigned to ${unit.name} slot ${payload.slotIndex + 1}`,
        userId: assigneeUserId,
        unitId: payload.unitId,
        metadata: { unitId: payload.unitId, slotIndex: payload.slotIndex },
      });
    }

    res.json(item);
  });

  app.delete('/api/cadre-assignments/:unitId/:slotIndex', async (req, res) => {
    if (!req.auth) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const slotIndex = Number(req.params.slotIndex);
    if (!Number.isFinite(slotIndex)) {
      res.status(400).json({ message: 'Invalid slot index' });
      return;
    }

    try {
      await assertAuthUnitScope(req.auth.unitId, req.params.unitId);
    } catch (error) {
      res.status((error as Error & { statusCode?: number }).statusCode ?? 403).json({ message: (error as Error).message });
      return;
    }

    await prisma.cadreAssignment.deleteMany({
      where: {
        unitId: req.params.unitId,
        slotIndex,
      },
    });

    res.status(204).send();
  });

  app.get('/api/audit-log', async (req, res) => {
    const unitId = typeof req.query.unitId === 'string' ? req.query.unitId : undefined;
    const limit = typeof req.query.limit === 'string' ? Number(req.query.limit) : 100;

    const where: Prisma.AuditLogWhereInput = {};
    if (unitId) {
      where.unitId = unitId;
    }

    const items = await prisma.auditLog.findMany({
      where,
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      take: Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 500) : 100,
    });

    res.json({ items });
  });

  app.get('/api/notifications', async (req, res) => {
    if (!req.auth) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const unreadOnly = req.query.unreadOnly === 'true';
    const items = await prisma.notification.findMany({
      where: {
        userId: req.auth.sub,
        ...(unreadOnly ? { readAt: null } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    res.json({ items, unreadCount: items.filter((item) => !item.readAt).length });
  });

  app.patch('/api/notifications/:id/read', async (req, res) => {
    if (!req.auth) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const item = await prisma.notification.updateMany({
      where: { id: req.params.id, userId: req.auth.sub },
      data: { readAt: new Date() },
    });

    if (item.count === 0) {
      res.status(404).json({ message: 'Notification not found' });
      return;
    }

    res.json({ success: true });
  });

  app.patch('/api/notifications/read-all', async (req, res) => {
    if (!req.auth) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    await prisma.notification.updateMany({
      where: { userId: req.auth.sub, readAt: null },
      data: { readAt: new Date() },
    });

    res.json({ success: true });
  });

  app.post('/api/voters/bulk-import', async (req, res) => {
    if (!req.auth) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const payload = req.body as {
      unitId: string;
      fileName?: string;
      csvText?: string;
      rows?: VoterImportRow[];
    };

    if (!payload.unitId || (!payload.csvText && !payload.rows?.length)) {
      res.status(400).json({ message: 'unitId and csvText or rows are required' });
      return;
    }

    try {
      await assertAuthUnitScope(req.auth.unitId, payload.unitId);
    } catch (error) {
      res.status((error as Error & { statusCode?: number }).statusCode ?? 403).json({ message: (error as Error).message });
      return;
    }

    const rows = payload.rows?.length ? payload.rows : parseVoterCsv(payload.csvText ?? '');
    if (!rows.length) {
      res.status(400).json({ message: 'No valid voter rows found in import payload' });
      return;
    }

    const job = await prisma.importJob.create({
      data: {
        fileName: payload.fileName || 'bulk-import.csv',
        unitId: payload.unitId,
        createdById: req.auth.sub,
        totalRows: rows.length,
        payload: { rows } as unknown as Prisma.InputJsonValue,
      },
    });

    void processVoterImportJob(job.id).then(async () => {
      await invalidateAggregateCache(payload.unitId);
      await createNotification(io, {
        type: NotificationType.IMPORT_COMPLETE,
        title: 'Voter import completed',
        message: `Import job ${job.fileName} has finished processing`,
        userId: req.auth!.sub,
        unitId: payload.unitId,
        metadata: { jobId: job.id },
      });
      io.to(`unit:${payload.unitId}`).emit('import:complete', { jobId: job.id, unitId: payload.unitId });
    });

    res.status(202).json({ jobId: job.id, status: ImportJobStatus.PENDING, totalRows: rows.length });
  });

  app.get('/api/voters/import-jobs', async (req, res) => {
    const unitId = typeof req.query.unitId === 'string' ? req.query.unitId : undefined;
    const where: Prisma.ImportJobWhereInput = unitId ? { unitId } : {};

    const items = await prisma.importJob.findMany({
      where,
      include: { createdBy: true, unit: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json({ items });
  });

  app.get('/api/voters/import-jobs/:id', async (req, res) => {
    const job = await prisma.importJob.findUnique({
      where: { id: req.params.id },
      include: { createdBy: true, unit: true },
    });

    if (!job) {
      res.status(404).json({ message: 'Import job not found' });
      return;
    }

    res.json(job);
  });

  app.post('/api/ai/strategic-intelligence', async (req, res) => {
    const payload = req.body as { unitId?: string; prompt?: string };
    if (!payload.unitId || !payload.prompt) {
      res.status(400).json({ message: 'unitId and prompt are required' });
      return;
    }

    if (!req.auth) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    try {
      await assertAuthUnitScope(req.auth.unitId, payload.unitId);
      const result = await generateStrategicIntelligence(payload.unitId, payload.prompt);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post('/api/cache/invalidate/:unitId', async (req, res) => {
    if (!req.auth) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    try {
      await assertAuthUnitScope(req.auth.unitId, req.params.unitId);
      await invalidateAggregateCache(req.params.unitId);
      res.json({ success: true });
    } catch (error) {
      res.status((error as Error & { statusCode?: number }).statusCode ?? 403).json({ message: (error as Error).message });
    }
  });
}
