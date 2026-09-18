import 'dotenv/config';
import cors from 'cors';
import express, { Request, Response } from 'express';
import { createServer } from 'node:http';
import {
  AuditAction,
  Gender,
  NotificationType,
  OrgHierarchyLevel,
  Prisma,
  RelationType,
  RoleType,
  SurveyStatus,
  TaskPriority,
  TaskStatus,
  TrainingStatus,
  VoterLocationStatus,
  VoterStatus,
  VoteStatus,
} from '@prisma/client';
import { Server as SocketIOServer } from 'socket.io';
import { signAccessToken, verifyAccessToken } from './lib/auth.js';
import { getCachedDashboardSnapshot, invalidateAggregateCache } from './lib/aggregateCache.js';
import { writeAuditLog } from './lib/audit.js';
import { buildUnitTree, createChildDashboardSnapshots, createDashboardSnapshot, getDescendantUnitIds } from './lib/dashboard.js';
import { createNotification } from './lib/notifications.js';
import { prisma } from './lib/prisma.js';
import { assertUnitWithinScope, isUnitWithinScope } from './lib/scope.js';
import { sendOtpSms } from './lib/sms.js';
import { authenticate } from './middleware/auth.js';
import { applySecurityHeaders, otpRateLimiter, validateProductionEnv } from './middleware/hardening.js';
import { registerExtendedRoutes } from './routes/extended.js';

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
  },
});
const port = Number(process.env.PORT || 4000);
const devOtpCode = process.env.OTP_STATIC_CODE || '123456';

validateProductionEnv();

app.use(applySecurityHeaders);
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') ?? '*',
}));
app.use(express.json({ limit: '10mb' }));

const PUBLIC_API_PATHS = new Set([
  '/api/health',
  '/api/auth/request-otp',
  '/api/auth/verify-otp',
  '/api/cms/config',
  '/api/cms/parties',
]);

app.use((req, res, next) => {
  if (!req.path.startsWith('/api/') || PUBLIC_API_PATHS.has(req.path)) {
    next();
    return;
  }

  authenticate(req, res, next);
});

async function getAllUnitRefs() {
  return prisma.organizationUnit.findMany({
    select: { id: true, parentId: true },
  });
}

async function assertAuthUnitScope(authUnitId: string, targetUnitId: string) {
  const units = await getAllUnitRefs();
  assertUnitWithinScope(authUnitId, targetUnitId, units);
}

async function resolveUserRecord(userIdentifier: string) {
  const byCode = await prisma.user.findUnique({
    where: { userCode: userIdentifier },
  });

  if (byCode) {
    return byCode;
  }

  return prisma.user.findUnique({
    where: { id: userIdentifier },
  });
}

function toFrontendRole(role: RoleType) {
  if (role === RoleType.HIGH_COMMAND) return 'HIGH_COMMAND';
  if (role === RoleType.STATE_ADMIN) return 'STATE_ADMIN';
  if (role === RoleType.ZONE_INCHARGE) return 'ZONE_INCHARGE';
  if (role === RoleType.PARLIAMENT_INCHARGE) return 'PARLIAMENT_INCHARGE';
  if (role === RoleType.BOOTH_PRESIDENT) return 'BOOTH_PRESIDENT';
  if (role === RoleType.VOTER_100_INCHARGE) return 'VOTER_100_INCHARGE';
  if (role === RoleType.VILLAGE_INCHARGE) return 'VILLAGE_INCHARGE';
  if (role === RoleType.MANDAL_INCHARGE) return 'MANDAL_INCHARGE';
  return 'CONSTITUENCY_INCHARGE';
}

function normalizeRole(input: string): RoleType | null {
  if (input in RoleType) {
    return input as RoleType;
  }

  const byFrontend = {
    HIGH_COMMAND: RoleType.HIGH_COMMAND,
    STATE_ADMIN: RoleType.STATE_ADMIN,
    ZONE_INCHARGE: RoleType.ZONE_INCHARGE,
    PARLIAMENT_INCHARGE: RoleType.PARLIAMENT_INCHARGE,
    CONSTITUENCY_INCHARGE: RoleType.CONSTITUENCY_INCHARGE,
    MANDAL_INCHARGE: RoleType.MANDAL_INCHARGE,
    VILLAGE_INCHARGE: RoleType.VILLAGE_INCHARGE,
    BOOTH_PRESIDENT: RoleType.BOOTH_PRESIDENT,
    VOTER_100_INCHARGE: RoleType.VOTER_100_INCHARGE,
  } as const;

  return byFrontend[input as keyof typeof byFrontend] ?? null;
}

