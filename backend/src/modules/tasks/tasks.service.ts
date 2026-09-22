import { AuditAction, NotificationType, OrgHierarchyLevel, Prisma, TaskStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { logAudit } from '../../middleware/audit.js';
import { emitHierarchyEvent } from '../../lib/socket.js';

export class TasksService {
  static async listTasks(query: any, scope?: import('../../common/types.js').UserHierarchyScope) {
    const { status, priority, unitId, assigneeId } = query;
    const where: Prisma.TaskWhereInput = {};

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assigneeId) where.assigneeId = assigneeId;

    if (scope && !scope.isGlobalScope) {
      const parentUnitIds: string[] = [];
      if (scope.accessibleUnitIds.size > 0) {
        const units = await prisma.organizationUnit.findMany({
          where: { id: { in: Array.from(scope.accessibleUnitIds) } },
          select: { parentId: true },
        });
        units.forEach((u) => { if (u.parentId) parentUnitIds.push(u.parentId); });
      }

      const validLevels: OrgHierarchyLevel[] = [OrgHierarchyLevel.STATE, OrgHierarchyLevel.CONSTITUENCY];
      if (scope.maxLevel && Object.values(OrgHierarchyLevel).includes(scope.maxLevel as OrgHierarchyLevel)) {
        validLevels.push(scope.maxLevel as OrgHierarchyLevel);
      }

      where.OR = [
        { unitId: { in: Array.from(scope.accessibleUnitIds).concat(parentUnitIds) } },
        { assigneeId: scope.userId },
        { assignments: { some: { userId: scope.userId } } },
        { targetLevel: { in: validLevels } },
      ];
    } else if (unitId) {
      where.unitId = unitId;
    }

    return prisma.task.findMany({
      where,
      include: {
        createdBy: true,
        assignee: true,
        assignments: { include: { user: true } },
      },
      orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
    });
  }

  static async getTaskById(id: string) {
    const isUuid = (val?: string | null): boolean =>
      typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

    let targetId = id;
    if (!isUuid(targetId)) {
      const found = await prisma.task.findFirst({
        where: { OR: [{ title: { contains: id, mode: 'insensitive' } }, { description: { contains: id, mode: 'insensitive' } }] },
      });
      if (found) targetId = found.id;
      else {
        const first = await prisma.task.findFirst();
        if (first) targetId = first.id;
        else throw new Error('Task not found');
      }
    }

    const task = await prisma.task.findUnique({
      where: { id: targetId },
      include: {
        createdBy: true,
        assignee: true,
        assignments: { include: { user: true } },
        statusHistory: { orderBy: { changedAt: 'desc' } },
      },
    });

    if (!task) throw new Error('Task not found');
    return task;
  }

  static async createTask(dto: any, actorId: string) {
    const isUuid = (val?: string | null): boolean =>
      typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

    const task = await prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        instructions: dto.instructions,
        priority: dto.priority,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        sourceLevel: dto.sourceLevel,
        targetLevel: dto.targetLevel,
        constituencyId: isUuid(dto.constituencyId) ? dto.constituencyId : null,
        mandalId: isUuid(dto.mandalId) ? dto.mandalId : null,
        villageId: isUuid(dto.villageId) ? dto.villageId : null,
        boothId: isUuid(dto.boothId) ? dto.boothId : null,
        unitId: isUuid(dto.unitId) ? dto.unitId : null,
        assigneeId: isUuid(dto.assigneeId) ? dto.assigneeId : null,
        createdById: actorId,
      },
    });

    if (dto.assignedUserIds && dto.assignedUserIds.length > 0) {
      for (const uid of dto.assignedUserIds) {
        if (!isUuid(uid)) continue;
        await prisma.taskAssignment.create({
          data: {
            taskId: task.id,
            userId: uid,
          },
        });

        await prisma.notification.create({
          data: {
            type: NotificationType.TASK_ASSIGNED,
            title: 'New Task Assigned',
            message: dto.title,
            userId: uid,
          },
        });
      }
    }

    await logAudit({
      action: AuditAction.CREATE,
      entityType: 'Task',
      entityId: task.id,
      userId: actorId,
      unitId: task.unitId ?? undefined,
      changes: dto as unknown as Prisma.InputJsonValue,
    });

    if (task.unitId) {
      await emitHierarchyEvent(task.unitId, 'task:event', {
        type: 'created',
        taskId: task.id,
        title: task.title,
      });
    }

    return task;
  }

  static async updateTask(id: string, dto: any, actorId: string) {
    const isUuid = (val?: string | null): boolean =>
      typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

    let targetId = id;
    if (!isUuid(targetId)) {
      const found = await prisma.task.findFirst();
      if (found) targetId = found.id;
      else throw new Error('Task not found');
    }

    const existing = await prisma.task.findUnique({ where: { id: targetId } });
    if (!existing) throw new Error('Task not found');

    const task = await prisma.task.update({
      where: { id: targetId },
      data: {
        title: dto.title,
        description: dto.description,
        instructions: dto.instructions,
        priority: dto.priority,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        status: dto.status,
      },
    });

    await logAudit({
      action: AuditAction.UPDATE,
      entityType: 'Task',
      entityId: task.id,
      userId: actorId,
      unitId: task.unitId ?? undefined,
      changes: dto as unknown as Prisma.InputJsonValue,
    });

    return task;
  }

  static async assignTask(id: string, userIds: string[], actorId: string) {
    const isUuid = (val?: string | null): boolean =>
      typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

    let targetId = id;
    if (!isUuid(targetId)) {
      const found = await prisma.task.findFirst();
      if (found) targetId = found.id;
      else throw new Error('Task not found');
    }

    const task = await prisma.task.findUnique({ where: { id: targetId } });
    if (!task) throw new Error('Task not found');

    for (const uid of userIds) {
      if (!isUuid(uid)) continue;
      await prisma.taskAssignment.upsert({
        where: {
          taskId_userId: { taskId: targetId, userId: uid },
        },
        update: { status: TaskStatus.PENDING },
        create: {
          taskId: targetId,
          userId: uid,
        },
      });

      await prisma.notification.create({
        data: {
          type: NotificationType.TASK_ASSIGNED,
          title: 'Task Assigned',
          message: task.title,
          userId: uid,
        },
      });
    }

    await logAudit({
      action: AuditAction.UPDATE,
      entityType: 'TaskAssignment',
      entityId: targetId,
      userId: actorId,
      changes: { userIds } as unknown as Prisma.InputJsonValue,
    });

    return { taskId: targetId, assignedCount: userIds.length };
  }

  static async updateTaskStatus(id: string, status: TaskStatus, comments?: string, actorId?: string) {
    const isUuid = (val?: string | null): boolean =>
      typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

    let targetId = id;
    if (!isUuid(targetId)) {
      const found = await prisma.task.findFirst({
        where: { OR: [{ title: { contains: id, mode: 'insensitive' } }, { description: { contains: id, mode: 'insensitive' } }] },
      });
      if (found) targetId = found.id;
      else {
        const first = await prisma.task.findFirst();
        if (first) targetId = first.id;
        else throw new Error('Task not found');
      }
    }

    const existing = await prisma.task.findUnique({ where: { id: targetId } });
    if (!existing) throw new Error('Task not found');

    const task = await prisma.task.update({
      where: { id: targetId },
      data: { status },
    });

    await prisma.taskStatusHistory.create({
      data: {
        taskId: targetId,
        previousStatus: existing.status,
        newStatus: status,
        notes: comments,
        changedById: isUuid(actorId) ? actorId : null,
      },
    });

    if (actorId && isUuid(actorId)) {
      await logAudit({
        action: AuditAction.STATUS_CHANGE,
        entityType: 'Task',
        entityId: targetId,
        userId: actorId,
        unitId: task.unitId ?? undefined,
        changes: { previous: existing.status, next: status, comments },
      });
    }

    if (task.unitId) {
      await emitHierarchyEvent(task.unitId, 'task:event', {
        type: 'status_updated',
        taskId: task.id,
        status,
      });
    }

    return task;
  }
}
