import 'dotenv/config';
import {
  AccountStatus,
  AuditAction,
  FakeVoterStatus,
  Gender,
  GroundReportStatus,
  GroundReportType,
  NotificationType,
  OrgHierarchyLevel,
  Prisma,
  PrismaClient,
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

const prisma = new PrismaClient();

// Deterministic Pseudo-Random Generator for Consistent Seeding
function createSeededRandom(seedInit = 42) {
  let seed = seedInit;
  return () => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };
}

const random = createSeededRandom(107);

function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(random() * array.length)];
}

const TELUGU_FIRST_NAMES = [
  'Srinivasa Rao', 'Venkateswarlu', 'Ramanaiah', 'Subba Rao', 'Lakshmi Prasanna',
  'Ramanamma', 'Koteswara Rao', 'Prasad', 'Sivaiah', 'Satyanarayana',
  'Anjali Devi', 'Suresh Babu', 'Rajesh', 'Rama Devi', 'Venkata Krishna',
  'Chenchaiah', 'Krishnaiah', 'Malyadri', 'Saraswathi', 'Gopalakrishna',
  'Adinarayana', 'Bhavani', 'Chandra Sekhar', 'Durga Rao', 'Hari Babu',
  'Jagadeesh', 'Kalyani', 'Nageswara Rao', 'Padmavathi', 'Ranga Rao',
  'Sambasiva Rao', 'Triveni', 'Vasudeva Rao', 'Yedukondalu', 'Sreenu'
];

const TELUGU_LAST_NAMES = [
  'Gaddipati', 'Marella', 'Bollineni', 'Chundi', 'Yeluri',
  'Damarla', 'Nelaturi', 'Ravipudi', 'Dara', 'Mupparaju',
  'Nalamothu', 'Kolla', 'Myneni', 'Kakumanu', 'Gorantla',
  'Talluri', 'Polavarapu', 'Vasireddy', 'Kondragunta', 'Repalle'
];

const PROFESSIONS = [
  'Agriculture', 'Farmer', 'Agricultural Labour', 'Government Employee',
  'Private Employee', 'Business', 'Self Employed', 'Student',
  'Homemaker', 'Daily Wage Worker', 'Driver', 'Teacher'
];

const MIGRATION_CITIES = ['Hyderabad', 'Bengaluru', 'Chennai', 'Vijayawada', 'Guntur', 'Tirupati', 'Dubai / UAE'];

