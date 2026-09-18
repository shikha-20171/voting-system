import { FastifyReply, FastifyRequest } from 'fastify';
import { successResponse } from '../../common/response.js';
import { CadreService } from './cadre.service.js';

export class CadreController {
  static async listCadre(req: FastifyRequest, reply: FastifyReply) {
    const items = await CadreService.listCadres(req.hierarchyScope?.accessibleUnitIds);
    return reply.send(successResponse(items));
  }

  static async createCadre(req: FastifyRequest<{ Body: any }>, reply: FastifyReply) {
    const item = await CadreService.createCadre(req.body, req.user!.userId);
    return reply.status(201).send(successResponse(item, 'Cadre created'));
  }

  static async updateCadre(req: FastifyRequest<{ Params: { id: string }; Body: any }>, reply: FastifyReply) {
    const item = await CadreService.updateCadre(req.params.id, req.body, req.user!.userId);
    return reply.send(successResponse(item, 'Cadre updated'));
  }

  static async getCadreNetwork(req: FastifyRequest, reply: FastifyReply) {
    const network = await CadreService.getCadreNetwork(req.hierarchyScope?.accessibleUnitIds);
    return reply.send(successResponse(network));
  }

  static async getCadrePerformance(req: FastifyRequest, reply: FastifyReply) {
    const perf = await CadreService.getCadrePerformance(req.hierarchyScope?.accessibleUnitIds);
    return reply.send(successResponse(perf));
  }
}
