import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { AuditAction, Prisma, RoleType } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { successResponse } from '../../common/response.js';
import { validateBody } from '../../common/validation.js';
import { authenticate } from '../../middleware/auth.js';
import { requireRoles } from '../../middleware/rbac.js';
import { logAudit } from '../../middleware/audit.js';

const createOrgSchema = z.object({
  code: z.string().min(2),
  name: z.string().min(2),
  description: z.string().optional(),
  website: z.string().url().optional(),
});

export async function organisationsRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  fastify.get('/', async (_req: FastifyRequest, reply: FastifyReply) => {
    const orgs = await prisma.organisation.findMany({
      include: { parties: true, states: true },
      orderBy: { name: 'asc' },
    });
    return reply.send(successResponse(orgs));
  });

  fastify.post(
    '/',
    {
      preHandler: [requireRoles(RoleType.SUPER_ADMIN, RoleType.HIGH_COMMAND)],
      preValidation: [validateBody(createOrgSchema)],
    },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = req.body as z.infer<typeof createOrgSchema>;
      const org = await prisma.organisation.create({
        data: body,
      });

      await logAudit({
        action: AuditAction.CREATE,
        entityType: 'Organisation',
        entityId: org.id,
        req,
        changes: body as unknown as Prisma.InputJsonValue,
      });

      return reply.status(201).send(successResponse(org, 'Organisation created'));
    },
  );
}
