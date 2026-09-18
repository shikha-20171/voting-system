import { Server as SocketIOServer } from 'socket.io';
import type { Server as HTTPServer } from 'node:http';
import { prisma } from './prisma.js';

let io: SocketIOServer | null = null;

export function initSocketServer(httpServer: HTTPServer, corsOrigin: string): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: corsOrigin === '*' ? '*' : corsOrigin.split(','),
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId as string | undefined;
    const unitId = socket.handshake.query.unitId as string | undefined;

    if (userId) {
      socket.join(`user:${userId}`);
    }

    if (unitId) {
      socket.join(`unit:${unitId}`);
    }

    socket.on('join:unit', (targetUnitId: string) => {
      if (targetUnitId) {
        socket.join(`unit:${targetUnitId}`);
      }
    });

    socket.on('leave:unit', (targetUnitId: string) => {
      if (targetUnitId) {
        socket.leave(`unit:${targetUnitId}`);
      }
    });

    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });
  });

  return io;
}

export function getSocketIO(): SocketIOServer | null {
  return io;
}

export async function emitHierarchyEvent(unitId: string, event: string, payload: unknown) {
  if (!io) return;

  const units = await prisma.organizationUnit.findMany({
    select: { id: true, parentId: true, level: true, name: true },
  });

  const byId = new Map(units.map((u) => [u.id, u]));
  let current = byId.get(unitId);

  while (current) {
    io.to(`unit:${current.id}`).emit(event, payload);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
}

export async function broadcastTurnoutUpdate(unitId: string, delta: number, voteEventPayload: unknown) {
  if (!io) return;

  // Emit detailed event to the voter's direct unit and all parent rooms
  await emitHierarchyEvent(unitId, 'vote:event', voteEventPayload);
  await emitHierarchyEvent(unitId, 'summary:invalidate', { unitId, delta, timestamp: new Date() });
}
