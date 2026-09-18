import { PrismaClient } from '@prisma/client';

declare global {
  var __kdpPrisma__: PrismaClient | undefined;
}

export const prisma =
  globalThis.__kdpPrisma__ ??
  new PrismaClient({
    log: ['warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.__kdpPrisma__ = prisma;
}