async function computeScopedData(unitId: string) {
  const units = await prisma.organizationUnit.findMany();

  const descendantIds = getDescendantUnitIds(unitId, units);
  const voters = await prisma.voter.findMany({
    where: {
      unitId: { in: descendantIds },
    },
  });

  return {
    units,
    voters,
    descendantIds,
  };
}

async function getUnitAncestors(unitId: string) {
  const units = await prisma.organizationUnit.findMany({
    select: {
      id: true,
      name: true,
      level: true,
      parentId: true,
    },
  });

  const byId = new Map<string, { id: string; name: string; level: OrgHierarchyLevel; parentId: string | null }>(
    units.map((unit) => [unit.id, unit]),
  );
  const result = new Map<OrgHierarchyLevel, string>();
  let current: { id: string; name: string; level: OrgHierarchyLevel; parentId: string | null } | undefined = byId.get(unitId);

  while (current) {
    result.set(current.level, current.name);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }

  return result;
}

async function buildUserSession(userIdentifier: string) {
  const user = await resolveUserRecord(userIdentifier);
  if (!user || !user.unitId) {
    return null;
  }

  const ancestors = await getUnitAncestors(user.unitId);
  const unit = await prisma.organizationUnit.findUnique({
    where: { id: user.unitId },
  });

  return {
    userName: user.name,
    mobileNumber: user.mobileNumber,
    role: toFrontendRole(user.role),
    unitId: user.unitId,
    assignedConstituency: ancestors.get(OrgHierarchyLevel.CONSTITUENCY) ?? unit?.name ?? 'Kondapi Assembly Constituency',
    assignedMandal: ancestors.get(OrgHierarchyLevel.MANDAL),
    assignedVillage: ancestors.get(OrgHierarchyLevel.VILLAGE),
    assignedBooth: ancestors.get(OrgHierarchyLevel.BOOTH),
    assignedVoterGroup: user.role === RoleType.VOTER_100_INCHARGE ? unit?.name ?? 'Team A (Voters 1-100)' : undefined,
    userId: user.userCode,
    accountStatus: user.accountStatus === 'ACTIVE' ? 'Active' : user.accountStatus === 'PENDING' ? 'Pending' : 'Suspended',
  };
}

async function getUnitHierarchyRoomIds(unitId: string) {
  const units = await prisma.organizationUnit.findMany({
    select: {
      id: true,
      parentId: true,
    },
  });

  const byId = new Map(units.map((unit) => [unit.id, unit]));
  const rooms: string[] = [];
  let current = byId.get(unitId);

  while (current) {
    rooms.push(`unit:${current.id}`);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }

  return rooms;
}

async function emitScopeRefresh(unitId: string, userIds: string[] = []) {
  const rooms = await getUnitHierarchyRoomIds(unitId);
  rooms.forEach((room) => {
    io.to(room).emit('summary:invalidate', { unitId });
  });

  userIds.filter(Boolean).forEach((userId) => {
    io.to(`user:${userId}`).emit('summary:invalidate', { unitId, userId });
  });
}

io.use((socket, next) => {
  const rawToken = socket.handshake.auth?.token ?? socket.handshake.query.token;
  const token = typeof rawToken === 'string' ? rawToken : undefined;

  if (!token) {
    next(new Error('Authentication required'));
    return;
  }

  try {
    socket.data.auth = verifyAccessToken(token);
    next();
  } catch {
    next(new Error('Invalid or expired token'));
  }
});

