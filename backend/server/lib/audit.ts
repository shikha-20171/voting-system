import { AuditAction, Prisma } from '@prisma/client';
import { prisma } from './prisma.js';

export async function writeAuditLog(input: {
  action: AuditAction;
  entityType: string;
  entityId: string;
  userId: string;
  unitId?: string;
  changes?: Prisma.InputJsonValue;
  metadata?: Prisma.InputJsonValue;
}) {
  return prisma.auditLog.create({
    data: {
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      userId: input.userId,
      unitId: input.unitId,
      changes: input.changes,
      metadata: input.metadata,
    },
  });
}
