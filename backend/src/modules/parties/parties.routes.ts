import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { AuditAction, Prisma, RoleType } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { successResponse } from '../../common/response.js';
import { validateBody } from '../../common/validation.js';
import { authenticate } from '../../middleware/auth.js';
import { requireRoles } from '../../middleware/rbac.js';
import { logAudit } from '../../middleware/audit.js';

const partySchema = z.object({
  code: z.string().min(2),
  name: z.string().min(2),
  shortName: z.string().min(1),
  symbolName: z.string().optional(),
  primaryColor: z.string().default('#eab308'),
  secondaryColor: z.string().optional(),
  accentColor: z.string().optional(),
  sortOrder: z.number().default(0),
});

export async function partiesRoutes(fastify: FastifyInstance) {
  fastify.get('/', async (_req: FastifyRequest, reply: FastifyReply) => {
    const parties = await prisma.politicalParty.findMany({
      where: { isActive: true },
      include: { brandings: true },
      orderBy: { sortOrder: 'asc' },
    });
    return reply.send(successResponse(parties));
  });

  fastify.post(
    '/',
    {
      preHandler: [authenticate, requireRoles(RoleType.SUPER_ADMIN, RoleType.HIGH_COMMAND)],
      preValidation: [validateBody(partySchema)],
    },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = req.body as z.infer<typeof partySchema>;
      const party = await prisma.politicalParty.create({
        data: body,
      });

      await logAudit({
        action: AuditAction.CREATE,
        entityType: 'PoliticalParty',
        entityId: party.id,
        req,
        changes: body as unknown as Prisma.InputJsonValue,
      });

      return reply.status(201).send(successResponse(party, 'Political party created'));
    },
  );
}