io.on('connection', (socket) => {
  const auth = socket.data.auth as { sub: string; userCode: string; unitId: string } | undefined;
  const userId = typeof socket.handshake.query.userId === 'string' ? socket.handshake.query.userId : auth?.userCode;
  const unitId = typeof socket.handshake.query.unitId === 'string' ? socket.handshake.query.unitId : auth?.unitId;

  if (userId) {
    socket.join(`user:${userId}`);
    void resolveUserRecord(userId).then((user) => {
      if (user) {
        socket.join(`user:${user.id}`);
        socket.join(`user:${user.userCode}`);
      }
    });
  }

  if (unitId) {
    socket.join(`unit:${unitId}`);
    void getUnitHierarchyRoomIds(unitId).then((rooms) => {
      rooms.forEach((room) => socket.join(room));
    });
  }
});

app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, database: 'connected' });
  } catch (error) {
    res.status(503).json({ ok: false, database: 'disconnected', error: (error as Error).message });
  }
});

app.post('/api/auth/request-otp', otpRateLimiter, async (req, res) => {
  const payload = req.body as { mobileNumber?: string; role?: string };

  if (!payload.mobileNumber || !payload.role) {
    res.status(400).json({ message: 'mobileNumber and role are required' });
    return;
  }

  const requestedRole = normalizeRole(payload.role);
  if (!requestedRole) {
    res.status(400).json({ message: 'Invalid role selected' });
    return;
  }

  const user = await prisma.user.findFirst({
    where: {
      mobileNumber: payload.mobileNumber,
      role: requestedRole,
    },
  });

  if (!user) {
    res.status(404).json({ message: 'No user found for this mobile number and role' });
    return;
  }

  const otpCode = process.env.NODE_ENV === 'production'
    ? String(Math.floor(100000 + Math.random() * 900000))
    : devOtpCode;
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  const otp = await prisma.oTPVerification.create({
    data: {
      mobileNumber: payload.mobileNumber,
      role: requestedRole,
      otpCode,
      expiresAt,
      userId: user.id,
    },
  });

  console.log(`[OTP] ${payload.mobileNumber} (${payload.role}) -> ${otpCode}`);

  try {
    await sendOtpSms(payload.mobileNumber, otpCode);
  } catch (error) {
    console.error('[SMS] Failed to send OTP:', error);
  }

  res.json({
    success: true,
    requestId: otp.id,
    expiresAt: expiresAt.toISOString(),
    devOtp: process.env.NODE_ENV === 'production' ? undefined : otpCode,
  });
});

app.post('/api/auth/verify-otp', async (req, res) => {
  const payload = req.body as { requestId?: string; otpCode?: string };

  if (!payload.requestId || !payload.otpCode) {
    res.status(400).json({ message: 'requestId and otpCode are required' });
    return;
  }

  const otp = await prisma.oTPVerification.findUnique({
    where: { id: payload.requestId },
    include: { user: true },
  });

  if (!otp) {
    res.status(404).json({ message: 'OTP request not found' });
    return;
  }

  if (otp.verifiedAt) {
    res.status(400).json({ message: 'OTP already used' });
    return;
  }

  if (otp.expiresAt.getTime() < Date.now()) {
    res.status(400).json({ message: 'OTP expired' });
    return;
  }

  if (otp.otpCode !== payload.otpCode) {
    res.status(400).json({ message: 'Invalid OTP' });
    return;
  }

  await prisma.oTPVerification.update({
    where: { id: otp.id },
    data: { verifiedAt: new Date() },
  });

  if (!otp.user || !otp.user.unitId) {
    res.status(400).json({ message: 'User record is incomplete or not assigned to a unit' });
    return;
  }

  const session = await buildUserSession(otp.user.userCode);
  if (!session) {
    res.status(404).json({ message: 'Unable to build user session' });
    return;
  }

  const token = signAccessToken({
    sub: otp.user.id,
    userCode: otp.user.userCode,
    role: otp.user.role,
    unitId: otp.user.unitId,
  });

  res.json({ session, token });
});

app.get('/api/units', async (req, res) => {
  const units = await prisma.organizationUnit.findMany({
    orderBy: { name: 'asc' },
  });

  res.json({ items: buildUnitTree(units) });
});

app.get('/api/units/:id', async (req, res) => {
  const unit = await prisma.organizationUnit.findUnique({
    where: { id: req.params.id },
    include: {
      parent: true,
      children: true,
    },
  });

  if (!unit) {
    res.status(404).json({ message: 'Unit not found' });
    return;
  }

  res.json(unit);
});

