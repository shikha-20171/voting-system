import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { RoleType } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { paginatedResponse } from '../../common/response.js';
import { authenticate } from '../../middleware/auth.js';
import { requireRoles } from '../../middleware/rbac.js';

export async function auditRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);
  fastify.addHook('preHandler', requireRoles(RoleType.SUPER_ADMIN, RoleType.HIGH_COMMAND, RoleType.STATE_ADMIN, RoleType.CONSTITUENCY_INCHARGE));

  fastify.get('/', async (req: FastifyRequest<{ Querystring: { page?: string; limit?: string; entityType?: string; userId?: string } }>, reply: FastifyReply) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (req.query.entityType) where.entityType = req.query.entityType;
    if (req.query.userId) where.userId = req.query.userId;

    const [total, items] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        include: { user: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return reply.send(paginatedResponse(items, total, page, limit));
  });
}
