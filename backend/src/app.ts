import fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import sensible from '@fastify/sensible';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { usersRoutes } from './modules/users/users.routes.js';
import { organisationsRoutes } from './modules/organisations/organisations.routes.js';
import { partiesRoutes } from './modules/parties/parties.routes.js';
import { hierarchyRoutes } from './modules/hierarchy/hierarchy.routes.js';
import { votersRoutes } from './modules/voters/voters.routes.js';
import { cadreRoutes } from './modules/cadre/cadre.routes.js';
import { tasksRoutes } from './modules/tasks/tasks.routes.js';
import { trainingRoutes } from './modules/training/training.routes.js';
import { analyticsRoutes } from './modules/analytics/analytics.routes.js';
import { reportsRoutes } from './modules/reports/reports.routes.js';
import { notificationsRoutes } from './modules/notifications/notifications.routes.js';
import { aiRoutes } from './modules/ai/ai.routes.js';
import { cmsRoutes } from './modules/cms/cms.routes.js';
import { auditRoutes } from './modules/audit/audit.routes.js';
import { pollsRoutes } from './modules/polls/polls.routes.js';
import { applicationsRoutes } from './modules/applications/applications.routes.js';

export function buildApp(): FastifyInstance {
  const app = fastify({
    logger: {
      level: env.NODE_ENV === 'production' ? 'info' : 'debug',
    },
    trustProxy: true,
    bodyLimit: 10 * 1024 * 1024,
  });

  // Centralized Error Handler
  app.setErrorHandler(errorHandler);

  // Plugins
  app.register(sensible);

  app.register(cors, {
    origin: (origin, cb) => {
      // Allow requests with no origin (like mobile apps, curl) or any localhost/local network origin
      cb(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: ['Set-Cookie'],
  });

  app.register(cookie, {
    secret: env.COOKIE_SECRET,
  });

  app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // Support empty JSON bodies gracefully without throwing FST_ERR_CTP_EMPTY_JSON_BODY
  app.addContentTypeParser('application/json', { parseAs: 'string' }, (_req, body, done) => {
    try {
      if (!body || (typeof body === 'string' && body.trim() === '')) {
        done(null, {});
        return;
      }
      const json = JSON.parse(body as string);
      done(null, json);
    } catch (err: any) {
      err.statusCode = 400;
      done(err, undefined);
    }
  });

  // Health Check Endpoints
  const healthHandler = async (_req: any, reply: any) => {
    let dbStatus = 'healthy';
    try {
      await (await import('./lib/prisma.js')).prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = 'unreachable';
    }

    return reply.send({
      status: dbStatus === 'healthy' ? 'UP' : 'DEGRADED',
      database: dbStatus,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
    });
  };

  app.get('/health', healthHandler);
  app.get('/api/health', healthHandler);

  // Domain Module Routes
  app.register(authRoutes, { prefix: '/api/auth' });
  app.register(usersRoutes, { prefix: '/api/users' });
  app.register(organisationsRoutes, { prefix: '/api/organisations' });
  app.register(partiesRoutes, { prefix: '/api/parties' });
  app.register(hierarchyRoutes, { prefix: '/api' });
  app.register(votersRoutes, { prefix: '/api/voters' });
  app.register(cadreRoutes, { prefix: '/api/cadre' });
  app.register(tasksRoutes, { prefix: '/api/tasks' });
  app.register(trainingRoutes, { prefix: '/api/training' });
  app.register(analyticsRoutes, { prefix: '/api/analytics' });
  app.register(reportsRoutes, { prefix: '/api/reports' });
  app.register(notificationsRoutes, { prefix: '/api/notifications' });
  app.register(pollsRoutes, { prefix: '/api/polls' });
  app.register(aiRoutes, { prefix: '/api/ai' });
  app.register(cmsRoutes, { prefix: '/api/cms' });
  app.register(auditRoutes, { prefix: '/api/audit' });
  app.register(applicationsRoutes, { prefix: '/api/applications' });

  return app;
}
