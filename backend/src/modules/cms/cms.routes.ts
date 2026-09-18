import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { AuditAction, OrgHierarchyLevel, Prisma, RoleType, TaskPriority, TaskStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { successResponse } from '../../common/response.js';
import { validateBody } from '../../common/validation.js';
import { authenticate } from '../../middleware/auth.js';
import { requireRoles } from '../../middleware/rbac.js';
import { logAudit } from '../../middleware/audit.js';

// Schemas
const organisationSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2),
  description: z.string().optional(),
  logoUrl: z.string().optional(),
  website: z.string().optional(),
  isActive: z.boolean().default(true),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  faviconUrl: z.string().optional(),
});

const partySchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2),
  shortName: z.string().min(1),
  primaryColor: z.string().default('#eab308'),
  secondaryColor: z.string().optional(),
  accentColor: z.string().optional(),
  symbolName: z.string().optional(),
  logoUrl: z.string().optional(),
  flagUrl: z.string().optional(),
  sortOrder: z.number().default(0),
  isActive: z.boolean().default(true),
});

const brandingSchema = z.object({
  appName: z.string().min(2),
  headerTitle: z.string().min(2),
  logoUrl: z.string().optional(),
  faviconUrl: z.string().optional(),
  primaryColor: z.string(),
  secondaryColor: z.string().optional(),
  accentColor: z.string().optional(),
  activePartyCode: z.string().default('TDP'),
  slogan: z.string().optional(),
  loginTitle: z.string().optional(),
  loginSubtitle: z.string().optional(),
  loginBannerUrl: z.string().optional(),
  typography: z.string().default('Inter'),
});

const featureTogglesSchema = z.record(z.string(), z.boolean());

const hierarchyLabelsSchema = z.record(z.string(), z.string());

const dashboardConfigSchema = z.record(z.string(), z.any());

const analyticsConfigSchema = z.object({
  electionYear: z.number().default(2024),
  targetSeats: z.number().default(175),
  majorityMark: z.number().default(88),
  projectionLabels: z.record(z.string(), z.string()).optional(),
  trackedParties: z.array(z.string()).default(['TDP', 'YSRCP', 'JSP', 'BJP', 'INC', 'OTH']),
});

const taskTemplateSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  instructions: z.string().optional(),
  category: z.enum(['CAMPAIGN', 'SURVEY', 'VOTER_VERIFICATION', 'TRAINING', 'HIGH_COMMAND']).default('CAMPAIGN'),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  targetLevel: z.nativeEnum(OrgHierarchyLevel).default(OrgHierarchyLevel.VOTER_GROUP),
});

const announcementSchema = z.object({
  title: z.string().min(3),
  content: z.string().min(3),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.HIGH),
  targetLevel: z.nativeEnum(OrgHierarchyLevel).optional(),
  targetUnitId: z.string().uuid().optional(),
  expiresAt: z.string().datetime().optional(),
});

