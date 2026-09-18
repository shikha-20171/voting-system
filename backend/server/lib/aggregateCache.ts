import { OrganizationUnit, Voter, Prisma } from '@prisma/client';
import { createDashboardSnapshot } from './dashboard.js';
import { prisma } from './prisma.js';

const CACHE_TTL_MS = Number(process.env.AGGREGATE_CACHE_TTL_MS || 30_000);

export async function getCachedDashboardSnapshot(
  unit: OrganizationUnit,
  units: OrganizationUnit[],
  voters: Voter[],
) {
  const now = new Date();
  const cached = await prisma.aggregateCache.findUnique({ where: { unitId: unit.id } });

  if (cached && cached.expiresAt.getTime() > now.getTime()) {
    return cached.snapshot as unknown as ReturnType<typeof createDashboardSnapshot>;
  }

  const snapshot = createDashboardSnapshot(unit, units, voters);
  const expiresAt = new Date(now.getTime() + CACHE_TTL_MS);

  await prisma.aggregateCache.upsert({
    where: { unitId: unit.id },
    update: {
      snapshot: snapshot as unknown as Prisma.InputJsonValue,
      computedAt: now,
      expiresAt,
    },
    create: {
      unitId: unit.id,
      snapshot: snapshot as unknown as Prisma.InputJsonValue,
      computedAt: now,
      expiresAt,
    },
  });

  return snapshot;
}

export async function invalidateAggregateCache(unitId: string) {
  const units = await prisma.organizationUnit.findMany({
    select: { id: true, parentId: true },
  });

  const byId = new Map(units.map((unit) => [unit.id, unit]));
  const ancestorIds = new Set<string>([unitId]);
  let current = byId.get(unitId);

  while (current?.parentId) {
    ancestorIds.add(current.parentId);
    current = byId.get(current.parentId);
  }

  await prisma.aggregateCache.deleteMany({
    where: { unitId: { in: Array.from(ancestorIds) } },
  });
}