app.get('/api/dashboard/summary', async (req, res) => {
  const unitId = typeof req.query.unitId === 'string' ? req.query.unitId : undefined;
  const userIdentifier = typeof req.query.userId === 'string' ? req.query.userId : undefined;

  let targetUnitId = unitId;
  let userRecord: any = null;

  if (userIdentifier) {
    userRecord = await resolveUserRecord(userIdentifier);
    if (!userRecord) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    targetUnitId = userRecord.unitId ?? undefined;
  }

  if (!targetUnitId) {
    res.status(400).json({ message: 'unitId or userId is required' });
    return;
  }

  const targetUnit = await prisma.organizationUnit.findUnique({
    where: { id: targetUnitId },
  });

  if (!targetUnit) {
    res.status(404).json({ message: 'Unit not found' });
    return;
  }

  const { units, voters } = await computeScopedData(targetUnit.id);
  const snapshot = await getCachedDashboardSnapshot(targetUnit, units, voters);

  res.json({
    user: userRecord ? {
      userCode: userRecord.userCode,
      name: userRecord.name,
      role: userRecord.role,
      unitId: userRecord.unitId,
      unitName: targetUnit.name,
      unitLevel: targetUnit.level,
    } : undefined,
    snapshot,
  });
});

app.get('/api/dashboard/children-analytics', async (req, res) => {
  const unitId = typeof req.query.unitId === 'string' ? req.query.unitId : undefined;
  const userIdentifier = typeof req.query.userId === 'string' ? req.query.userId : undefined;

  let targetUnitId = unitId;

  if (userIdentifier) {
    const user = await resolveUserRecord(userIdentifier);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    targetUnitId = user.unitId ?? undefined;
  }

  if (!targetUnitId) {
    res.status(400).json({ message: 'unitId or userId is required' });
    return;
  }

  const targetUnit = await prisma.organizationUnit.findUnique({
    where: { id: targetUnitId },
  });

  if (!targetUnit) {
    res.status(404).json({ message: 'Unit not found' });
    return;
  }

  const { units, voters } = await computeScopedData(targetUnit.id);
  const directChildren = units.filter((item) => item.parentId === targetUnit.id);

  const items = await Promise.all(
    directChildren.map(async (child) => {
      const snap = await getCachedDashboardSnapshot(child, units, voters);
      return {
        unitId: child.id,
        name: child.name,
        code: child.code,
        level: child.level,
        snapshot: snap,
      };
    }),
  );

  res.json({ items });
});

app.get('/api/voters', async (req, res) => {
  const unitId = typeof req.query.unitId === 'string' ? req.query.unitId : undefined;
  const inchargeId = typeof req.query.inchargeId === 'string' ? req.query.inchargeId : undefined;
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  const preference = typeof req.query.preference === 'string' ? req.query.preference : undefined;
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : undefined;

  const where: Prisma.VoterWhereInput = {};

  if (inchargeId) {
    const user = await resolveUserRecord(inchargeId);
    if (user) {
      where.assignedInchargeId = user.id;
    } else {
      where.assignedInchargeId = inchargeId;
    }
  }

  if (unitId) {
    const units = await prisma.organizationUnit.findMany({ select: { id: true, parentId: true } });
    const scopedUnitIds = getDescendantUnitIds(unitId, units);
    where.unitId = { in: scopedUnitIds };
  }

  if (status && status in VoterStatus) {
    where.voterStatus = status as VoterStatus;
  }

  if (preference) {
    where.politicalPreference = preference;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { epicNumber: { contains: search, mode: 'insensitive' } },
      { houseNumber: { contains: search, mode: 'insensitive' } },
      { mobileNumber: { contains: search, mode: 'insensitive' } },
    ];
  }

  const voters = await prisma.voter.findMany({
    where,
    orderBy: [{ serialNumber: 'asc' }, { name: 'asc' }],
    take: 500,
  });

  res.json({ items: voters });
});

