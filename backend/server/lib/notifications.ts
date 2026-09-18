import { NotificationType, Prisma } from '@prisma/client';
import type { Server as SocketIOServer } from 'socket.io';
import { prisma } from './prisma.js';

export async function createNotification(
  io: SocketIOServer | null,
  input: {
    type: NotificationType;
    title: string;
    message: string;
    userId: string;
    unitId?: string;
    metadata?: Prisma.InputJsonValue;
  },
) {
  const notification = await prisma.notification.create({
    data: {
      type: input.type,
      title: input.title,
      message: input.message,
      userId: input.userId,
      metadata: input.metadata,
    },
  });

  if (io) {
    io.to(`user:${input.userId}`).emit('notification:new', notification);
  }

  return notification;
}

export async function notifyUnitUsers(
  io: SocketIOServer | null,
  unitUserIds: string[],
  input: Omit<Parameters<typeof createNotification>[1], 'userId'>,
) {
  const uniqueIds = [...new Set(unitUserIds.filter(Boolean))];
  return Promise.all(uniqueIds.map((userId) => createNotification(io, { ...input, userId })));
}
