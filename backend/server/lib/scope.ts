import { OrganizationUnit } from '@prisma/client';
import { getDescendantUnitIds } from './dashboard.js';

type UnitRef = Pick<OrganizationUnit, 'id' | 'parentId'>;

export function isUnitWithinScope(scopeUnitId: string, targetUnitId: string, units: UnitRef[]): boolean {
  if (scopeUnitId === targetUnitId) {
    return true;
  }

  const descendantIds = getDescendantUnitIds(scopeUnitId, units);
  return descendantIds.includes(targetUnitId);
}

export function assertUnitWithinScope(scopeUnitId: string, targetUnitId: string, units: UnitRef[]) {
  if (!isUnitWithinScope(scopeUnitId, targetUnitId, units)) {
    const error = new Error('You do not have access to this organizational unit');
    (error as Error & { statusCode?: number }).statusCode = 403;
    throw error;
  }
}