app.put('/api/voters/:id', async (req, res) => {
  if (!req.auth) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  const payload = req.body as {
    politicalPreference?: string;
    voterStatus?: string;
    surveyStatus?: string;
    notes?: string | null;
    fakeReason?: string | null;
    voteStatus?: string;
    voterLocationStatus?: string;
    currentLocation?: string | null;
    updatedById?: string;
  };

  const data: Prisma.VoterUpdateInput = {};

  if (payload.politicalPreference) data.politicalPreference = payload.politicalPreference;
  if (payload.surveyStatus) data.surveyStatus = payload.surveyStatus as any;
  if (payload.notes !== undefined) data.notes = payload.notes;
  if (payload.currentLocation !== undefined) data.currentLocation = payload.currentLocation;
  if (payload.updatedById) {
    const updatedBy = await resolveUserRecord(payload.updatedById);
    if (updatedBy) {
      data.updatedBy = { connect: { id: updatedBy.id } };
    }
  }

  if (payload.voterStatus && payload.voterStatus in VoterStatus) {
    data.voterStatus = payload.voterStatus as VoterStatus;
  }

  if (payload.voteStatus && payload.voteStatus in VoteStatus) {
    data.voteStatus = payload.voteStatus as VoteStatus;
    data.voteDoneTime = payload.voteStatus === VoteStatus.VOTE_DONE ? new Date() : null;
  }

  if (payload.voterLocationStatus && payload.voterLocationStatus in VoterLocationStatus) {
    data.voterLocationStatus = payload.voterLocationStatus as VoterLocationStatus;
  }

  const currentVoter = await prisma.voter.findUnique({
    where: { id: req.params.id },
  });

  if (!currentVoter) {
    res.status(404).json({ message: 'Voter not found' });
    return;
  }

  if (currentVoter.unitId) {
    try {
      await assertAuthUnitScope(req.auth.unitId, currentVoter.unitId);
    } catch (error) {
      res.status((error as Error & { statusCode?: number }).statusCode ?? 403).json({ message: (error as Error).message });
      return;
    }
  }

  if (
    req.auth.role === RoleType.VOTER_100_INCHARGE
    && currentVoter.assignedInchargeId !== req.auth.sub
  ) {
    res.status(403).json({ message: 'You can only update voters assigned to you' });
    return;
  }

  const voter = await prisma.voter.update({
    where: { id: req.params.id },
    data,
  });

  await writeAuditLog({
    action: AuditAction.UPDATE,
    entityType: 'Voter',
    entityId: voter.id,
    userId: req.auth.sub,
    unitId: voter.unitId ?? undefined,
    changes: payload as unknown as Prisma.InputJsonValue,
    metadata: { epicNumber: voter.epicNumber },
  });

  if (currentVoter.voteStatus !== voter.voteStatus && voter.assignedInchargeId) {
    const inchargeId = voter.assignedInchargeId;
    const voteEvent = await prisma.liveVoteEvent.create({
      data: {
        voterId: voter.id,
        unitId: voter.unitId,
        inchargeId,
        previousStatus: currentVoter.voteStatus,
        nextStatus: voter.voteStatus,
      },
    });

    const [unitRecord, inchargeRecord] = await Promise.all([
      voter.unitId ? prisma.organizationUnit.findUnique({ where: { id: voter.unitId } }) : null,
      prisma.user.findUnique({ where: { id: inchargeId } }),
    ]);

    const eventPayload = {
      id: voteEvent.id,
      previousStatus: currentVoter.voteStatus,
      nextStatus: voter.voteStatus,
      changedAt: voteEvent.changedAt,
      voter: {
        id: voter.id,
        name: voter.name,
        epicNumber: voter.epicNumber,
      },
      unit: {
        id: voter.unitId ?? '',
        name: unitRecord?.name ?? voter.unitId ?? '',
        level: unitRecord?.level ?? 'BOOTH',
      },
      incharge: {
        id: inchargeId,
        userCode: inchargeRecord?.userCode ?? payload.updatedById ?? voter.assignedInchargeId,
        name: inchargeRecord?.name ?? payload.updatedById ?? voter.assignedInchargeId,
      },
    };

    if (voter.unitId) {
      const rooms = await getUnitHierarchyRoomIds(voter.unitId);
      rooms.forEach((room) => {
        io.to(room).emit('vote:event', eventPayload);
      });
      await emitScopeRefresh(voter.unitId, [voter.assignedInchargeId, inchargeRecord?.userCode ?? '']);
      await invalidateAggregateCache(voter.unitId);
    }

    io.to(`user:${voter.assignedInchargeId}`).emit('vote:event', eventPayload);
    if (inchargeRecord?.userCode) {
      io.to(`user:${inchargeRecord.userCode}`).emit('vote:event', eventPayload);
    }
  }

  if (voter.unitId) {
    await invalidateAggregateCache(voter.unitId);
  }
  res.json(voter);
});

