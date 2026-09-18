import { FastifyInstance } from 'fastify';
import { validateBody } from '../../common/validation.js';
import { optionalAuthenticate } from '../../middleware/auth.js';
import { ApplicationsController } from './applications.controller.js';
import {
  assignInchargeSchema,
  importDataSchema,
  mappingSchema,
  validateDataSchema,
} from './applications.schema.js';

export async function applicationsRoutes(fastify: FastifyInstance) {
  // 1. Applications List & Configuration
  fastify.get('/', { preHandler: [optionalAuthenticate] }, ApplicationsController.getApplications);
  fastify.get('/:applicationId/configuration', { preHandler: [optionalAuthenticate] }, ApplicationsController.getConfiguration);

  // 2. Hierarchy & Structure Endpoints
  fastify.get('/:applicationId/hierarchy', { preHandler: [optionalAuthenticate] }, ApplicationsController.getHierarchy);
  fastify.get('/:applicationId/hierarchy/:level', { preHandler: [optionalAuthenticate] }, ApplicationsController.getHierarchyNodes);
  fastify.get('/:applicationId/constituencies', { preHandler: [optionalAuthenticate] }, ApplicationsController.getConstituencies);
  fastify.get('/:applicationId/constituencies/:id', { preHandler: [optionalAuthenticate] }, ApplicationsController.getConstituencyDetail);

  // 3. Data Ingestion: Mapping, Validation & Import
  fastify.post(
    '/:applicationId/data/mapping',
    {
      preHandler: [optionalAuthenticate],
      preValidation: [validateBody(mappingSchema)],
    },
    ApplicationsController.suggestColumnMapping,
  );

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
      preHandler: [optionalAuthenticate],
      preValidation: [validateBody(importDataSchema)],
    },
    ApplicationsController.importData,
  );

  // 4. Data Import History & Error Reports
  fastify.get(
    '/:applicationId/data/imports',
    { preHandler: [optionalAuthenticate] },
    ApplicationsController.getDataImports,
  );

  fastify.get(
    '/:applicationId/data/imports/:importId',
    { preHandler: [optionalAuthenticate] },
    ApplicationsController.getDataImportById,
  );

  fastify.get(
    '/:applicationId/data/imports/:importId/errors',
    { preHandler: [optionalAuthenticate] },
    ApplicationsController.getDataImportErrors,
  );

  fastify.get(
    '/:applicationId/data/imports/:importId/error-report',
    { preHandler: [optionalAuthenticate] },
    ApplicationsController.downloadErrorReport,
  );

  // Backward-compatible history & error routes
  fastify.get(
    '/:applicationId/data/history',
    { preHandler: [optionalAuthenticate] },
    ApplicationsController.getDataImports,
  );

  fastify.get(
    '/data/errors/:jobId',
    { preHandler: [optionalAuthenticate] },
    ApplicationsController.getDataImportErrors,
  );

  fastify.get(
    '/data/error-report/:jobId',
    { preHandler: [optionalAuthenticate] },
    ApplicationsController.downloadErrorReport,
  );

  // 5. Incharges Endpoints
  fastify.get(
    '/:applicationId/incharges',
    { preHandler: [optionalAuthenticate] },
    ApplicationsController.getIncharges,
  );

  fastify.post(
    '/:applicationId/incharges',
    {
      preHandler: [optionalAuthenticate],
      preValidation: [validateBody(assignInchargeSchema)],
    },
    ApplicationsController.assignIncharge,
  );

  fastify.delete(
    '/:applicationId/incharges/:id',
    { preHandler: [optionalAuthenticate] },
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

  // 6. Voters, Booths & Groups (Field APIs & Scoped access)
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

  // 7. Reports & Summary KPIs
  fastify.get(
    '/:applicationId/reports/summary',
    { preHandler: [optionalAuthenticate, resolveScope] },
    ApplicationsController.getSummary,
  );
}
