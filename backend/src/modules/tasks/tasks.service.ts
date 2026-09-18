import { AuditAction, NotificationType, Prisma, TaskStatus } from '@prisma/client';
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
      if (scope.role === 'VOTER_100_INCHARGE') {
        where.OR = [
          { assigneeId: scope.userId },
          { assignments: { some: { userId: scope.userId } } },
          { targetLevel: 'VOTER_GROUP' },
          ...(scope.accessibleUnitIds.size > 0 ? [{ unitId: { in: Array.from(scope.accessibleUnitIds) } }] : []),
        ];
      } else if (scope.accessibleUnitIds.size > 0) {
        where.OR = [
          { unitId: { in: Array.from(scope.accessibleUnitIds) } },
          { assigneeId: scope.userId },
          { assignments: { some: { userId: scope.userId } } },
        ];
      }
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
    const task = await prisma.task.findUnique({
      where: { id },
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
    const task = await prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        instructions: dto.instructions,
        priority: dto.priority,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        sourceLevel: dto.sourceLevel,
        targetLevel: dto.targetLevel,
        constituencyId: dto.constituencyId,
        mandalId: dto.mandalId,
        villageId: dto.villageId,
        boothId: dto.boothId,
        unitId: dto.unitId,
        assigneeId: dto.assigneeId,
        createdById: actorId,
      },
    });

    if (dto.assignedUserIds && dto.assignedUserIds.length > 0) {
      for (const uid of dto.assignedUserIds) {
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
    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) throw new Error('Task not found');

    const task = await prisma.task.update({
      where: { id },
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
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) throw new Error('Task not found');

    for (const uid of userIds) {
      await prisma.taskAssignment.upsert({
        where: {
          taskId_userId: { taskId: id, userId: uid },
        },
        update: { status: TaskStatus.PENDING },
        create: {
          taskId: id,
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
      entityId: id,
      userId: actorId,
      changes: { userIds } as unknown as Prisma.InputJsonValue,
    });

    return { taskId: id, assignedCount: userIds.length };
  }

  static async updateTaskStatus(id: string, status: TaskStatus, comments?: string, actorId?: string) {
    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) throw new Error('Task not found');

    const task = await prisma.task.update({
      where: { id },
      data: { status },
    });

    await prisma.taskStatusHistory.create({
      data: {
        taskId: id,
        previousStatus: existing.status,
        newStatus: status,
        notes: comments,
        changedById: actorId,
      },
    });

    if (actorId) {
      await logAudit({
        action: AuditAction.STATUS_CHANGE,
        entityType: 'Task',
        entityId: id,
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