app.get('/api/tasks', async (req, res) => {
  const { userId, unitId } = req.query;
  const where: Prisma.TaskWhereInput = {};

  if (typeof userId === 'string') {
    const user = await resolveUserRecord(userId);
    where.assigneeId = user?.id ?? '__missing_user__';
  }

  if (typeof unitId === 'string') {
    where.sourceUnitId = unitId;
  }

  const tasks = await prisma.task.findMany({
    where,
    orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
  });

  res.json({ items: tasks });
});

app.get('/api/reports', async (req, res) => {
  const { userId, unitId } = req.query;
  const where: Prisma.GroundReportWhereInput = {};

  if (typeof userId === 'string') {
    const user = await resolveUserRecord(userId);
    where.createdById = user?.id ?? '__missing_user__';
  }

  if (typeof unitId === 'string') {
    where.unitId = unitId;
  }

  const reports = await prisma.groundReport.findMany({
    where,
    include: {
      unit: true,
      createdBy: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ items: reports });
});

app.post('/api/reports', async (req, res) => {
  const payload = req.body as {
    reportType: 'GENERAL_UPDATE' | 'COMPLAINT_ISSUE';
    priority: TaskPriority;
    description: string;
    issueCategory?: string;
    affectedVotersCount?: number;
    unitId: string;
    createdById: string;
  };

  const createdBy = await resolveUserRecord(payload.createdById);

  if (!createdBy) {
    res.status(404).json({ message: 'Report creator not found' });
    return;
  }

  const report = await prisma.groundReport.create({
    data: {
      reportType: payload.reportType,
      priority: payload.priority,
      description: payload.description,
      issueCategory: payload.issueCategory,
      affectedVotersCount: payload.affectedVotersCount,
      unitId: payload.unitId,
      createdById: createdBy.id,
    },
  });

  const rooms = await getUnitHierarchyRoomIds(payload.unitId);
  rooms.forEach((room) => {
    io.to(room).emit('report:event', { type: 'created', reportId: report.id, unitId: payload.unitId });
  });
  io.to(`user:${createdBy.id}`).emit('report:event', { type: 'created', reportId: report.id, unitId: payload.unitId });
  io.to(`user:${createdBy.userCode}`).emit('report:event', { type: 'created', reportId: report.id, unitId: payload.unitId });
  await emitScopeRefresh(payload.unitId, [createdBy.id, createdBy.userCode]);
  await invalidateAggregateCache(payload.unitId);

  res.status(201).json(report);
});

app.get('/api/polling-reports', async (req, res) => {
  const unitId = typeof req.query.unitId === 'string' ? req.query.unitId : undefined;
  if (!unitId) {
    res.status(400).json({ message: 'unitId is required' });
    return;
  }

  const units = await prisma.organizationUnit.findMany({
    select: { id: true, parentId: true },
  });
  const scopedUnitIds = getDescendantUnitIds(unitId, units);

  const items = await prisma.pollingReport.findMany({
    where: { unitId: { in: scopedUnitIds } },
    include: {
      createdBy: true,
      unit: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ items });
});

app.post('/api/polling-reports', async (req, res) => {
  const payload = req.body as {
    unitId: string;
    createdById: string;
    mandalName: string;
    boothLabel: string;
    reporterName?: string;
    tdpVotes: number;
    ysrcpVotes: number;
    jspVotes: number;
    bjpVotes: number;
    incVotes: number;
    othersVotes: number;
  };

  const createdBy = await resolveUserRecord(payload.createdById);
  if (!createdBy) {
    res.status(404).json({ message: 'Polling report creator not found' });
    return;
  }

  const totalVotes = [payload.tdpVotes, payload.ysrcpVotes, payload.jspVotes, payload.bjpVotes, payload.incVotes, payload.othersVotes]
    .map((value) => Math.max(0, Number(value) || 0))
    .reduce((sum, value) => sum + value, 0);

  const report = await prisma.pollingReport.create({
    data: {
      unitId: payload.unitId,
      createdById: createdBy.id,
      mandalName: payload.mandalName,
      boothLabel: payload.boothLabel,
      reporterName: payload.reporterName?.trim() || createdBy.name,
      tdpVotes: Math.max(0, Number(payload.tdpVotes) || 0),
      ysrcpVotes: Math.max(0, Number(payload.ysrcpVotes) || 0),
      jspVotes: Math.max(0, Number(payload.jspVotes) || 0),
      bjpVotes: Math.max(0, Number(payload.bjpVotes) || 0),
      incVotes: Math.max(0, Number(payload.incVotes) || 0),
      othersVotes: Math.max(0, Number(payload.othersVotes) || 0),
      totalVotes,
    },
    include: {
      createdBy: true,
      unit: true,
    },
  });

  const rooms = await getUnitHierarchyRoomIds(payload.unitId);
  rooms.forEach((room) => {
    io.to(room).emit('polling-report:event', { type: 'created', reportId: report.id, unitId: payload.unitId });
  });
  io.to(`user:${createdBy.id}`).emit('polling-report:event', { type: 'created', reportId: report.id, unitId: payload.unitId });
  io.to(`user:${createdBy.userCode}`).emit('polling-report:event', { type: 'created', reportId: report.id, unitId: payload.unitId });
  await emitScopeRefresh(payload.unitId, [createdBy.id, createdBy.userCode]);

  res.status(201).json(report);
});

app.post('/api/tasks', async (req, res) => {
  const payload = req.body as {
    title: string;
    instructions: string;
    assignedBy: string;
    priority?: TaskPriority;
    dueDate?: string;
    sourceUnitId?: string;
    assigneeId?: string;
  };

  const assignee = payload.assigneeId ? await resolveUserRecord(payload.assigneeId) : null;

  const task = await prisma.task.create({
    data: {
      title: payload.title,
      instructions: payload.instructions,
      assignedBy: payload.assignedBy,
      priority: payload.priority ?? TaskPriority.MEDIUM,
      dueDate: payload.dueDate ? new Date(payload.dueDate) : undefined,
      sourceUnitId: payload.sourceUnitId,
      assigneeId: assignee?.id,
    },
  });

  if (task.sourceUnitId) {
    const rooms = await getUnitHierarchyRoomIds(task.sourceUnitId);
    rooms.forEach((room) => {
      io.to(room).emit('task:event', { type: 'created', taskId: task.id, unitId: task.sourceUnitId });
    });
    const assigneeRec = task.assigneeId ? await prisma.user.findUnique({ where: { id: task.assigneeId } }) : null;
    await emitScopeRefresh(task.sourceUnitId, [task.assigneeId ?? '', assigneeRec?.userCode ?? '']);
  }

  res.status(201).json(task);
});

app.patch('/api/tasks/:id/status', async (req, res) => {
  const payload = req.body as { status: TaskStatus };

  if (!payload.status || !(payload.status in TaskStatus)) {
    res.status(400).json({ message: 'Valid status is required' });
    return;
  }

  const task = await prisma.task.update({
    where: { id: req.params.id },
    data: { status: payload.status },
  });

  if (task.sourceUnitId) {
    const rooms = await getUnitHierarchyRoomIds(task.sourceUnitId);
    rooms.forEach((room) => {
      io.to(room).emit('task:event', { type: 'updated', taskId: task.id, unitId: task.sourceUnitId, status: task.status });
    });
    const assigneeRec = task.assigneeId ? await prisma.user.findUnique({ where: { id: task.assigneeId } }) : null;
    await emitScopeRefresh(task.sourceUnitId, [task.assigneeId ?? '', assigneeRec?.userCode ?? '']);
  }

  res.json(task);
});

app.get('/api/training-videos', async (req, res) => {
  const unitId = typeof req.query.unitId === 'string' ? req.query.unitId : undefined;

  const videos = await prisma.trainingVideo.findMany({
    where: unitId ? { OR: [{ unitId }, { unitId: null }] } : undefined,
    orderBy: { createdAt: 'desc' },
  });

  res.json({ items: videos });
});

app.get('/api/users', async (req, res) => {
  const level = typeof req.query.level === 'string' ? req.query.level : undefined;
  const role = typeof req.query.role === 'string' ? req.query.role : undefined;

  const users = await prisma.user.findMany({
    where: {
      role: role ? (role as RoleType) : undefined,
      unit: level ? { is: { level: level as OrgHierarchyLevel } } : undefined,
    },
    include: {
      unit: true,
    },
    orderBy: { name: 'asc' },
  });

  res.json({ items: users });
});

app.get('/api/cms/config', async (_req, res) => {
  const config = await prisma.cMSConfiguration.findUnique({
    where: { configKey: 'default' },
  });

  if (!config) {
    res.status(404).json({ message: 'CMS config not initialized' });
    return;
  }

  res.json(config);
});

app.put('/api/cms/config', async (req, res) => {
  const payload = req.body as {
    organisationName?: string;
    stateName?: string;
    defaultLanguage?: string;
    hierarchyLabels?: Record<string, string>;
    featureToggles?: Record<string, boolean>;
    aiEnabled?: boolean;
  };

  const config = await prisma.cMSConfiguration.upsert({
    where: { configKey: 'default' },
    update: {
      organisationName: payload.organisationName,
      stateName: payload.stateName,
      defaultLanguage: payload.defaultLanguage,
      hierarchyLabels: payload.hierarchyLabels as Prisma.InputJsonValue,
      featureToggles: payload.featureToggles as Prisma.InputJsonValue,
      aiEnabled: payload.aiEnabled,
    },
    create: {
      configKey: 'default',
      organisationName: payload.organisationName || 'Kondapi TDP Connect',
      stateName: payload.stateName || 'Andhra Pradesh',
      defaultLanguage: payload.defaultLanguage || 'te-IN',
      hierarchyLabels: payload.hierarchyLabels || {},
      featureToggles: payload.featureToggles || {},
      aiEnabled: payload.aiEnabled ?? true,
    },
  });

  res.json(config);
});

app.get('/api/cms/parties', async (_req, res) => {
  const parties = await prisma.politicalParty.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });

  res.json({ items: parties });
});