export async function cmsRoutes(fastify: FastifyInstance) {
  // --------------------------------------------------------------------------
  // PUBLIC / APP CONFIG ENDPOINT (Consumed dynamically by Frontend)
  // --------------------------------------------------------------------------
  fastify.get('/config', async (_req: FastifyRequest, reply: FastifyReply) => {
    let config = await prisma.cMSConfiguration.findUnique({
      where: { configKey: 'default' },
      include: { organisation: true },
    });

    if (!config) {
      config = await prisma.cMSConfiguration.create({
        data: {
          configKey: 'default',
          organisationName: 'Kondapi TDP Connect',
          stateName: 'Andhra Pradesh',
          defaultLanguage: 'te',
          hierarchyLabels: {
            STATE: 'State',
            ZONE: 'Zone',
            PARLIAMENT: 'Parliament',
            CONSTITUENCY: 'Constituency',
            MANDAL: 'Mandal',
            VILLAGE: 'Village',
            BOOTH: 'Booth',
            VOTER_GROUP: '100-Voter Incharge',
          },
          featureToggles: {
            voterManagement: true,
            fakeVoterFlagging: true,
            migrationTracking: true,
            liveVoteTracking: true,
            casteAnalytics: true,
            cadreNetwork: true,
            training: true,
            tasks: true,
            groundReports: true,
            aiStrategicIntelligence: true,
            electionProjection: true,
          },
          aiEnabled: true,
        },
        include: { organisation: true },
      });
    }

    const parties = await prisma.politicalParty.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    const announcements = await prisma.announcement.findMany({
      where: {
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return reply.send(
      successResponse({
        config,
        parties,
        announcements,
      }),
    );
  });

  // --------------------------------------------------------------------------
  // 1. ORGANISATION MANAGEMENT
  // --------------------------------------------------------------------------
  fastify.get('/organisation', async (_req: FastifyRequest, reply: FastifyReply) => {
    const org = await prisma.organisation.findFirst({
      orderBy: { createdAt: 'asc' },
    });
    return reply.send(successResponse(org));
  });

  fastify.put(
    '/organisation',
    {
      preHandler: [authenticate, requireRoles(RoleType.SUPER_ADMIN, RoleType.HIGH_COMMAND, RoleType.STATE_ADMIN)],
      preValidation: [validateBody(organisationSchema)],
    },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = req.body as z.infer<typeof organisationSchema>;
      const existing = await prisma.organisation.findFirst({ orderBy: { createdAt: 'asc' } });

      let org;
      if (existing) {
        org = await prisma.organisation.update({
          where: { id: existing.id },
          data: body,
        });
      } else {
        org = await prisma.organisation.create({
          data: body,
        });
      }

      await logAudit({
        action: AuditAction.UPDATE,
        entityType: 'Organisation',
        entityId: org.id,
        req,
        changes: body as unknown as Prisma.InputJsonValue,
      });

      return reply.send(successResponse(org, 'Organisation settings updated'));
    },
  );

  // --------------------------------------------------------------------------
  // 2. POLITICAL PARTY MANAGEMENT
  // --------------------------------------------------------------------------
  fastify.get('/parties', async (_req: FastifyRequest, reply: FastifyReply) => {
    const parties = await prisma.politicalParty.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    return reply.send(successResponse(parties));
  });

  fastify.post(
    '/parties',
    {
      preHandler: [authenticate, requireRoles(RoleType.SUPER_ADMIN, RoleType.HIGH_COMMAND, RoleType.STATE_ADMIN)],
      preValidation: [validateBody(partySchema)],
    },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = req.body as z.infer<typeof partySchema>;
      const party = await prisma.politicalParty.create({
        data: body,
      });

      await logAudit({
        action: AuditAction.CREATE,
        entityType: 'PoliticalParty',
        entityId: party.id,
        req,
        changes: body as unknown as Prisma.InputJsonValue,
      });

      return reply.status(201).send(successResponse(party, 'Party added successfully'));
    },
  );

  fastify.patch(
    '/parties/:id',
    {
      preHandler: [authenticate, requireRoles(RoleType.SUPER_ADMIN, RoleType.HIGH_COMMAND, RoleType.STATE_ADMIN)],
      preValidation: [validateBody(partySchema.partial())],
    },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const params = req.params as { id: string };
      const body = req.body as Partial<z.infer<typeof partySchema>>;

      const party = await prisma.politicalParty.update({
        where: { id: params.id },
        data: body,
      });

      await logAudit({
        action: AuditAction.UPDATE,
        entityType: 'PoliticalParty',
        entityId: party.id,
        req,
        changes: body as unknown as Prisma.InputJsonValue,
      });

      return reply.send(successResponse(party, 'Party updated successfully'));
    },
  );

  fastify.delete(
    '/parties/:id',
    {
      preHandler: [authenticate, requireRoles(RoleType.SUPER_ADMIN, RoleType.HIGH_COMMAND)],
    },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const params = req.params as { id: string };

      // Soft delete by deactivating
      const party = await prisma.politicalParty.update({
        where: { id: params.id },
        data: { isActive: false },
      });

      await logAudit({
        action: AuditAction.DELETE,
        entityType: 'PoliticalParty',
        entityId: party.id,
        req,
      });

      return reply.send(successResponse(party, 'Party deactivated'));
    },
  );

  // --------------------------------------------------------------------------
  // 3. BRANDING & THEME CONFIGURATION
  // --------------------------------------------------------------------------
  fastify.get('/branding', async (_req: FastifyRequest, reply: FastifyReply) => {
    const config = await prisma.cMSConfiguration.findUnique({
      where: { configKey: 'default' },
    });
    const defaultParty = await prisma.politicalParty.findFirst({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    return reply.send(
      successResponse({
        appName: config?.organisationName || 'Kondapi TDP Connect',
        headerTitle: config?.organisationName || 'Kondapi TDP Connect',
        stateName: config?.stateName || 'Andhra Pradesh',
        primaryColor: defaultParty?.primaryColor || '#eab308',
        secondaryColor: defaultParty?.secondaryColor || '#1e293b',
        accentColor: defaultParty?.accentColor || '#3b82f6',
        activePartyCode: defaultParty?.code || 'TDP',
        logoUrl: defaultParty?.logoUrl || '',
      }),
    );
  });

  fastify.put(
    '/branding',
    {
      preHandler: [authenticate, requireRoles(RoleType.SUPER_ADMIN, RoleType.HIGH_COMMAND, RoleType.STATE_ADMIN)],
      preValidation: [validateBody(brandingSchema)],
    },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = req.body as z.infer<typeof brandingSchema>;

      const config = await prisma.cMSConfiguration.upsert({
        where: { configKey: 'default' },
        update: {
          organisationName: body.appName,
        },
        create: {
          configKey: 'default',
          organisationName: body.appName,
          stateName: 'Andhra Pradesh',
          hierarchyLabels: {},
          featureToggles: {},
        },
      });

      // Also update primary party color if specified
      if (body.activePartyCode) {
        await prisma.politicalParty.updateMany({
          where: { code: body.activePartyCode },
          data: {
            primaryColor: body.primaryColor,
            secondaryColor: body.secondaryColor,
            accentColor: body.accentColor,
            logoUrl: body.logoUrl,
          },
        });
      }

      await logAudit({
        action: AuditAction.UPDATE,
        entityType: 'Branding',
        entityId: config.id,
        req,
        changes: body as unknown as Prisma.InputJsonValue,
      });

      return reply.send(successResponse(body, 'Branding updated successfully'));
    },
  );

  // --------------------------------------------------------------------------
  // 4. HIERARCHY TREE & DEPENDENCY-SAFE DELETION
  // --------------------------------------------------------------------------
  fastify.get('/hierarchy-tree', async (_req: FastifyRequest, reply: FastifyReply) => {
    const states = await prisma.state.findMany({
      include: {
        zones: {
          include: {
            parliaments: {
              include: {
                constituencies: {
                  include: {
                    mandals: {
                      include: {
                        villages: {
                          include: {
                            booths: {
                              include: {
                                voterGroups: true,
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    return reply.send(successResponse(states));
  });

  fastify.delete(
    '/hierarchy-node/:level/:id',
    {
      preHandler: [authenticate, requireRoles(RoleType.SUPER_ADMIN, RoleType.HIGH_COMMAND)],
    },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { level, id } = req.params as { level: string; id: string };

      // Dependency Check Logic
      let dependentCount = 0;
      let dependentType = '';

      switch (level.toUpperCase()) {
        case 'MANDAL': {
          const villageCount = await prisma.village.count({ where: { mandalId: id } });
          const voterCount = await prisma.voter.count({ where: { mandalId: id } });
          if (villageCount > 0 || voterCount > 0) {
            dependentCount = villageCount + voterCount;
            dependentType = `${villageCount} Villages, ${voterCount} Voters`;
          }
          break;
        }
        case 'VILLAGE': {
          const boothCount = await prisma.booth.count({ where: { villageId: id } });
          const voterCount = await prisma.voter.count({ where: { villageId: id } });
          if (boothCount > 0 || voterCount > 0) {
            dependentCount = boothCount + voterCount;
            dependentType = `${boothCount} Booths, ${voterCount} Voters`;
          }
          break;
        }
        case 'BOOTH': {
          const voterCount = await prisma.voter.count({ where: { boothId: id } });
          const groupCount = await prisma.voterGroup.count({ where: { boothId: id } });
          if (voterCount > 0 || groupCount > 0) {
            dependentCount = voterCount + groupCount;
            dependentType = `${groupCount} Incharge Units, ${voterCount} Voters`;
          }
          break;
        }
        case 'VOTER_GROUP': {
          const voterCount = await prisma.voter.count({ where: { voterGroupId: id } });
          if (voterCount > 0) {
            dependentCount = voterCount;
            dependentType = `${voterCount} Voters assigned`;
          }
          break;
        }
      }

      if (dependentCount > 0) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'DEPENDENCY_EXISTS',
            message: `Cannot delete ${level} record: ${dependentType} are currently linked. Reassign or remove children first.`,
          },
        });
      }

      // Safe to delete
      switch (level.toUpperCase()) {
        case 'MANDAL':
          await prisma.mandal.delete({ where: { id } });
          break;
        case 'VILLAGE':
          await prisma.village.delete({ where: { id } });
          break;
        case 'BOOTH':
          await prisma.booth.delete({ where: { id } });
          break;
        case 'VOTER_GROUP':
          await prisma.voterGroup.delete({ where: { id } });
          break;
      }

      await logAudit({
        action: AuditAction.DELETE,
        entityType: `HierarchyNode_${level}`,
        entityId: id,
        req,
      });

      return reply.send(successResponse({ id, deleted: true }, `${level} node deleted safely`));
    },
  );

  // --------------------------------------------------------------------------
  // 5. FEATURE CONFIGURATION
  // --------------------------------------------------------------------------
  fastify.get('/features', async (_req: FastifyRequest, reply: FastifyReply) => {
    const config = await prisma.cMSConfiguration.findUnique({
      where: { configKey: 'default' },
    });
    return reply.send(successResponse(config?.featureToggles || {}));
  });

  fastify.put(
    '/features',
    {
      preHandler: [authenticate, requireRoles(RoleType.SUPER_ADMIN, RoleType.HIGH_COMMAND, RoleType.STATE_ADMIN)],
      preValidation: [validateBody(featureTogglesSchema)],
    },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = req.body as Record<string, boolean>;

      const config = await prisma.cMSConfiguration.upsert({
        where: { configKey: 'default' },
        update: {
          featureToggles: body as Prisma.InputJsonValue,
        },
        create: {
          configKey: 'default',
          organisationName: 'Kondapi TDP Connect',
          stateName: 'Andhra Pradesh',
          hierarchyLabels: {},
          featureToggles: body as Prisma.InputJsonValue,
        },
      });

      await logAudit({
        action: AuditAction.UPDATE,
        entityType: 'FeatureToggles',
        entityId: config.id,
        req,
        changes: body as unknown as Prisma.InputJsonValue,
      });

      return reply.send(successResponse(body, 'Feature toggles updated'));
    },
  );

  // --------------------------------------------------------------------------
  // 6. DASHBOARD CONFIGURATION (Per-role Card & Section Visibility)
  // --------------------------------------------------------------------------
  fastify.get('/dashboard-config', async (_req: FastifyRequest, reply: FastifyReply) => {
    const defaultDashboardConfig = {
      CONSTITUENCY_INCHARGE: {
        showPulseBar: true,
        showMetricsGrid: true,
        showVoterDirectory: true,
        showLiveVotingHub: true,
        showWarRoomProjections: true,
        showCadreOperations: true,
        showGroundIntelligence: true,
        showAIStrategicCenter: true,
      },
      MANDAL_INCHARGE: {
        showPulseBar: true,
        showMetricsGrid: true,
        showVoterDirectory: true,
        showLiveVotingHub: true,
        showVillageBreakdown: true,
        showCadreOperations: true,
        showGroundIntelligence: true,
      },
      VILLAGE_INCHARGE: {
        showPulseBar: true,
        showMetricsGrid: true,
        showVoterDirectory: true,
        showLiveVotingHub: true,
        showBoothList: true,
        showCadreOperations: true,
      },
      BOOTH_PRESIDENT: {
        showPulseBar: true,
        showMetricsGrid: true,
        showVoterDirectory: true,
        showLiveVotingHub: true,
        showInchargeClusters: true,
      },
      VOTER_100_INCHARGE: {
        showPulseBar: true,
        showMetricsGrid: true,
        showVoterChecklist: true,
        showLiveTurnoutLogger: true,
        showSurveyForm: true,
      },
    };

    return reply.send(successResponse(defaultDashboardConfig));
  });

  fastify.put(
    '/dashboard-config',
    {
      preHandler: [authenticate, requireRoles(RoleType.SUPER_ADMIN, RoleType.HIGH_COMMAND, RoleType.STATE_ADMIN)],
      preValidation: [validateBody(dashboardConfigSchema)],
    },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = req.body as Record<string, any>;

      await logAudit({
        action: AuditAction.UPDATE,
        entityType: 'DashboardConfig',
        entityId: 'global',
        req,
        changes: body as unknown as Prisma.InputJsonValue,
      });

      return reply.send(successResponse(body, 'Dashboard configuration updated'));
    },
  );

  // --------------------------------------------------------------------------
  // 7. TRAINING CMS
  // --------------------------------------------------------------------------
  fastify.get('/training', async (_req: FastifyRequest, reply: FastifyReply) => {
    const videos = await prisma.trainingVideo.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      include: {
        assignments: true,
        progress: { include: { user: true } },
      },
    });
    return reply.send(successResponse(videos));
  });

  // --------------------------------------------------------------------------
  // 8. TASK CMS & TEMPLATES
  // --------------------------------------------------------------------------
  fastify.get('/task-templates', async (_req: FastifyRequest, reply: FastifyReply) => {
    const templates = [
      {
        id: 'tpl-1',
        title: 'Complete Door-to-Door Voter Verification',
        category: 'VOTER_VERIFICATION',
        priority: 'HIGH',
        targetLevel: 'VOTER_GROUP',
        description: 'Verify phone number, resident status, and political preference for all assigned 100 voters.',
        instructions: '1. Visit household.\n2. Verify EPIC card.\n3. Mark local/migrated in app.',
      },
      {
        id: 'tpl-2',
        title: 'Deploy Migration Transport Helpline',
        category: 'CAMPAIGN',
        priority: 'HIGH',
        targetLevel: 'MANDAL',
        description: 'Coordinate buses and travel reimbursement for voters residing in Hyderabad/Bengaluru/Chennai.',
        instructions: 'Call each migrated voter 3 days before polling date.',
      },
      {
        id: 'tpl-3',
        title: 'Conduct Polling Agent Mock Drill',
        category: 'TRAINING',
        priority: 'URGENT',
        targetLevel: 'BOOTH',
        description: 'Train booth agents on Form 17C, EVM mock poll verification, and real-time app logging.',
        instructions: 'Assemble booth agents at Panchayat hall at 6:00 PM.',
      },
      {
        id: 'tpl-4',
        title: 'High-Command Turnout Blitz Directives',
        category: 'HIGH_COMMAND',
        priority: 'URGENT',
        targetLevel: 'CONSTITUENCY',
        description: 'Achieve 85%+ voter turnout in neutral-leaning and high-strength polling stations.',
        instructions: 'Monitor live vote pulse every 30 minutes on Election Day.',
      },
    ];
    return reply.send(successResponse(templates));
  });

  // --------------------------------------------------------------------------
  // 9. ANNOUNCEMENTS CMS
  // --------------------------------------------------------------------------
  fastify.get('/announcements', async (_req: FastifyRequest, reply: FastifyReply) => {
    const items = await prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return reply.send(successResponse(items));
  });

  fastify.post(
    '/announcements',
    {
      preHandler: [authenticate, requireRoles(RoleType.SUPER_ADMIN, RoleType.HIGH_COMMAND, RoleType.STATE_ADMIN, RoleType.CONSTITUENCY_INCHARGE)],
      preValidation: [validateBody(announcementSchema)],
    },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = req.body as z.infer<typeof announcementSchema>;

      const announcement = await prisma.announcement.create({
        data: {
          title: body.title,
          content: body.content,
          priority: body.priority,
          targetLevel: body.targetLevel,
          expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
        },
      });

      await logAudit({
        action: AuditAction.CREATE,
        entityType: 'Announcement',
        entityId: announcement.id,
        req,
        changes: body as unknown as Prisma.InputJsonValue,
      });

      return reply.status(201).send(successResponse(announcement, 'Announcement published'));
    },
  );

  fastify.delete(
    '/announcements/:id',
    {
      preHandler: [authenticate, requireRoles(RoleType.SUPER_ADMIN, RoleType.HIGH_COMMAND, RoleType.STATE_ADMIN)],
    },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const params = req.params as { id: string };

      await prisma.announcement.delete({
        where: { id: params.id },
      });

      await logAudit({
        action: AuditAction.DELETE,
        entityType: 'Announcement',
        entityId: params.id,
        req,
      });

      return reply.send(successResponse({ id: params.id, deleted: true }, 'Announcement deleted'));
    },
  );

  // --------------------------------------------------------------------------
  // 10. POLITICAL ANALYTICS CONFIGURATION
  // --------------------------------------------------------------------------
  fastify.get('/analytics-config', async (_req: FastifyRequest, reply: FastifyReply) => {
    const config = {
      electionYear: 2024,
      targetSeats: 175,
      majorityMark: 88,
      leadParty: 'TDP',
      challengerParty: 'YSRCP',
      projectionConfidence: 0.92,
      trackedParties: ['TDP', 'YSRCP', 'JSP', 'BJP', 'INC', 'NEUTRAL', 'OTH'],
    };
    return reply.send(successResponse(config));
  });

  fastify.put(
    '/analytics-config',
    {
      preHandler: [authenticate, requireRoles(RoleType.SUPER_ADMIN, RoleType.HIGH_COMMAND, RoleType.STATE_ADMIN)],
      preValidation: [validateBody(analyticsConfigSchema)],
    },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = req.body as z.infer<typeof analyticsConfigSchema>;

      await logAudit({
        action: AuditAction.UPDATE,
        entityType: 'AnalyticsConfig',
        entityId: 'global',
        req,
        changes: body as unknown as Prisma.InputJsonValue,
      });

      return reply.send(successResponse(body, 'Analytics configuration updated'));
    },
  );

  // --------------------------------------------------------------------------
  // 11. INCHARGE ASSIGNMENT CMS
  // --------------------------------------------------------------------------
  fastify.get('/incharges', async (req: FastifyRequest, reply: FastifyReply) => {
    const query = req.query as { constituencyId?: string };

    let constituency = query.constituencyId
      ? await prisma.constituency.findUnique({
          where: { id: query.constituencyId },
          include: {
            mandals: {
              include: {
                villages: {
                  include: {
                    booths: {
                      include: {
                        voterGroups: {
                          include: { assignedIncharge: true },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        })
      : await prisma.constituency.findFirst({
          include: {
            mandals: {
              include: {
                villages: {
                  include: {
                    booths: {
                      include: {
                        voterGroups: {
                          include: { assignedIncharge: true },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        });

    if (!constituency) {
      return reply.send(successResponse({ constituency: null, mandals: [] }));
    }

    // Fetch all active assignments
    const assignments = await prisma.userHierarchyAssignment.findMany({
      where: { isActive: true },
      include: {
        user: true,
      },
    });

    const userByUnitId = new Map<string, any>();
    for (const a of assignments) {
      if (a.voterGroupId) userByUnitId.set(`VOTER_GROUP:${a.voterGroupId}`, a.user);
      if (a.boothId) userByUnitId.set(`BOOTH:${a.boothId}`, a.user);
      if (a.villageId) userByUnitId.set(`VILLAGE:${a.villageId}`, a.user);
      if (a.mandalId) userByUnitId.set(`MANDAL:${a.mandalId}`, a.user);
      if (a.constituencyId) userByUnitId.set(`CONSTITUENCY:${a.constituencyId}`, a.user);
    }

    const formatUser = (user?: any) => {
      if (!user) return null;
      return {
        id: user.id,
        userName: user.name || 'Assigned Officer',
        mobileNumber: user.mobileNumber || 'N/A',
        role: user.role,
        accountStatus: user.accountStatus,
      };
    };

    const tree = {
      constituency: {
        id: constituency.id,
        name: constituency.name,
        code: constituency.code,
        incharge: formatUser(userByUnitId.get(`CONSTITUENCY:${constituency.id}`)),
      },
      mandals: constituency.mandals.map((m) => ({
        id: m.id,
        name: m.name,
        code: m.code,
        totalVoters: m.totalVoters,
        incharge: formatUser(userByUnitId.get(`MANDAL:${m.id}`)),
        villages: m.villages.map((v) => ({
          id: v.id,
          name: v.name,
          code: v.code,
          totalVoters: v.totalVoters,
          incharge: formatUser(userByUnitId.get(`VILLAGE:${v.id}`)),
          booths: v.booths.map((b) => ({
            id: b.id,
            boothNumber: b.boothNumber,
            name: b.name,
            totalVoters: b.totalVoters,
            incharge: formatUser(userByUnitId.get(`BOOTH:${b.id}`)),
            voterGroups: b.voterGroups.map((g) => ({
              id: g.id,
              name: g.name,
              totalVoters: g.totalVoters,
              incharge: formatUser(g.assignedIncharge || userByUnitId.get(`VOTER_GROUP:${g.id}`)),
            })),
          })),
        })),
      })),
    };

    return reply.send(successResponse(tree));
  });

  fastify.post(
    '/assign-incharge',
    {
      preHandler: [authenticate, requireRoles(RoleType.SUPER_ADMIN, RoleType.HIGH_COMMAND, RoleType.STATE_ADMIN, RoleType.CONSTITUENCY_INCHARGE)],
    },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = req.body as {
        unitLevel: 'CONSTITUENCY' | 'MANDAL' | 'VILLAGE' | 'BOOTH' | 'VOTER_GROUP';
        unitId: string;
        role: RoleType;
        userName: string;
        mobileNumber: string;
        email?: string;
      };

      if (!body.unitId || !body.mobileNumber || !body.userName) {
        return reply.status(400).send({ error: { message: 'unitId, mobileNumber, and userName are required' } });
      }

      const cleanMobile = body.mobileNumber.replace(/\D/g, '').slice(-10);

      // 1. Find or create Organization
      let org = await prisma.organisation.findFirst();
      if (!org) {
        org = await prisma.organisation.create({
          data: { name: 'Telugu Desam Party', code: 'TDP-ORG' },
        });
      }

      // 2. Find or create User
      let user = await prisma.user.findFirst({
        where: {
          OR: [
            { mobileNumber: cleanMobile },
            { mobileNumber: `+91${cleanMobile}` },
          ],
        },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            organisationId: org.id,
            userCode: `KDP-${cleanMobile.slice(-4)}-${Date.now().toString().slice(-4)}`,
            name: body.userName,
            mobileNumber: cleanMobile,
            role: body.role || RoleType.VOTER_100_INCHARGE,
            accountStatus: 'ACTIVE',
            unitId: body.unitId,
          },
        });
      } else {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            name: body.userName,
            role: body.role || user.role,
            accountStatus: 'ACTIVE',
            unitId: body.unitId,
          },
        });
      }

      // 3. Create or update UserHierarchyAssignment
      const assignmentData: Prisma.UserHierarchyAssignmentUncheckedCreateInput = {
        userId: user.id,
        roleType: body.role || user.role,
        isActive: true,
      };

      if (body.unitLevel === 'CONSTITUENCY') assignmentData.constituencyId = body.unitId;
      else if (body.unitLevel === 'MANDAL') assignmentData.mandalId = body.unitId;
      else if (body.unitLevel === 'VILLAGE') assignmentData.villageId = body.unitId;
      else if (body.unitLevel === 'BOOTH') assignmentData.boothId = body.unitId;
      else if (body.unitLevel === 'VOTER_GROUP') {
        assignmentData.voterGroupId = body.unitId;
        await prisma.voterGroup.update({
          where: { id: body.unitId },
          data: { assignedInchargeId: user.id },
        });
        await prisma.voter.updateMany({
          where: { voterGroupId: body.unitId },
          data: { assignedInchargeId: user.id },
        });
      }

      const existingAssignment = await prisma.userHierarchyAssignment.findFirst({
        where: {
          userId: user.id,
          ...(assignmentData.constituencyId ? { constituencyId: assignmentData.constituencyId } : {}),
          ...(assignmentData.mandalId ? { mandalId: assignmentData.mandalId } : {}),
          ...(assignmentData.villageId ? { villageId: assignmentData.villageId } : {}),
          ...(assignmentData.boothId ? { boothId: assignmentData.boothId } : {}),
          ...(assignmentData.voterGroupId ? { voterGroupId: assignmentData.voterGroupId } : {}),
        },
      });

      if (existingAssignment) {
        await prisma.userHierarchyAssignment.update({
          where: { id: existingAssignment.id },
          data: { isActive: true, roleType: body.role || user.role },
        });
      } else {
        await prisma.userHierarchyAssignment.create({
          data: assignmentData,
        });
      }

      // 4. Create/update Cadre entry for Cadre Network view
      const existingCadre = await prisma.cadre.findFirst({
        where: { userId: user.id },
      });

      if (!existingCadre) {
        await prisma.cadre.create({
          data: {
            userId: user.id,
            performanceScore: 92.5,
            totalAssignedVoters: 100,
          },
        });
      }

      await logAudit({
        action: AuditAction.UPDATE,
        entityType: 'InchargeAssignment',
        entityId: user.id,
        req,
        changes: body as unknown as Prisma.InputJsonValue,
      });

      return reply.send(
        successResponse(
          {
            user: {
              id: user.id,
              userName: user.name,
              mobileNumber: user.mobileNumber,
              role: user.role,
            },
            unitLevel: body.unitLevel,
            unitId: body.unitId,
          },
          `Successfully assigned ${user.name} as ${body.role} for ${body.unitLevel}`,
        ),
      );
    },
  );
}
