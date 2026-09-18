import { FastifyReply, FastifyRequest } from 'fastify';
import { paginatedResponse, successResponse } from '../../common/response.js';
import { assertUnitAccess, assertVoterFieldPermitted, assertVoterScope } from '../../middleware/rbac.js';
import { VotersService } from './voters.service.js';

export class VotersController {
  static async listVoters(req: FastifyRequest, reply: FastifyReply) {
    const query = req.query as any;
    if (query?.unitId && !assertUnitAccess(req, reply, query.unitId)) return;

    const result = await VotersService.listVoters(query, req.hierarchyScope);
    return reply.status(200).send(paginatedResponse(result.items, result.total, result.page, result.limit));
  }

  static async getVoter(req: FastifyRequest, reply: FastifyReply) {
    const params = req.params as { id: string };
    if (!(await assertVoterScope(req, reply, params.id))) return;
    const voter = await VotersService.getVoterById(params.id);
    return reply.status(200).send(successResponse(voter));
  }

  static async createVoter(req: FastifyRequest, reply: FastifyReply) {
    const body = req.body as any;
    if (body?.unitId && !assertUnitAccess(req, reply, body.unitId)) return;
    const voter = await VotersService.createVoter(body, req.user!.userId);
    return reply.status(201).send(successResponse(voter, 'Voter record created'));
  }

  static async updateVoter(req: FastifyRequest, reply: FastifyReply) {
    const params = req.params as { id: string };
    const body = req.body as any;
    if (!(await assertVoterScope(req, reply, params.id))) return;
    if (!assertVoterFieldPermitted(req, reply, body)) return;
    if (body?.unitId && !assertUnitAccess(req, reply, body.unitId)) return;

    const voter = await VotersService.updateVoter(params.id, body, req.user!.userId);
    return reply.status(200).send(successResponse(voter, 'Voter updated'));
  }

  static async updateVoterStatus(req: FastifyRequest, reply: FastifyReply) {
    const params = req.params as { id: string };
    const body = req.body as any;
    if (!(await assertVoterScope(req, reply, params.id))) return;

    const voter = await VotersService.updateVoterStatus(params.id, body, req.user!.userId);
    return reply.status(200).send(successResponse(voter, 'Voter status updated'));
  }

  static async flagFakeVoter(req: FastifyRequest, reply: FastifyReply) {
    const params = req.params as { id: string };
    const body = req.body as any;
    if (!(await assertVoterScope(req, reply, params.id))) return;

    const flag = await VotersService.flagFakeVoter(params.id, body, req.user!.userId);
    return reply.status(201).send(successResponse(flag, 'Voter flagged as fake / objection recorded'));
  }

  static async markVoteDone(req: FastifyRequest, reply: FastifyReply) {
    const params = req.params as { id: string };
    if (!(await assertVoterScope(req, reply, params.id))) return;

    const voter = await VotersService.markVoteDone(params.id, req.user!.userId);
    return reply.status(200).send(successResponse(voter, 'Voter marked as Vote Done'));
  }

  static async markNotVoted(req: FastifyRequest, reply: FastifyReply) {
    const params = req.params as { id: string };
    if (!(await assertVoterScope(req, reply, params.id))) return;

    const voter = await VotersService.markNotVoted(params.id, req.user!.userId);
    return reply.status(200).send(successResponse(voter, 'Voter marked as Not Voted'));
  }

  static async updateMigration(req: FastifyRequest, reply: FastifyReply) {
    const params = req.params as { id: string };
    const body = req.body as any;
    if (!(await assertVoterScope(req, reply, params.id))) return;

    const migration = await VotersService.updateMigration(params.id, body, req.user!.userId);
    return reply.status(200).send(successResponse(migration, 'Migration details updated'));
  }

  static async getVoterHistory(req: FastifyRequest, reply: FastifyReply) {
    const params = req.params as { id: string };
    if (!(await assertVoterScope(req, reply, params.id))) return;

    const history = await VotersService.getVoterHistory(params.id);
    return reply.status(200).send(successResponse(history));
  }

  static async deleteVoter(req: FastifyRequest, reply: FastifyReply) {
    const params = req.params as { id: string };
    if (!(await assertVoterScope(req, reply, params.id))) return;

    const result = await VotersService.deleteVoter(params.id, req.user!.userId);
    return reply.status(200).send(successResponse(result, 'Voter deleted'));
  }

  static async bulkImport(req: FastifyRequest, reply: FastifyReply) {
    const body = req.body as { constituencyId: string; rows: any[] };
    if (!body || !Array.isArray(body.rows)) {
      return reply.status(400).send({ error: { message: 'Invalid payload: constituencyId and rows array required.' } });
    }

    const { BulkUploadService } = await import('./bulk-upload.service.js');
    const result = await BulkUploadService.importVotersFromData(body.constituencyId, body.rows, req.user?.userId);
    return reply.status(200).send(successResponse(result, 'Voter roll data successfully imported and assigned to constituency'));
  }
}