app.get('/api/cadre-network', async (req, res) => {
  const unitId = typeof req.query.unitId === 'string' ? req.query.unitId : undefined;
  if (!unitId) {
    res.status(400).json({ message: 'unitId is required' });
    return;
  }

  const units = await prisma.organizationUnit.findMany({
    select: { id: true, parentId: true },
  });
  const scopedUnitIds = getDescendantUnitIds(unitId, units);

  const users = await prisma.user.findMany({
    where: { unitId: { in: scopedUnitIds } },
    include: {
      unit: true,
      assignedVoters: true,
      assignedTasks: true,
      trainingProgress: true,
    },
    orderBy: [{ role: 'asc' }, { name: 'asc' }],
  });

  const items = users.map((user: any) => {
    const totalAssigned = user.assignedVoters.length;
    const voted = user.assignedVoters.filter((voter: any) => voter.voteStatus === VoteStatus.VOTE_DONE).length;
    const completedTraining = user.trainingProgress.filter((progress: any) => progress.status === TrainingStatus.COMPLETED).length;

    return {
      userId: user.userCode,
      name: user.name,
      role: user.role,
      unitId: user.unitId,
      unitName: user.unit?.name ?? '',
      mobileNumber: user.mobileNumber,
      totalAssignedVoters: totalAssigned,
      voted,
      remaining: totalAssigned - voted,
      openTasks: user.assignedTasks.filter((task: any) => task.status !== TaskStatus.COMPLETED).length,
      completedTraining,
      performanceScore: totalAssigned > 0 ? Math.round((voted / totalAssigned) * 100) : 0,
    };
  });

  res.json({
    unitId,
    totalCadres: items.length,
    items,
  });
});

registerExtendedRoutes(app, {
  io,
  assertAuthUnitScope,
  resolveUserRecord,
});

const server = httpServer.listen(port, () => {
  console.log(`🚀 Kondapi Backend Server running at http://localhost:${port}`);
});

export { app, httpServer, io };