async function main() {
  console.log('🚀 Starting Comprehensive Production Database Seeding for Kondapi Constituency...');

  // Clean existing tables in reverse dependency order
  console.log('🧹 Cleaning existing data...');
  await prisma.aggregateCache.deleteMany();
  await prisma.importJob.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.loginSession.deleteMany();
  await prisma.oTPVerification.deleteMany();
  await prisma.socialTrend.deleteMany();
  await prisma.newsArticle.deleteMany();
  await prisma.aIInsight.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.electionProjection.deleteMany();
  await prisma.partyPerformance.deleteMany();
  await prisma.pollingReport.deleteMany();
  await prisma.groundReport.deleteMany();
  await prisma.trainingProgress.deleteMany();
  await prisma.trainingAssignment.deleteMany();
  await prisma.trainingVideo.deleteMany();
  await prisma.taskStatusHistory.deleteMany();
  await prisma.taskAssignment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.cadreAssignment.deleteMany();
  await prisma.cadre.deleteMany();
  await prisma.liveVoteEvent.deleteMany();
  await prisma.voteTracking.deleteMany();
  await prisma.voterMigration.deleteMany();
  await prisma.fakeVoterFlag.deleteMany();
  await prisma.voterStatusHistory.deleteMany();
  await prisma.voterAssignment.deleteMany();
  await prisma.voter.deleteMany();
  await prisma.voterCaste.deleteMany();
  await prisma.casteCategory.deleteMany();
  await prisma.userHierarchyAssignment.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();
  await prisma.voterGroup.deleteMany();
  await prisma.booth.deleteMany();
  await prisma.village.deleteMany();
  await prisma.mandal.deleteMany();
  await prisma.constituency.deleteMany();
  await prisma.parliament.deleteMany();
  await prisma.zone.deleteMany();
  await prisma.state.deleteMany();
  await prisma.organizationUnit.deleteMany();
  await prisma.partyBranding.deleteMany();
  await prisma.politicalParty.deleteMany();
  await prisma.cMSConfiguration.deleteMany();
  await prisma.organisation.deleteMany();

  // 1. Organisation
  console.log('🏢 Creating Organisation...');
  const org = await prisma.organisation.create({
    data: {
      code: 'KONDAPI-ORG',
      name: 'Kondapi Election Command Network',
      description: 'Unified Field Intelligence & Voter Mobilization System for Kondapi Constituency',
      website: 'https://kondapi-connect.gov.in',
      isActive: true,
    },
  });

  // 2. Political Parties & Brandings
  console.log('🚩 Creating Political Parties & Brandings...');
  const partiesData = [
    { code: 'TDP', name: 'Telugu Desam Party', shortName: 'TDP', symbolName: 'Bicycle', primaryColor: '#eab308', secondaryColor: '#1e293b', sortOrder: 1 },
    { code: 'YSRCP', name: 'Yuvajana Sramika Rythu Congress Party', shortName: 'YSRCP', symbolName: 'Fan', primaryColor: '#2563eb', secondaryColor: '#1e293b', sortOrder: 2 },
    { code: 'JSP', name: 'Jana Sena Party', shortName: 'JSP', symbolName: 'Glass Tumbler', primaryColor: '#dc2626', secondaryColor: '#1e293b', sortOrder: 3 },
    { code: 'BJP', name: 'Bharatiya Janata Party', shortName: 'BJP', symbolName: 'Lotus', primaryColor: '#f97316', secondaryColor: '#1e293b', sortOrder: 4 },
    { code: 'INC', name: 'Indian National Congress', shortName: 'INC', symbolName: 'Hand', primaryColor: '#38bdf8', secondaryColor: '#1e293b', sortOrder: 5 },
    { code: 'NEUTRAL', name: 'Neutral / Undecided', shortName: 'Neutral', symbolName: 'Scale', primaryColor: '#64748b', secondaryColor: '#1e293b', sortOrder: 6 },
    { code: 'OTH', name: 'Other Parties / Independents', shortName: 'OTH', symbolName: 'Star', primaryColor: '#a855f7', secondaryColor: '#1e293b', sortOrder: 7 },
  ];

  const partyRecords: Record<string, string> = {};
  for (const party of partiesData) {
    const created = await prisma.politicalParty.create({
      data: {
        organisationId: org.id,
        code: party.code,
        name: party.name,
        shortName: party.shortName,
        symbolName: party.symbolName,
        primaryColor: party.primaryColor,
        secondaryColor: party.secondaryColor,
        sortOrder: party.sortOrder,
        isActive: true,
      },
    });
    partyRecords[party.code] = created.id;

    if (party.code === 'TDP') {
      await prisma.partyBranding.create({
        data: {
          partyId: created.id,
          title: 'Kondapi TDP Connect 2026',
          slogan: 'Pragathi Sankalpam - Kondapi Vikasanam',
          leaderNames: ['N. Chandrababu Naidu', 'Nara Lokesh', 'Dr. Dola Bala Veeranjaneya Swamy'],
          isDefault: true,
          themeSettings: { primary: '#eab308', surface: '#fefce8', accent: '#ca8a04' },
        },
      });
    }
  }

  // 3. CMS Configuration
  console.log('⚙️ Creating CMS Configuration...');
  await prisma.cMSConfiguration.create({
    data: {
      organisationId: org.id,
      configKey: 'default',
      organisationName: 'Kondapi TDP Command Operations',
      stateName: 'Andhra Pradesh',
      defaultLanguage: 'te-IN',
      hierarchyLabels: {
        state: 'State',
        zone: 'Zone',
        parliament: 'Parliament',
        constituency: 'Assembly Constituency',
        mandal: 'Mandal',
        village: 'Village / Panchayat',
        booth: 'Booth / Polling Station',
        voterGroup: '100-Voter Cluster',
      },
      featureToggles: {
        enableLiveVoteTracking: true,
        enableAIIntelligence: true,
        enableMigratedOutreach: true,
        enableFakeVoterDetection: true,
        enableCadreRating: true,
      },
      aiEnabled: true,
    },
  });

  // 4. Caste Master Categories & Sub-Castes
  console.log('📊 Creating Caste Demographics Master...');
  const casteCategories = [
    { code: 'OC', name: 'Open Category (OC)', subCastes: ['Kamma', 'Reddy', 'Arya Vysya', 'Brahmin', 'Kapu'] },
    { code: 'BC_A', name: 'Backward Class - A', subCastes: ['Rajaka', 'Nayee Brahmin', 'Vaddera'] },
    { code: 'BC_B', name: 'Backward Class - B', subCastes: ['Padmashali', 'Goud', 'Kummari'] },
    { code: 'BC_D', name: 'Backward Class - D', subCastes: ['Yadava', 'Munnuru Kapu', 'Perika'] },
    { code: 'SC', name: 'Scheduled Caste (SC)', subCastes: ['Madiga', 'Mala', 'Relli'] },
    { code: 'ST', name: 'Scheduled Tribe (ST)', subCastes: ['Yanadi', 'Chenchu', 'Yerukula'] },
    { code: 'MINORITY', name: 'Minorities', subCastes: ['Muslim (Shaik)', 'Muslim (Syed)', 'Christian'] },
  ];

  const subCasteMap: Record<string, { catId: string; subId: string }> = {};
  for (const cat of casteCategories) {
    const createdCat = await prisma.casteCategory.create({
      data: { code: cat.code, name: cat.name },
    });
    for (const sub of cat.subCastes) {
      const createdSub = await prisma.voterCaste.create({
        data: {
          categoryId: createdCat.id,
          name: sub,
          code: sub.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, ''),
        },
      });
      subCasteMap[sub] = { catId: createdCat.id, subId: createdSub.id };
    }
  }

  // 5. Build Core 9-Level Hierarchy
  console.log('🏛️ Creating Core Geographical Hierarchy (State -> Zone -> Parliament -> Constituency -> Mandal -> Village -> Booth -> VoterGroup)...');
  
  // State
  const state = await prisma.state.create({
    data: { organisationId: org.id, name: 'Andhra Pradesh', code: 'AP', capital: 'Amaravati', totalVoters: 246000 },
  });

  const stateUnit = await prisma.organizationUnit.create({
    data: { name: 'Andhra Pradesh', code: 'AP', level: OrgHierarchyLevel.STATE, totalVoters: 246000 },
  });

  // Zone
  const zone = await prisma.zone.create({
    data: { stateId: state.id, name: 'Prakasam South Zone', code: 'PRK-S', headquarters: 'Ongole', totalVoters: 246000 },
  });

  const zoneUnit = await prisma.organizationUnit.create({
    data: { name: 'Prakasam South Zone', code: 'PRK-S', level: OrgHierarchyLevel.ZONE, totalVoters: 246000, parentId: stateUnit.id },
  });

  // Parliament
  const parliament = await prisma.parliament.create({
    data: { zoneId: zone.id, name: 'Ongole Parliament', code: 'ONGOLE-PAR', parliamentNumber: 34, totalVoters: 246000 },
  });

  const parUnit = await prisma.organizationUnit.create({
    data: { name: 'Ongole Parliament', code: 'ONGOLE-PAR', level: OrgHierarchyLevel.PARLIAMENT, totalVoters: 246000, parentId: zoneUnit.id },
  });

  // Constituency
  const constituency = await prisma.constituency.create({
    data: {
      parliamentId: parliament.id,
      name: 'Kondapi Assembly Constituency',
      code: 'KONDAPI-AC',
      constituencyNumber: 107,
      isReservedSC: true,
      totalVoters: 246000,
    },
  });

  const constUnit = await prisma.organizationUnit.create({
    data: { name: 'Kondapi Assembly Constituency', code: 'KONDAPI-AC', level: OrgHierarchyLevel.CONSTITUENCY, totalVoters: 246000, parentId: parUnit.id },
  });

  // 6 Mandals of Kondapi
  const mandalsSpec = [
    {
      name: 'Singarayakonda',
      code: 'SINGA-M',
      villages: [
        {
          name: 'Singarayakonda Village',
          code: 'SINGA-V',
          booths: [
            { number: '182', name: 'Booth 182 (MPPS West)', code: 'B182' },
            { number: '183', name: 'Booth 183 (MPPS East)', code: 'B183' },
          ]
        },
        {
          name: 'Somarajupalli',
          code: 'SOMA-V',
          booths: [
            { number: '184', name: 'Booth 184 (ZPH School)', code: 'B184' },
          ]
        },
        {
          name: 'Pakala',
          code: 'PAKA-V',
          booths: [
            { number: '185', name: 'Booth 185 (MPPS Pakala)', code: 'B185' },
            { number: '186', name: 'Booth 186 (Panchayat Office)', code: 'B186' },
          ]
        }
      ]
    },
    {
      name: 'Kondapi',
      code: 'KOND-M',
      villages: [
        {
          name: 'Kondapi Village',
          code: 'KOND-V',
          booths: [
            { number: '145', name: 'Booth 145 (ZPHS North)', code: 'B145' },
            { number: '146', name: 'Booth 146 (ZPHS South)', code: 'B146' },
          ]
        },
        {
          name: 'Chinna Venkanna Palem',
          code: 'CVP-V',
          booths: [
            { number: '147', name: 'Booth 147 (MPPS)', code: 'B147' },
          ]
        },
        {
          name: 'Mupparajuvari Palem',
          code: 'MVP-V',
          booths: [
            { number: '148', name: 'Booth 148 (Community Hall)', code: 'B148' },
          ]
        }
      ]
    },
    {
      name: 'Tangutur',
      code: 'TANG-M',
      villages: [
        {
          name: 'Tangutur Town',
          code: 'TANG-V',
          booths: [
            { number: '102', name: 'Booth 102 (ZPHS Boys)', code: 'B102' },
            { number: '103', name: 'Booth 103 (ZPHS Girls)', code: 'B103' },
          ]
        },
        {
          name: 'Alakurapadu',
          code: 'ALAK-V',
          booths: [
            { number: '104', name: 'Booth 104 (Panchayat Office)', code: 'B104' },
          ]
        },
        {
          name: 'Kondamuru',
          code: 'KONDM-V',
          booths: [
            { number: '105', name: 'Booth 105 (MPPS)', code: 'B105' },
          ]
        }
      ]
    },
    {
      name: 'Jarugumalli',
      code: 'JARU-M',
      villages: [
        {
          name: 'Jarugumalli Village',
          code: 'JARU-V',
          booths: [
            { number: '76', name: 'Booth 76 (ZPH School)', code: 'B76' },
          ]
        },
        {
          name: 'Kamepalli',
          code: 'KAME-V',
          booths: [
            { number: '77', name: 'Booth 77 (MPPS)', code: 'B77' },
          ]
        }
      ]
    },
    {
      name: 'Ponnaluru',
      code: 'PONN-M',
      villages: [
        {
          name: 'Ponnaluru Village',
          code: 'PONN-V',
          booths: [
            { number: '52', name: 'Booth 52 (MPPS Center)', code: 'B52' },
          ]
        },
        {
          name: 'Vellalacheruvu',
          code: 'VELL-V',
          booths: [
            { number: '53', name: 'Booth 53 (ZPHS)', code: 'B53' },
          ]
        }
      ]
    },
    {
      name: 'Marripudi',
      code: 'MARR-M',
      villages: [
        {
          name: 'Marripudi Village',
          code: 'MARR-V',
          booths: [
            { number: '21', name: 'Booth 21 (Govt. Jr College)', code: 'B21' },
          ]
        },
        {
          name: 'Chimata',
          code: 'CHIM-V',
          booths: [
            { number: '22', name: 'Booth 22 (MPPS)', code: 'B22' },
          ]
        }
      ]
    }
  ];

  interface BoothRecord {
    boothId: string;
    boothCode: string;
    boothNumber: string;
    unitId: string;
    mandalId: string;
    villageId: string;
    mandalName: string;
    villageName: string;
    groups: Array<{ groupId: string; groupCode: string; groupName: string; unitId: string }>;
  }

  const createdBooths: BoothRecord[] = [];
  const mandalIdMap: Record<string, string> = {};

  for (const mSpec of mandalsSpec) {
    const mandal = await prisma.mandal.create({
      data: {
        constituencyId: constituency.id,
        name: mSpec.name,
        code: mSpec.code,
        totalVoters: 41000,
      },
    });
    mandalIdMap[mSpec.name] = mandal.id;

    const mandalUnit = await prisma.organizationUnit.create({
      data: {
        name: mSpec.name,
        code: mSpec.code,
        level: OrgHierarchyLevel.MANDAL,
        totalVoters: 41000,
        parentId: constUnit.id,
      },
    });

    for (const vSpec of mSpec.villages) {
      const village = await prisma.village.create({
        data: {
          mandalId: mandal.id,
          name: vSpec.name,
          code: vSpec.code,
          totalVoters: 3500,
        },
      });

      const villageUnit = await prisma.organizationUnit.create({
        data: {
          name: vSpec.name,
          code: vSpec.code,
          level: OrgHierarchyLevel.VILLAGE,
          totalVoters: 3500,
          parentId: mandalUnit.id,
        },
      });

      for (const bSpec of vSpec.booths) {
        const booth = await prisma.booth.create({
          data: {
            villageId: village.id,
            boothNumber: bSpec.number,
            name: bSpec.name,
            code: bSpec.code,
            pollingStation: bSpec.name,
            totalVoters: 1000,
          },
        });

        const boothUnit = await prisma.organizationUnit.create({
          data: {
            name: bSpec.name,
            code: bSpec.code,
            level: OrgHierarchyLevel.BOOTH,
            totalVoters: 1000,
            parentId: villageUnit.id,
          },
        });

        // Create 2 100-Voter Groups per booth (Team A, Team B)
        const groups = [];
        const groupA = await prisma.voterGroup.create({
          data: {
            boothId: booth.id,
            name: `Team A (Voters 1-100)`,
            code: `${bSpec.code}-TA`,
            rangeStart: 1,
            rangeEnd: 100,
            totalVoters: 100,
          },
        });
        const groupAUnit = await prisma.organizationUnit.create({
          data: {
            name: `${bSpec.name} - Team A`,
            code: `${bSpec.code}-TA`,
            level: OrgHierarchyLevel.VOTER_GROUP,
            totalVoters: 100,
            parentId: boothUnit.id,
          },
        });
        groups.push({ groupId: groupA.id, groupCode: groupA.code, groupName: groupA.name, unitId: groupAUnit.id });

        const groupB = await prisma.voterGroup.create({
          data: {
            boothId: booth.id,
            name: `Team B (Voters 101-200)`,
            code: `${bSpec.code}-TB`,
            rangeStart: 101,
            rangeEnd: 200,
            totalVoters: 100,
          },
        });
        const groupBUnit = await prisma.organizationUnit.create({
          data: {
            name: `${bSpec.name} - Team B`,
            code: `${bSpec.code}-TB`,
            level: OrgHierarchyLevel.VOTER_GROUP,
            totalVoters: 100,
            parentId: boothUnit.id,
          },
        });
        groups.push({ groupId: groupB.id, groupCode: groupB.code, groupName: groupB.name, unitId: groupBUnit.id });

        createdBooths.push({
          boothId: booth.id,
          boothCode: booth.code,
          boothNumber: booth.boothNumber,
          unitId: boothUnit.id,
          mandalId: mandal.id,
          villageId: village.id,
          mandalName: mSpec.name,
          villageName: vSpec.name,
          groups,
        });
      }
    }
  }

  // 6. Roles & System Users
  console.log('👤 Creating Roles and Hierarchical Users...');
  const rolesList: { code: RoleType; name: string; level: OrgHierarchyLevel }[] = [
    { code: RoleType.SUPER_ADMIN, name: 'Super Administrator', level: OrgHierarchyLevel.STATE },
    { code: RoleType.STATE_ADMIN, name: 'State Central Command', level: OrgHierarchyLevel.STATE },
    { code: RoleType.CONSTITUENCY_INCHARGE, name: 'Constituency Incharge (MLA)', level: OrgHierarchyLevel.CONSTITUENCY },
    { code: RoleType.MANDAL_INCHARGE, name: 'Mandal Incharge', level: OrgHierarchyLevel.MANDAL },
    { code: RoleType.VILLAGE_INCHARGE, name: 'Village Incharge', level: OrgHierarchyLevel.VILLAGE },
    { code: RoleType.BOOTH_PRESIDENT, name: 'Booth President', level: OrgHierarchyLevel.BOOTH },
    { code: RoleType.VOTER_100_INCHARGE, name: '100-Voter Incharge (Cluster)', level: OrgHierarchyLevel.VOTER_GROUP },
  ];

  const roleMap: Record<string, string> = {};
  for (const r of rolesList) {
    const createdRole = await prisma.role.create({
      data: {
        organisationId: org.id,
        code: r.code,
        name: r.name,
        hierarchyLevel: r.level,
      },
    });
    roleMap[r.code] = createdRole.id;
  }

  // Super Admin User
  await prisma.user.create({
    data: {
      organisationId: org.id,
      userCode: 'SUPER-ADMIN-01',
      name: 'Super Administrator',
      mobileNumber: '9848099999',
      role: RoleType.SUPER_ADMIN,
      roleId: roleMap[RoleType.SUPER_ADMIN],
      accountStatus: AccountStatus.ACTIVE,
      isVerified: true,
      unitId: stateUnit.id,
      passwordHash: '$2b$10$demoHashedPasswordMockForSecureSeeding2026',
    },
  });

  // State Admin User
  await prisma.user.create({
    data: {
      organisationId: org.id,
      userCode: 'STATE-APEX-01',
      name: 'State Central Command Officer',
      mobileNumber: '9848088888',
      role: RoleType.STATE_ADMIN,
      roleId: roleMap[RoleType.STATE_ADMIN],
      accountStatus: AccountStatus.ACTIVE,
      isVerified: true,
      unitId: stateUnit.id,
      passwordHash: '$2b$10$demoHashedPasswordMockForSecureSeeding2026',
    },
  });

  // Constituency Incharge User (Dr. Bala)
  const constIncharge = await prisma.user.create({
    data: {
      organisationId: org.id,
      userCode: 'MLA-KDP-01',
      name: 'Dr. Dola Bala Veeranjaneya Swamy',
      mobileNumber: '9848012345',
      role: RoleType.CONSTITUENCY_INCHARGE,
      roleId: roleMap[RoleType.CONSTITUENCY_INCHARGE],
      accountStatus: AccountStatus.ACTIVE,
      isVerified: true,
      unitId: constUnit.id,
      passwordHash: '$2b$10$demoHashedPasswordMockForSecureSeeding2026',
    },
  });

  await prisma.userHierarchyAssignment.create({
    data: {
      userId: constIncharge.id,
      roleType: RoleType.CONSTITUENCY_INCHARGE,
      constituencyId: constituency.id,
    },
  });

  // 100-Voter Incharge for Booth 145 Team A
  const sampleBooth = createdBooths.find((b) => b.boothCode === 'B145')!;
  const incharge100 = await prisma.user.create({
    data: {
      organisationId: org.id,
      userCode: 'INC-100-B145A',
      name: 'Marella Venkateswarlu',
      mobileNumber: '9848077777',
      role: RoleType.VOTER_100_INCHARGE,
      roleId: roleMap[RoleType.VOTER_100_INCHARGE],
      accountStatus: AccountStatus.ACTIVE,
      isVerified: true,
      unitId: sampleBooth.groups[0].unitId,
      passwordHash: '$2b$10$demoHashedPasswordMockForSecureSeeding2026',
    },
  });

  await prisma.userHierarchyAssignment.create({
    data: {
      userId: incharge100.id,
      roleType: RoleType.VOTER_100_INCHARGE,
      constituencyId: constituency.id,
      mandalId: sampleBooth.mandalId,
      villageId: sampleBooth.villageId,
      boothId: sampleBooth.boothId,
      voterGroupId: sampleBooth.groups[0].groupId,
    },
  });

  // Assign incharge to the VoterGroup
  await prisma.voterGroup.update({
    where: { id: sampleBooth.groups[0].groupId },
    data: { assignedInchargeId: incharge100.id },
  });

  // Create Cadre profile
  await prisma.cadre.create({
    data: {
      userId: incharge100.id,
      skills: ['Door-to-door campaigning', 'Voter slip distribution', 'Voter verification'],
      badges: ['Star Volunteer', '100% Survey Completed'],
      performanceScore: 94.5,
      totalAssignedVoters: 100,
      votedCoveredCount: 68,
      tasksCompletedCount: 12,
      trainingCompletedCount: 4,
    },
  });

  // 7. Seed Voters across Booths and 100-Voter Groups
  console.log('🗳️ Seeding Detailed Demo Voters with Demographics, Caste, Migration & Live Turnout...');
  
  const voterDistribution = [
    { pref: 'TDP', count: 42 },
    { pref: 'YSRCP', count: 28 },
    { pref: 'JSP', count: 12 },
    { pref: 'BJP', count: 6 },
    { pref: 'INC', count: 4 },
    { pref: 'NEUTRAL', count: 8 },
  ];

  let voterSerial = 1;
  const createdVoters = [];

  for (const booth of createdBooths.slice(0, 8)) {
    for (const grp of booth.groups) {
      for (let i = 1; i <= 25; i++) {
        const firstName = getRandomItem(TELUGU_FIRST_NAMES);
        const lastName = getRandomItem(TELUGU_LAST_NAMES);
        const fullName = `${lastName} ${firstName}`;
        const fatherHusbandName = `${lastName} ${getRandomItem(TELUGU_FIRST_NAMES)}`;
        const gender: Gender = i % 2 === 0 ? Gender.FEMALE : Gender.MALE;
        const age = 18 + Math.floor(random() * 62);
        const profession = getRandomItem(PROFESSIONS);
        const subCasteName = getRandomItem(Object.keys(subCasteMap));
        const subCasteInfo = subCasteMap[subCasteName];
        
        // Distribution of preference
        const prefObj = voterDistribution[(voterSerial + i) % voterDistribution.length];
        const pref = prefObj.pref;
        
        // Live Vote Done status
        const isVoted = (voterSerial + i) % 3 !== 0; // ~67% turnout
        const voteStatus: VoteStatus = isVoted ? VoteStatus.VOTE_DONE : VoteStatus.NOT_VOTED;
        const voteDoneTime = isVoted ? new Date(Date.now() - Math.floor(random() * 14400000)) : null;

        // Status
        let voterStatus: VoterStatus = VoterStatus.ACTIVE;
        let isFake = false;
        let isMigrated = false;
        let fakeReason: string | null = null;
        let migrationCity: string | null = null;

        if (i === 13) {
          voterStatus = VoterStatus.FAKE;
          isFake = true;
          fakeReason = 'Duplicate EPIC number detected across neighboring constituency';
        } else if (i === 19) {
          voterStatus = VoterStatus.DECEASED;
          isFake = true;
          fakeReason = 'Voter passed away in 2024; deletion pending at ERO';
        } else if (i === 7 || i === 22) {
          isMigrated = true;
          migrationCity = getRandomItem(MIGRATION_CITIES);
        }

        const epicNumber = `KDP${String(1000000 + voterSerial).padStart(7, '0')}`;
        const mobile = `9848${String(100000 + (voterSerial * 7) % 899999)}`;

        const migrationState = isMigrated ? (migrationCity?.includes('Bengaluru') ? 'Karnataka' : migrationCity?.includes('Chennai') ? 'Tamil Nadu' : 'Telangana') : null;

        const createdVoter = await prisma.voter.create({
          data: {
            serialNumber: voterSerial++,
            epicNumber,
            name: fullName,
            fatherHusbandName,
            relationType: gender === Gender.FEMALE && age > 23 ? RelationType.HUSBAND : RelationType.FATHER,
            houseNumber: `${(i % 15) + 1}-${10 + (i % 40)}`,
            age,
            gender,
            mobileNumber: mobile,
            stateId: state.id,
            zoneId: zone.id,
            parliamentId: parliament.id,
            constituencyId: constituency.id,
            mandalId: booth.mandalId,
            villageId: booth.villageId,
            boothId: booth.boothId,
            voterGroupId: grp.groupId,
            unitId: grp.unitId,
            assignedInchargeId: grp.groupCode === 'B145-TA' ? incharge100.id : null,
            casteCategoryId: subCasteInfo.catId,
            voterCasteId: subCasteInfo.subId,
            caste: subCasteName,
            subCaste: subCasteName,
            profession,
            politicalPartyId: partyRecords[pref] || partyRecords['NEUTRAL'],
            politicalPreference: pref,
            voterStatus,
            surveyStatus: SurveyStatus.SURVEYED,
            locationStatus: isMigrated ? VoterLocationStatus.MIGRATED : VoterLocationStatus.LOCAL,
            voterLocationStatus: isMigrated ? VoterLocationStatus.MIGRATED : VoterLocationStatus.LOCAL,
            migrationCity: isMigrated ? migrationCity : null,
            migrationState,
            currentLocation: isMigrated ? migrationCity : 'Local Village',
            voteStatus,
            voteDoneAt: voteDoneTime,
            voteDoneTime,
            inchargeAssessment: pref,
            notes: isMigrated ? `Migrated to ${migrationCity} for employment; contacted for polling day transport.` : 'Verified during door-to-door Janmabhoomi campaign.',
          },
        });

        createdVoters.push(createdVoter);

        // Record live vote tracking entry if voted
        if (isVoted && voteDoneTime) {
          await prisma.voteTracking.create({
            data: {
              voterId: createdVoter.id,
              status: VoteStatus.VOTE_DONE,
              markedById: incharge100.id,
              markedAt: voteDoneTime,
              verificationMethod: 'POLLING_BOOTH_SLIP',
            },
          });

          await prisma.liveVoteEvent.create({
            data: {
              previousStatus: VoteStatus.NOT_VOTED,
              nextStatus: VoteStatus.VOTE_DONE,
              changedAt: voteDoneTime,
              voterId: createdVoter.id,
              unitId: grp.unitId,
              inchargeId: incharge100.id,
            },
          });
        }

        // Record Fake Voter Flag
        if (isFake && fakeReason) {
          await prisma.fakeVoterFlag.create({
            data: {
              voterId: createdVoter.id,
              reason: fakeReason,
              status: FakeVoterStatus.FLAGGED,
              flaggedById: incharge100.id,
            },
          });
        }

        // Record Migration Details
        if (isMigrated && migrationCity) {
          await prisma.voterMigration.create({
            data: {
              voterId: createdVoter.id,
              status: VoterLocationStatus.MIGRATED,
              destinationCity: migrationCity,
              destinationState: migrationCity.includes('Bengaluru') ? 'Karnataka' : migrationCity.includes('Chennai') ? 'Tamil Nadu' : 'Telangana',
              travelRequired: true,
              transportArranged: false,
              notes: 'Family coordinates transport via Ongole RTC Special Bus',
            },
          });
        }
      }
    }
  }

  // 8. Tasks & Workflows
  console.log('📋 Creating High Command & Field Tasks...');
  const tasksData = [
    {
      title: 'Distribute Official Voter Information Slips',
      description: 'Hand deliver printed voter slips to all 100 assigned households in Booth 145.',
      priority: TaskPriority.HIGH,
      status: TaskStatus.IN_PROGRESS,
      dueDate: new Date(Date.now() + 86400000 * 2),
    },
    {
      title: 'Outreach to Migrated Voters in Hyderabad & Bengaluru',
      description: 'Contact all migrated voters via phone and confirm election-day transport reservations.',
      priority: TaskPriority.URGENT,
      status: TaskStatus.PENDING,
      dueDate: new Date(Date.now() + 86400000 * 3),
    },
    {
      title: 'Submit Form 7 Objections for Deceased & Fake Voters',
      description: 'Coordinate with Booth Level Officer (BLO) for official verification of flagged duplicate entries.',
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.COMPLETED,
      dueDate: new Date(Date.now() - 86400000),
    },
  ];

  for (const task of tasksData) {
    const createdTask = await prisma.task.create({
      data: {
        title: task.title,
        description: task.description,
        instructions: 'Follow standard Election Commission guidelines and capture geo-tagged survey confirmation.',
        priority: task.priority,
        status: task.status,
        dueDate: task.dueDate,
        constituencyId: constituency.id,
        unitId: constUnit.id,
        createdById: constIncharge.id,
      },
    });

    await prisma.taskAssignment.create({
      data: {
        taskId: createdTask.id,
        userId: incharge100.id,
        status: task.status,
      },
    });
  }

  // 9. Training Videos & Progress
  console.log('🎓 Creating Training Videos & Cadre Progress...');
  const trainingVideos = [
    {
      title: 'Effective Door-to-Door Voter Engagement & Surveying',
      description: 'Master the 5-step conversation framework to identify undecided voters and address civic grievances.',
      category: 'Field Operations',
      duration: '12m 45s',
      youtubeId: 'dQw4w9WgXcQ',
      thumbnailUrl: 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=600&q=80',
    },
    {
      title: 'Booth Management & EVM Verification on Polling Day',
      description: 'Complete protocol for Mock Polls, Form 17C verification, and Polling Agent shift handovers.',
      category: 'Polling Day Protocol',
      duration: '18m 10s',
      youtubeId: 'dQw4w9WgXcQ',
      thumbnailUrl: 'https://images.unsplash.com/photo-1494178270175-e96de2971df9?w=600&q=80',
    },
    {
      title: 'Identifying Fake & Duplicate Voters Using EPIC Matching',
      description: 'How to cross-reference electoral rolls and file legitimate Form 7 objections with evidence.',
      category: 'Voter List Verification',
      duration: '09m 30s',
      youtubeId: 'dQw4w9WgXcQ',
      thumbnailUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&q=80',
    },
  ];

  for (const vid of trainingVideos) {
    const createdVid = await prisma.trainingVideo.create({
      data: {
        title: vid.title,
        description: vid.description,
        category: vid.category,
        duration: vid.duration,
        youtubeId: vid.youtubeId,
        thumbnailUrl: vid.thumbnailUrl,
        unitId: constUnit.id,
      },
    });

    await prisma.trainingProgress.create({
      data: {
        userId: incharge100.id,
        videoId: createdVid.id,
        status: TrainingStatus.COMPLETED,
        watchedAt: new Date(Date.now() - 172800000),
        completedAt: new Date(Date.now() - 172800000),
        quizScore: 100,
      },
    });
  }

  // 10. Ground Reports & Polling Reports
  console.log('🚨 Creating Field Ground Reports & Polling Booth Reports...');
  await prisma.groundReport.create({
    data: {
      reportType: GroundReportType.COMPLAINT_ISSUE,
      priority: TaskPriority.URGENT,
      description: 'EVM unit at Booth 145 (ZPHS North) had a 15-minute battery sync delay; resolved after sector officer check.',
      issueCategory: 'EVM & Infrastructure',
      affectedVotersCount: 35,
      status: GroundReportStatus.RESOLVED,
      resolutionNotes: 'Sector officer replaced backup battery pack. Voting resumed normally.',
      constituencyId: constituency.id,
      mandalId: sampleBooth.mandalId,
      villageId: sampleBooth.villageId,
      boothId: sampleBooth.boothId,
      unitId: sampleBooth.unitId,
      createdById: incharge100.id,
    },
  });

  await prisma.groundReport.create({
    data: {
      reportType: GroundReportType.GENERAL_UPDATE,
      priority: TaskPriority.MEDIUM,
      description: 'Morning queue turnout is exceptionally strong among women and senior citizens in Ponnaluru Village.',
      status: GroundReportStatus.RESOLVED,
      constituencyId: constituency.id,
      mandalId: sampleBooth.mandalId,
      villageId: sampleBooth.villageId,
      boothId: sampleBooth.boothId,
      unitId: sampleBooth.unitId,
      createdById: incharge100.id,
    },
  });

  await prisma.pollingReport.create({
    data: {
      mandalName: sampleBooth.mandalName,
      boothLabel: sampleBooth.boothNumber,
      reporterName: incharge100.name,
      tdpVotes: 320,
      ysrcpVotes: 190,
      jspVotes: 45,
      bjpVotes: 20,
      incVotes: 15,
      othersVotes: 10,
      totalVotes: 600,
      boothId: sampleBooth.boothId,
      unitId: sampleBooth.unitId,
      createdById: incharge100.id,
    },
  });

  // 11. AI Strategic Intelligence, News & Projections
  console.log('🧠 Creating AI Strategic Intelligence Insights & Projections...');
  await prisma.electionProjection.create({
    data: {
      constituencyId: constituency.id,
      totalElectorate: 246000,
      projectedTurnout: 84.5,
      leadingPartyCode: 'TDP',
      leadMarginVotes: 18450,
      confidenceScore: 0.94,
      insightsSummary: 'TDP holds strong consolidation in Singarayakonda, Tangutur, and Kondapi mandals driven by agricultural welfare and infrastructure trust.',
      scenarioData: {
        winningMandals: ['Singarayakonda', 'Kondapi', 'Tangutur', 'Ponnaluru', 'Marripudi'],
        closeContestMandals: ['Jarugumalli'],
        projectedSeatMargin: '+18,450 votes',
      },
    },
  });

  const aiInsights = [
    {
      category: 'BOOTH_ANOMALY',
      title: 'Voter Turnout Surge Detected in Singarayakonda Rural Booths',
      content: 'Early morning turnout (7 AM - 11 AM) exceeded 42%, marking a 6.8% positive swing relative to 2019 baseline.',
      sentimentScore: 0.88,
      recommendedAction: 'Deploy additional water distribution volunteers and shade pandals for afternoon queue comfort.',
    },
    {
      category: 'MIGRATION_STRATEGY',
      title: 'High Inflow of Bangalore-Hyderabad Commuters for Polling Weekend',
      content: 'Over 1,420 registered voters confirmed inter-city travel via RTC and private carpools.',
      sentimentScore: 0.91,
      recommendedAction: 'Ensure reception desk at Singarayakonda and Tangutur junctions with voter slip guides.',
    },
  ];

  for (const insight of aiInsights) {
    await prisma.aIInsight.create({
      data: {
        constituencyId: constituency.id,
        category: insight.category,
        title: insight.title,
        content: insight.content,
        sentimentScore: insight.sentimentScore,
        recommendedAction: insight.recommendedAction,
        tags: ['Election2026', 'Kondapi', 'TurnoutVelocity'],
      },
    });
  }

  await prisma.newsArticle.create({
    data: {
      constituencyId: constituency.id,
      headline: 'Massive Public Reception for TDP Candidate Dr. Bala in Kondapi Roadshow',
      sourceName: 'Eenadu / Andhra Jyothy',
      snippet: 'Thousands of farmers and youth gathered across Tangutur and Singarayakonda expressing support for clean governance and irrigation projects.',
      sentiment: 'POSITIVE',
    },
  });

  await prisma.socialTrend.create({
    data: {
      constituencyId: constituency.id,
      hashtag: '#KondapiVikasanam2026',
      platform: 'X / Instagram',
      mentionCount: 8420,
      sentimentPct: 82.4,
      trendingRank: 1,
    },
  });

  // 12. Audit Log & Notifications
  console.log('📝 Creating Audit Log and Notifications...');
  await prisma.auditLog.create({
    data: {
      action: AuditAction.CREATE,
      entityType: 'Voter',
      entityId: createdVoters[0].id,
      userId: incharge100.id,
      changes: { action: 'Initial Verification', status: 'ACTIVE' },
    },
  });

  await prisma.notification.create({
    data: {
      type: NotificationType.TASK_ASSIGNED,
      title: 'New Priority Task: Voter Slips Distribution',
      message: 'You have been assigned to verify and distribute voter slips for Booth 145 Team A.',
      userId: incharge100.id,
    },
  });

  console.log('✅ Database Seeding Completed Successfully!');
  console.log('📊 Summary:');
  console.log(`- 1 Organisation, 7 Political Parties, 1 CMS Config`);
  console.log(`- 9-Level Hierarchy: 1 State, 1 Zone, 1 Parliament, 1 AC, 6 Mandals, 15 Villages, 19 Booths, 38 Voter Groups`);
  console.log(`- 2 Demo Users (Constituency Incharge + 100-Voter Incharge) with Roles & Hierarchy Assignments`);
  console.log(`- ${createdVoters.length} Detailed Demo Voters with Demographics, Caste, Migration, and Live Turnout`);
  console.log(`- 3 Tasks, 3 Training Videos with Progress, 2 Ground Reports, 1 Polling Report`);
  console.log(`- 1 Election Projection, 2 AI Insights, 1 News Article, 1 Social Trend`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
