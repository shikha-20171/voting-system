import { FastifyInstance } from 'fastify';
import { RoleType } from '@prisma/client';
import { validateBody } from '../../common/validation.js';
import { authenticate, optionalAuthenticate } from '../../middleware/auth.js';
import { populateHierarchyScope, requireRoles } from '../../middleware/rbac.js';
import { ApplicationsController } from './applications.controller.js';
import {
  assignInchargeSchema,
  importDataSchema,
  validateDataSchema,
} from './applications.schema.js';

export async function applicationsRoutes(fastify: FastifyInstance) {
  // 1. Hierarchy & Structure Endpoints
  fastify.get('/:applicationId/hierarchy', { preHandler: [optionalAuthenticate] }, ApplicationsController.getHierarchy);
  fastify.get('/:applicationId/hierarchy/:level', { preHandler: [optionalAuthenticate] }, ApplicationsController.getHierarchyNodes);

  // 2. Data Validation & Import Endpoints (Phase 2)
  fastify.post(
    '/:applicationId/data/validate',
    {
      preHandler: [optionalAuthenticate],
      preValidation: [validateBody(validateDataSchema)],
    },
    ApplicationsController.validateData,
  );

  fastify.post(
    '/:applicationId/data/import',
    {
      preHandler: [
        optionalAuthenticate,
      ],
      preValidation: [validateBody(importDataSchema)],
    },
    ApplicationsController.importData,
  );

  fastify.get(
    '/:applicationId/data/history',
    { preHandler: [optionalAuthenticate] },
    ApplicationsController.getImportHistory,
  );

  fastify.get(
    '/data/errors/:jobId',
    { preHandler: [optionalAuthenticate] },
    ApplicationsController.getImportJobErrors,
  );

  // 3. Assign Incharges Endpoints (Phase 3)
  fastify.get(
    '/:applicationId/incharges',
    { preHandler: [optionalAuthenticate] },
    ApplicationsController.getIncharges,
  );

  fastify.post(
    '/:applicationId/incharges',
    {
      preHandler: [
        optionalAuthenticate,
      ],
      preValidation: [validateBody(assignInchargeSchema)],
    },
    ApplicationsController.assignIncharge,
  );

  fastify.delete(
    '/:applicationId/incharges/:id',
    {
      preHandler: [
        optionalAuthenticate,
      ],
    },
    ApplicationsController.deleteIncharge,
  );

  const resolveScope = async (req: any, _reply: any) => {
    if (req.user?.userId) {
      try {
        const { computeUserHierarchyScope } = await import('../../middleware/rbac.js');
        req.hierarchyScope = await computeUserHierarchyScope(req.user.userId);
      } catch {
        // ignore
      }
    }
  };

  // 4. Voters, Booths & Groups (Field APIs & Scoped access)
  fastify.get(
    '/:applicationId/voters',
    { preHandler: [optionalAuthenticate, resolveScope] },
    ApplicationsController.getVoters,
  );

  fastify.get(
    '/:applicationId/booths',
    { preHandler: [optionalAuthenticate, resolveScope] },
    ApplicationsController.getBooths,
  );

  fastify.get(
    '/:applicationId/100-voter-groups',
    { preHandler: [optionalAuthenticate, resolveScope] },
    ApplicationsController.getVoterGroups,
  );

  // 5. Reports & Summary KPIs
  fastify.get(
    '/:applicationId/reports/summary',
    { preHandler: [optionalAuthenticate, resolveScope] },
    ApplicationsController.getSummary,
  );
}
