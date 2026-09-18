import { buildApp } from './app.js';
import { env } from './config/env.js';
import { initSocketServer } from './lib/socket.js';
import { prisma } from './lib/prisma.js';

async function start() {
  const app = buildApp();

  try {
    await app.ready();
    const server = app.server;
    initSocketServer(server, env.CORS_ORIGIN);

    await app.listen({
      port: env.PORT,
      host: env.HOST,
    });

    app.log.info(`🚀 Kondapi Fastify Production Backend running on http://${env.HOST}:${env.PORT}`);
  } catch (err) {
    app.log.error(err, 'Failed to start server');
    process.exit(1);
  }

  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
  signals.forEach((signal) => {
    process.on(signal, async () => {
      app.log.info(`Received ${signal}, shutting down gracefully...`);
      await app.close();
      await prisma.$disconnect();
      process.exit(0);
    });
  });
}

void start();
