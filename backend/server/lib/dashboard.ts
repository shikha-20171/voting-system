import {
  OrgHierarchyLevel,
  OrganizationUnit,
  VoteStatus,
  Voter,
  VoterLocationStatus,
  VoterStatus,
} from '@prisma/client';

type UnitLike = Pick<OrganizationUnit, 'id' | 'name' | 'level' | 'parentId' | 'code' | 'totalVoters' | 'metadata' | 'createdAt' | 'updatedAt'>;
type UnitNode = UnitLike & { children?: UnitNode[] };

export interface DashboardSnapshot {
  unit: OrganizationUnit;
  hierarchyCounts: Record<string, number>;
  summary: {
    totalVoters: number;
    voted: number;
    remaining: number;
    fakeVoters: number;
    migrated: number;
    local: number;
  };
  politicalPreference: Record<string, number>;
  casteAnalytics: Record<string, number>;
  performance: {
    winningChildren: number;
    trailingChildren: number;
  };
}

export function buildUnitTree(units: UnitLike[]): UnitNode[] {
  const byId = new Map<string, UnitNode>();

  units.forEach((unit) => {
    byId.set(unit.id, { ...unit, children: [] });
  });

  const roots: UnitNode[] = [];

  byId.forEach((unit) => {
    if (unit.parentId) {
      byId.get(unit.parentId)?.children?.push(unit);
      return;
    }

    roots.push(unit);
  });

  return roots;
}

export function getDescendantUnitIds(unitId: string, units: Pick<OrganizationUnit, 'id' | 'parentId'>[]): string[] {
  const childrenByParent = new Map<string | null, Pick<OrganizationUnit, 'id' | 'parentId'>[]>();

  units.forEach((unit) => {
    const key = unit.parentId ?? null;
    const existing = childrenByParent.get(key) ?? [];
    existing.push(unit);
    childrenByParent.set(key, existing);
  });

  const queue = [unitId];
  const result = new Set<string>(queue);

  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index];
    const children = childrenByParent.get(current) ?? [];

    children.forEach((child) => {
      if (!result.has(child.id)) {
        result.add(child.id);
        queue.push(child.id);
      }
    });
  }

  return Array.from(result);
}

export function createDashboardSnapshot(
  unit: OrganizationUnit,
  units: OrganizationUnit[],
  voters: Voter[],
): DashboardSnapshot {
  const descendantIds = new Set(getDescendantUnitIds(unit.id, units));
  const scopedUnits = units.filter((item) => descendantIds.has(item.id));
  const scopedVoters = voters.filter((voter) => voter.unitId && descendantIds.has(voter.unitId));

  const hierarchyCounts: Record<string, number> = {};
  Object.values(OrgHierarchyLevel).forEach((level) => {
    hierarchyCounts[level] = scopedUnits.filter((item) => item.level === level).length;
  });

  const politicalPreference: Record<string, number> = {
    TDP: 0,
    YSRCP: 0,
    JSP: 0,
    BJP: 0,
    INC: 0,
    NEUTRAL: 0,
    OTH: 0,
  };

  scopedVoters.forEach((voter) => {
    const pref = voter.politicalPreference || 'NEUTRAL';
    politicalPreference[pref] = (politicalPreference[pref] ?? 0) + 1;
  });

  const casteAnalytics = scopedVoters.reduce<Record<string, number>>((acc, voter) => {
    const key = voter.caste || 'Unknown';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const directChildren = units.filter((item) => item.parentId === unit.id);
  let winningChildren = 0;
  let trailingChildren = 0;

  directChildren.forEach((child) => {
    const childDescendants = new Set(getDescendantUnitIds(child.id, units));
    const childVoters = voters.filter((voter) => voter.unitId && childDescendants.has(voter.unitId));
    const tdpVotes = childVoters.filter((voter) => voter.politicalPreference === 'TDP').length;
    const ysrcpVotes = childVoters.filter((voter) => voter.politicalPreference === 'YSRCP').length;

    if (tdpVotes >= ysrcpVotes) {
      winningChildren += 1;
    } else {
      trailingChildren += 1;
    }
  });

  return {
    unit,
    hierarchyCounts,
    summary: {
      totalVoters: scopedVoters.length,
      voted: scopedVoters.filter((voter) => voter.voteStatus === VoteStatus.VOTE_DONE).length,
      remaining: scopedVoters.filter((voter) => voter.voteStatus === VoteStatus.NOT_VOTED).length,
      fakeVoters: scopedVoters.filter((voter) => voter.voterStatus === VoterStatus.FAKE).length,
      migrated: scopedVoters.filter((voter) => voter.voterLocationStatus === VoterLocationStatus.MIGRATED).length,
      local: scopedVoters.filter((voter) => voter.voterLocationStatus === VoterLocationStatus.LOCAL).length,
    },
    politicalPreference,
    casteAnalytics,
    performance: {
      winningChildren,
      trailingChildren,
    },
  };
}

export function createChildDashboardSnapshots(
  unit: OrganizationUnit,
  units: OrganizationUnit[],
  voters: Voter[],
) {
  const directChildren = units.filter((item) => item.parentId === unit.id);

  return directChildren.map((child) => ({
    unit: child,
    snapshot: createDashboardSnapshot(child, units, voters),
  }));
}
