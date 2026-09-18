import { FastifyReply, FastifyRequest } from 'fastify';
import { successResponse } from '../../common/response.js';
import { ApplicationsService } from './applications.service.js';

export class ApplicationsController {
  static async getHierarchy(req: FastifyRequest, reply: FastifyReply) {
    const { applicationId } = req.params as { applicationId: string };
    const data = await ApplicationsService.getHierarchy(applicationId);
    return reply.send(successResponse(data));
  }

  static async getHierarchyNodes(req: FastifyRequest, reply: FastifyReply) {
    const { applicationId, level } = req.params as { applicationId: string; level: string };
    const query = req.query as { parentId?: string };
    const data = await ApplicationsService.getHierarchyNodesByLevel(applicationId, level, query?.parentId);
    return reply.send(successResponse(data));
  }

  static async validateData(req: FastifyRequest, reply: FastifyReply) {
    const { applicationId } = req.params as { applicationId: string };
    const body = req.body as { level?: string; rows: any[] };
    const result = await ApplicationsService.validateData(applicationId, body.level || 'VOTER', body.rows);
    return reply.send(successResponse(result, 'Data validation report generated successfully'));
  }

  static async importData(req: FastifyRequest, reply: FastifyReply) {
    const { applicationId } = req.params as { applicationId: string };
    const body = req.body as {
      level?: string;
      rows: any[];
      importMode?: 'APPEND' | 'REPLACE';
      voterGroupSize?: number;
      fileName?: string;
    };
    const actorId = req.user?.userId;
    const result = await ApplicationsService.importData(
      applicationId,
      body.level || 'VOTER',
      body.rows,
      {
        importMode: body.importMode,
        voterGroupSize: body.voterGroupSize,
        fileName: body.fileName,
      },
      actorId,
    );
    return reply.status(201).send(successResponse(result, 'Data successfully imported and committed to hierarchy'));
  }

  static async getImportHistory(req: FastifyRequest, reply: FastifyReply) {
    const { applicationId } = req.params as { applicationId: string };
    const data = await ApplicationsService.getImportHistory(applicationId);
    return reply.send(successResponse(data));
  }

  static async getImportJobErrors(req: FastifyRequest, reply: FastifyReply) {
    const { jobId } = req.params as { jobId: string };
    const data = await ApplicationsService.getImportJobErrors(jobId);
    return reply.send(successResponse(data));
  }

  static async getIncharges(req: FastifyRequest, reply: FastifyReply) {
    const { applicationId } = req.params as { applicationId: string };
    const query = req.query as { level?: string; jurisdictionId?: string };
    const data = await ApplicationsService.getIncharges(applicationId, query?.level, query?.jurisdictionId);
    return reply.send(successResponse(data));
  }

  static async assignIncharge(req: FastifyRequest, reply: FastifyReply) {
    const { applicationId } = req.params as { applicationId: string };
    const body = req.body as any;
    const actorId = req.user?.userId;
    const data = await ApplicationsService.assignIncharge(applicationId, body, actorId);
    return reply.status(201).send(successResponse(data, 'Incharge successfully assigned to jurisdiction'));
  }

  static async deleteIncharge(req: FastifyRequest, reply: FastifyReply) {
    const { applicationId, id } = req.params as { applicationId: string; id: string };
    const actorId = req.user?.userId;
    const data = await ApplicationsService.deleteIncharge(applicationId, id, actorId);
    return reply.send(successResponse(data, 'Incharge assignment successfully revoked'));
  }

  static async getVoters(req: FastifyRequest, reply: FastifyReply) {
    const { applicationId } = req.params as { applicationId: string };
    const query = req.query as any;
    const data = await ApplicationsService.getVoters(applicationId, query, req.hierarchyScope);
    return reply.send(successResponse(data));
  }

  static async getBooths(req: FastifyRequest, reply: FastifyReply) {
    const { applicationId } = req.params as { applicationId: string };
    const query = req.query as { villageId?: string };
    const data = await ApplicationsService.getHierarchyNodesByLevel(applicationId, 'BOOTH', query?.villageId);
    return reply.send(successResponse(data));
  }

  static async getVoterGroups(req: FastifyRequest, reply: FastifyReply) {
    const { applicationId } = req.params as { applicationId: string };
    const query = req.query as { boothId?: string };
    const data = await ApplicationsService.getHierarchyNodesByLevel(applicationId, 'VOTER_GROUP', query?.boothId);
    return reply.send(successResponse(data));
  }

  static async getSummary(req: FastifyRequest, reply: FastifyReply) {
    const { applicationId } = req.params as { applicationId: string };
    const data = await ApplicationsService.getSummary(applicationId, req.hierarchyScope);
    return reply.send(successResponse(data));
  }
}
