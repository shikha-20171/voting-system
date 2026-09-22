/**
 * Production Multi-Tier Data Seed Script
 * Seeds full multi-tier hierarchy:
 * 1. Andhra Pradesh -> Prakasam Zone -> Ongole Parliament -> Kondapi AC (107) -> 6 Mandals -> Villages -> Booths -> VoterGroups
 * 2. Telangana -> 5 Zones -> 17 Parliaments -> Key Constituencies -> Mandals -> Villages -> Booths -> VoterGroups
 * 3. Synchronized OrganizationUnit recursive tree for all levels
 * 4. 1,200+ Realistic Voters with EPIC, Demographics, Caste, Preference, Vote Status
 * 5. Users with assigned roles matching all frontend quick-switcher accounts (9848... and 9000...)
 * 6. Cadre, Tasks, Training, Reports, AI Insights, LiveVoteEvents
 */
import {
  PrismaClient,
  RoleType,
  Gender,
  RelationType,
  VoterStatus,
  SurveyStatus,
  VoterLocationStatus,
  VoteStatus,
  TaskPriority,
  TaskStatus,
  OrgHierarchyLevel,
  GroundReportType,
  GroundReportStatus,
  TrainingStatus,
} from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting Comprehensive Enterprise Data Seed...\n');

  // ─── 1. ORGANISATION ──────────────────────────────────────────────────────
  let org = await prisma.organisation.findFirst({ where: { code: 'KONDAPI-ORG' } });
  if (!org) {
    org = await prisma.organisation.create({
      data: {
        name: 'Kondapi & AP Democratic Alliance Command',
        code: 'KONDAPI-ORG',
        description: 'Integrated Voter Management & Command Center',
        website: 'https://kondapi-tdp.org',
        isActive: true,
      },
    });
    console.log('✅ Organisation created:', org.name);
  }

  // ─── 2. CMS CONFIG ────────────────────────────────────────────────────────
  await prisma.cMSConfiguration.upsert({
    where: { configKey: 'default' },
    update: {
      organisationName: 'Kondapi TDP Connect',
      stateName: 'Andhra Pradesh',
      headerTitle: 'Kondapi TDP Connect',
      slogan: 'Empowering Cadre, Uniting Citizens for Kondapi 2026',
      primaryColor: '#eab308',
      secondaryColor: '#1e293b',
      accentColor: '#3b82f6',
      activePartyCode: 'TDP',
      appScope: 'SINGLE_MLA',
    },
    create: {
      organisationId: org.id,
      configKey: 'default',
      organisationName: 'Kondapi TDP Connect',
      stateName: 'Andhra Pradesh',
      headerTitle: 'Kondapi TDP Connect',
      defaultLanguage: 'te-IN',
      primaryColor: '#eab308',
      secondaryColor: '#1e293b',
      accentColor: '#3b82f6',
      activePartyCode: 'TDP',
      appScope: 'SINGLE_MLA',
      slogan: 'Empowering Cadre, Uniting Citizens for Kondapi 2026',
      hierarchyLabels: {
        STATE: 'State Incharge',
        ZONE: 'Zone Coordinator',
        PARLIAMENT: 'Parliament Incharge',
        CONSTITUENCY: 'Constituency Incharge',
        MANDAL: 'Mandal President',
        VILLAGE: 'Village Incharge',
        BOOTH: 'Booth President',
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
      activeHierarchyLevels: ['VOTER_GROUP', 'BOOTH', 'VILLAGE', 'MANDAL', 'CONSTITUENCY', 'PARLIAMENT', 'ZONE', 'STATE'],
      aiEnabled: true,
    },
  });
  console.log('✅ CMS Config upserted');

  // ─── 3. POLITICAL PARTIES ────────────────────────────────────────────────
  const parties = [
    { code: 'TDP', name: 'Telugu Desam Party', shortName: 'TDP', symbolName: 'Bicycle', primaryColor: '#eab308', secondaryColor: '#1e293b', accentColor: '#3b82f6', sortOrder: 1 },
    { code: 'YSRCP', name: 'YSR Congress Party', shortName: 'YSRCP', symbolName: 'Fan', primaryColor: '#2563eb', secondaryColor: '#15803d', accentColor: '#38bdf8', sortOrder: 2 },
    { code: 'JSP', name: 'JanaSena Party', shortName: 'JSP', symbolName: 'Glass', primaryColor: '#dc2626', secondaryColor: '#1e293b', accentColor: '#3b82f6', sortOrder: 3 },
    { code: 'BJP', name: 'Bharatiya Janata Party', shortName: 'BJP', symbolName: 'Lotus', primaryColor: '#f97316', secondaryColor: '#1e293b', accentColor: '#3b82f6', sortOrder: 4 },
    { code: 'INC', name: 'Indian National Congress', shortName: 'INC', symbolName: 'Hand', primaryColor: '#FF6600', secondaryColor: '#138808', accentColor: '#0038A8', sortOrder: 5 },
    { code: 'BRS', name: 'Bharat Rashtra Samithi', shortName: 'BRS', symbolName: 'Car', primaryColor: '#ec4899', secondaryColor: '#831843', accentColor: '#6366f1', sortOrder: 6 },
    { code: 'AIMIM', name: 'All India Majlis-E-Ittehadul Muslimeen', shortName: 'AIMIM', symbolName: 'Kite', primaryColor: '#15803d', secondaryColor: '#1e293b', accentColor: '#3b82f6', sortOrder: 7 },
    { code: 'CPI', name: 'Communist Party of India', shortName: 'CPI', symbolName: 'Ears of Corn', primaryColor: '#b91c1c', secondaryColor: '#1e293b', accentColor: '#3b82f6', sortOrder: 8 },
    { code: 'NEUTRAL', name: 'Neutral / Undecided', shortName: 'Neutral', symbolName: 'Scale', primaryColor: '#64748b', secondaryColor: '#1e293b', accentColor: '#3b82f6', sortOrder: 9 },
    { code: 'OTH', name: 'Other Parties / Independents', shortName: 'OTH', symbolName: 'Star', primaryColor: '#a855f7', secondaryColor: '#1e293b', accentColor: '#3b82f6', sortOrder: 10 },
  ];

  for (const p of parties) {
    await prisma.politicalParty.upsert({
      where: { code: p.code },
      update: { primaryColor: p.primaryColor, secondaryColor: p.secondaryColor, symbolName: p.symbolName },
      create: { ...p, organisationId: org.id, isActive: true },
    });
  }
  console.log(`✅ Political Parties verified (${parties.length})`);

  // Helper to ensure an OrganizationUnit exists and mirrors a hierarchy entity
  async function ensureOrgUnit(name: string, code: string, level: OrgHierarchyLevel, parentId: string | null = null, totalVoters = 0) {
    let unit = await prisma.organizationUnit.findFirst({ where: { code } });
    if (!unit) {
      unit = await prisma.organizationUnit.create({
        data: { name, code, level, parentId, totalVoters },
      });
    } else if (unit.parentId !== parentId || unit.name !== name) {
      unit = await prisma.organizationUnit.update({
        where: { id: unit.id },
        data: { name, parentId, level, totalVoters: totalVoters || unit.totalVoters },
      });
    }
    return unit;
  }

  // ─── 4. ANDHRA PRADESH HIERARCHY (Primary Focus: Kondapi AC No. 107) ──────
  let apState = await prisma.state.findFirst({ where: { code: 'AP' } });
  if (!apState) {
    apState = await prisma.state.create({
      data: { name: 'Andhra Pradesh', code: 'AP', organisationId: org.id, totalVoters: 40700000 },
    });
  }
  const apUnit = await ensureOrgUnit('Andhra Pradesh State Command', 'UNIT-AP', OrgHierarchyLevel.STATE, null, 40700000);

  // Prakasam Zone
  let prakasamZone = await prisma.zone.findFirst({ where: { code: 'AP-PRAKASAM-ZONE' } });
  if (!prakasamZone) {
    prakasamZone = await prisma.zone.create({
      data: { name: 'Prakasam Zone', code: 'AP-PRAKASAM-ZONE', stateId: apState.id, headquarters: 'Ongole', totalVoters: 3400000 },
    });
  }
  const prakasamUnit = await ensureOrgUnit('Prakasam Zone', 'UNIT-ZONE-PRAKASAM', OrgHierarchyLevel.ZONE, apUnit.id, 3400000);

  // Ongole Parliament
  let ongoleParliament = await prisma.parliament.findFirst({ where: { code: 'AP-PC-33' } });
  if (!ongoleParliament) {
    ongoleParliament = await prisma.parliament.create({
      data: { name: 'Ongole Parliament Constituency', code: 'AP-PC-33', parliamentNumber: 33, zoneId: prakasamZone.id, totalVoters: 1560000 },
    });
  }
  const ongoleUnit = await ensureOrgUnit('Ongole Parliament MP Seat', 'UNIT-PC-ONGOLE', OrgHierarchyLevel.PARLIAMENT, prakasamUnit.id, 1560000);

  // Kondapi Assembly Constituency (AC-107)
  let kondapiAC = await prisma.constituency.findFirst({ where: { code: 'AC-107' } });
  if (!kondapiAC) {
    kondapiAC = await prisma.constituency.create({
      data: {
        name: 'Kondapi Assembly Constituency',
        code: 'AC-107',
        constituencyNumber: 107,
        parliamentId: ongoleParliament.id,
        isReservedSC: true,
        totalVoters: 228450,
      },
    });
  }
  const kondapiUnit = await ensureOrgUnit('Kondapi Assembly Constituency', 'UNIT-AC-KONDAPI', OrgHierarchyLevel.CONSTITUENCY, ongoleUnit.id, 228450);

  // 6 Mandals of Kondapi
  const kondapiMandalsData = [
    {
      name: 'Kondapi Mandal',
      code: 'KDP-MDL-01',
      villages: [
        { name: 'Kondapi Town', code: 'VLG-KDP-01', booths: ['Booth 101 - ZPHS Main Hall', 'Booth 102 - ZPHS South Wing'] },
        { name: 'Chinna Venkanna Palem', code: 'VLG-KDP-02', booths: ['Booth 103 - Primary School', 'Booth 104 - Community Hall'] },
        { name: 'Mupparajuvari Palem', code: 'VLG-KDP-03', booths: ['Booth 105 - MPPS Center', 'Booth 106 - Gram Panchayat'] },
      ],
    },
    {
      name: 'Tangutur Mandal',
      code: 'KDP-MDL-02',
      villages: [
        { name: 'Tangutur Village', code: 'VLG-TNG-01', booths: ['Booth 145 - High School Room 1', 'Booth 146 - High School Room 2'] },
        { name: 'Karumanchi', code: 'VLG-TNG-02', booths: ['Booth 147 - MPP School', 'Booth 148 - Panchayat Hall'] },
      ],
    },
    {
      name: 'Singarayakonda Mandal',
      code: 'KDP-MDL-03',
      villages: [
        { name: 'Singarayakonda Town', code: 'VLG-SRK-01', booths: ['Booth 151 - Govt Junior College', 'Booth 152 - Railway Colony'] },
        { name: 'Pakala', code: 'VLG-SRK-02', booths: ['Booth 153 - Coastal Center', 'Booth 154 - Primary School'] },
      ],
    },
    {
      name: 'Jarugumalli Mandal',
      code: 'KDP-MDL-04',
      villages: [
        { name: 'Jarugumalli Village', code: 'VLG-JRG-01', booths: ['Booth 161 - ZP School', 'Booth 162 - Panchayat Office'] },
        { name: 'Kamepalli', code: 'VLG-JRG-02', booths: ['Booth 163 - Village School', 'Booth 164 - North Block'] },
      ],
    },
    {
      name: 'Ponnaluru Mandal',
      code: 'KDP-MDL-05',
      villages: [
        { name: 'Ponnaluru Village', code: 'VLG-PNL-01', booths: ['Booth 171 - High School Block', 'Booth 172 - MPPS Center'] },
        { name: 'Kotapadu', code: 'VLG-PNL-02', booths: ['Booth 173 - Gram Panchayat', 'Booth 174 - East Wing'] },
      ],
    },
    {
      name: 'Marripudi Mandal',
      code: 'KDP-MDL-06',
      villages: [
        { name: 'Marripudi Village', code: 'VLG-MRP-01', booths: ['Booth 181 - ZPHS Hall', 'Booth 182 - Primary School'] },
        { name: 'Chimata', code: 'VLG-MRP-02', booths: ['Booth 183 - Village Center', 'Booth 184 - West Wing'] },
      ],
    },
  ];

  const allBooths: any[] = [];
  const allVoterGroups: any[] = [];

  for (const mData of kondapiMandalsData) {
    let mandal = await prisma.mandal.findFirst({ where: { code: mData.code } });
    if (!mandal) {
      mandal = await prisma.mandal.create({
        data: { name: mData.name, code: mData.code, constituencyId: kondapiAC.id, totalVoters: 38000 },
      });
    }
    const mandalUnit = await ensureOrgUnit(mData.name, `UNIT-MDL-${mData.code}`, OrgHierarchyLevel.MANDAL, kondapiUnit.id, 38000);

    for (const vData of mData.villages) {
      let village = await prisma.village.findFirst({ where: { code: vData.code } });
      if (!village) {
        village = await prisma.village.create({
          data: { name: vData.name, code: vData.code, mandalId: mandal.id, totalVoters: 8500 },
        });
      }
      const villageUnit = await ensureOrgUnit(vData.name, `UNIT-VLG-${vData.code}`, OrgHierarchyLevel.VILLAGE, mandalUnit.id, 8500);

      for (let bIdx = 0; bIdx < vData.booths.length; bIdx++) {
        const bName = vData.booths[bIdx];
        const bNumber = bName.split(' - ')[0].trim();
        const bCode = `PS-${vData.code}-${bIdx + 1}`;

        let booth = await prisma.booth.findFirst({ where: { code: bCode } });
        if (!booth) {
          booth = await prisma.booth.create({
            data: {
              name: bName,
              code: bCode,
              boothNumber: bNumber,
              pollingStation: bName,
              villageId: village.id,
              totalVoters: 1240,
            },
          });
        }
        const boothUnit = await ensureOrgUnit(bName, `UNIT-BTH-${bCode}`, OrgHierarchyLevel.BOOTH, villageUnit.id, 1240);
        allBooths.push({ ...booth, unitId: boothUnit.id, mandal, village });

        // 2 Voter Groups (100-voter groups) per Booth
        for (let g = 1; g <= 2; g++) {
          const gCode = `${bCode}-VG${g}`;
          const gName = `${bNumber} - Team ${String(g).padStart(2, '0')} (Voters ${(g - 1) * 100 + 1}-${g * 100})`;
          let vg = await prisma.voterGroup.findFirst({ where: { code: gCode } });
          if (!vg) {
            vg = await prisma.voterGroup.create({
              data: {
                name: gName,
                code: gCode,
                boothId: booth.id,
                rangeStart: (g - 1) * 100 + 1,
                rangeEnd: g * 100,
                totalVoters: 100,
              },
            });
          }
          const vgUnit = await ensureOrgUnit(gName, `UNIT-VG-${gCode}`, OrgHierarchyLevel.VOTER_GROUP, boothUnit.id, 100);
          allVoterGroups.push({ ...vg, unitId: vgUnit.id, booth, mandal, village });
        }
      }
    }
  }
  console.log(`✅ Kondapi Hierarchy seeded (6 Mandals, ${allBooths.length} Booths, ${allVoterGroups.length} Voter Groups)`);

  // ─── 5. USERS & ROLES SETUP ───────────────────────────────────────────────
  const rolesList = [
    { code: RoleType.SUPER_ADMIN, name: 'Super Administrator', level: OrgHierarchyLevel.STATE },
    { code: RoleType.STATE_ADMIN, name: 'State Administrator', level: OrgHierarchyLevel.STATE },
    { code: RoleType.ZONE_INCHARGE, name: 'Zone Coordinator', level: OrgHierarchyLevel.ZONE },
    { code: RoleType.PARLIAMENT_INCHARGE, name: 'Parliament Incharge', level: OrgHierarchyLevel.PARLIAMENT },
    { code: RoleType.CONSTITUENCY_INCHARGE, name: 'Constituency Incharge', level: OrgHierarchyLevel.CONSTITUENCY },
    { code: RoleType.MANDAL_INCHARGE, name: 'Mandal President', level: OrgHierarchyLevel.MANDAL },
    { code: RoleType.VILLAGE_INCHARGE, name: 'Village Incharge', level: OrgHierarchyLevel.VILLAGE },
    { code: RoleType.BOOTH_PRESIDENT, name: 'Booth President', level: OrgHierarchyLevel.BOOTH },
    { code: RoleType.VOTER_100_INCHARGE, name: '100-Voter Incharge', level: OrgHierarchyLevel.VOTER_GROUP },
    { code: RoleType.POLLING_AGENT, name: 'Polling Agent', level: OrgHierarchyLevel.BOOTH },
    { code: RoleType.VIEWER, name: 'Viewer / Observer', level: OrgHierarchyLevel.CONSTITUENCY },
  ];

  for (const r of rolesList) {
    await prisma.role.upsert({
      where: { code: r.code },
      update: { name: r.name, hierarchyLevel: r.level },
      create: { code: r.code, name: r.name, hierarchyLevel: r.level, organisationId: org.id },
    });
  }

  const primaryBooth = allBooths[0];
  const primaryGroup = allVoterGroups[0];

  const seedUsers = [
    // Kondapi / AP quick-switch users
    {
      mobile: '9848099999',
      name: 'Nara Lokesh / IT Wing Command',
      role: RoleType.SUPER_ADMIN,
      unitId: apUnit.id,
      stateId: apState.id,
    },
    {
      mobile: '9848088888',
      name: 'AP State Command War Room Officer',
      role: RoleType.STATE_ADMIN,
      unitId: apUnit.id,
      stateId: apState.id,
    },
    {
      mobile: '9848012345',
      name: 'Dr. Dola Bala Veeranjaneya Swamy',
      role: RoleType.CONSTITUENCY_INCHARGE,
      unitId: kondapiUnit.id,
      stateId: apState.id,
      zoneId: prakasamZone.id,
      parliamentId: ongoleParliament.id,
      constituencyId: kondapiAC.id,
    },
    {
      mobile: '9848077777',
      name: 'Kondapi Mandal Chief Incharge',
      role: RoleType.MANDAL_INCHARGE,
      unitId: allBooths[0]?.unitId,
      constituencyId: kondapiAC.id,
      mandalId: allBooths[0]?.mandal?.id,
    },
    {
      mobile: '9848010001',
      name: 'Village President (Kondapi Town)',
      role: RoleType.VILLAGE_INCHARGE,
      unitId: allBooths[0]?.unitId,
      constituencyId: kondapiAC.id,
      mandalId: allBooths[0]?.mandal?.id,
      villageId: allBooths[0]?.village?.id,
    },
    {
      mobile: '9848010002',
      name: 'Booth 101 President',
      role: RoleType.BOOTH_PRESIDENT,
      unitId: primaryBooth?.unitId,
      constituencyId: kondapiAC.id,
      boothId: primaryBooth?.id,
    },
    {
      mobile: '9848010003',
      name: 'Marella Venkateswarlu (100-Voter Incharge)',
      role: RoleType.VOTER_100_INCHARGE,
      unitId: primaryGroup?.unitId,
      constituencyId: kondapiAC.id,
      boothId: primaryBooth?.id,
      voterGroupId: primaryGroup?.id,
    },
    // Telangana users
    {
      mobile: '9000012345',
      name: 'TPCC Command Admin',
      role: RoleType.SUPER_ADMIN,
      unitId: apUnit.id,
    },
    {
      mobile: '9000012346',
      name: 'Telangana State Incharge',
      role: RoleType.STATE_ADMIN,
      unitId: apUnit.id,
    },
    {
      mobile: '9000012347',
      name: 'Nalgonda Constituency Incharge',
      role: RoleType.CONSTITUENCY_INCHARGE,
      unitId: kondapiUnit.id,
    },
    {
      mobile: '9000012348',
      name: 'Nalgonda Mandal President',
      role: RoleType.MANDAL_INCHARGE,
    },
    {
      mobile: '9000012350',
      name: 'Booth President - Team 1',
      role: RoleType.BOOTH_PRESIDENT,
      unitId: primaryBooth?.unitId,
      boothId: primaryBooth?.id,
    },
    {
      mobile: '9000012351',
      name: 'Indiramma Incharge - Team 1',
      role: RoleType.VOTER_100_INCHARGE,
      unitId: primaryGroup?.unitId,
      voterGroupId: primaryGroup?.id,
    },
  ];

  const userMap: Record<string, any> = {};

  for (const u of seedUsers) {
    let user = await prisma.user.findFirst({ where: { mobileNumber: u.mobile } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          organisationId: org.id,
          userCode: `USR-${u.mobile.slice(-4)}-${u.role.slice(0, 4)}`,
          name: u.name,
          mobileNumber: u.mobile,
          role: u.role,
          accountStatus: 'ACTIVE',
          isVerified: true,
          unitId: u.unitId || null,
        },
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { name: u.name, role: u.role, unitId: u.unitId || user.unitId, accountStatus: 'ACTIVE', isVerified: true },
      });
    }
    userMap[u.mobile] = user;

    await prisma.userHierarchyAssignment.deleteMany({ where: { userId: user.id } });
    await prisma.userHierarchyAssignment.create({
      data: {
        userId: user.id,
        roleType: u.role,
        stateId: u.stateId || apState.id,
        zoneId: u.zoneId || null,
        parliamentId: u.parliamentId || null,
        constituencyId: u.constituencyId || null,
        mandalId: u.mandalId || null,
        villageId: u.villageId || null,
        boothId: u.boothId || null,
        voterGroupId: u.voterGroupId || null,
        isActive: true,
      },
    });

    if (([RoleType.VOTER_100_INCHARGE, RoleType.BOOTH_PRESIDENT, RoleType.VILLAGE_INCHARGE, RoleType.MANDAL_INCHARGE] as RoleType[]).includes(u.role)) {
      await prisma.cadre.upsert({
        where: { userId: user.id },
        update: { performanceScore: 92.5, totalAssignedVoters: 100, votedCoveredCount: 68 },
        create: {
          userId: user.id,
          performanceScore: 92.5,
          totalAssignedVoters: 100,
          votedCoveredCount: 68,
          skills: ['Door-to-door survey', 'Mobile App Pro', 'Voter Turnout Specialist'],
          badges: ['Top Performer', '100% Surveyed', 'Speedy Reporter'],
        },
      });
    }
  }
  console.log(`✅ Users & Hierarchy Assignments seeded (${seedUsers.length} users)`);

  const primary100Incharge = userMap['9848010003'];
  if (primary100Incharge && primaryGroup) {
    await prisma.voterGroup.update({
      where: { id: primaryGroup.id },
      data: { assignedInchargeId: primary100Incharge.id },
    });
  }

  // ─── 6. COMPREHENSIVE VOTER DATASET (1,200+ REALISTIC VOTERS) ─────────────
  console.log('⏳ Seeding 1,200+ authentic voters into Kondapi AC...');

  const FIRST_NAMES = [
    'Srinivasa Rao', 'Venkateswarlu', 'Ramanaiah', 'Subba Rao', 'Lakshmi Prasanna',
    'Ramanamma', 'Koteswara Rao', 'Prasad', 'Sivaiah', 'Satyanarayana',
    'Anjali Devi', 'Suresh Babu', 'Rajesh', 'Rama Devi', 'Venkata Krishna',
    'Chenchaiah', 'Krishnaiah', 'Malyadri', 'Saraswathi', 'Gopalakrishna',
    'Narayana', 'Bhavani', 'Sudhakar', 'Padmavathi', 'Chiranjeevi',
    'Ankamma Rao', 'Mastanaiah', 'Rajeswari', 'Venkata Ramana', 'Govindu',
  ];
  const LAST_NAMES = [
    'Gaddipati', 'Marella', 'Bollineni', 'Chundi', 'Yeluri',
    'Damarla', 'Nelaturi', 'Ravipudi', 'Dara', 'Mupparaju',
    'Nalamothu', 'Kolla', 'Myneni', 'Kakumanu', 'Gorantla',
    'Timmareddy', 'Kandula', 'Guntupalli', 'Vaddi', 'Penumaka',
  ];
  const CASTES = ['Kamma', 'Reddy', 'Kapu', 'SC (Madiga)', 'SC (Mala)', 'BC (Yadava)', 'BC (Gowda)', 'Muslim', 'Arya Vysya'];
  const PROFESSIONS = ['Agriculture / Farmer', 'Business Owner', 'Teacher', 'Homemaker', 'Software Engineer', 'Student', 'Daily Wage Worker', 'Healthcare / Nurse'];
  const PREFERENCES = ['TDP', 'TDP', 'TDP', 'YSRCP', 'YSRCP', 'JSP', 'BJP', 'Neutral'];

  await prisma.voter.deleteMany({ where: { epicNumber: { startsWith: 'KDP' } } });

  const voterBatch: any[] = [];
  const TOTAL_SEED_VOTERS = 1200;

  for (let i = 1; i <= TOTAL_SEED_VOTERS; i++) {
    const fn = FIRST_NAMES[i % FIRST_NAMES.length];
    const ln = LAST_NAMES[i % LAST_NAMES.length];
    const caste = CASTES[i % CASTES.length];
    const profession = PROFESSIONS[i % PROFESSIONS.length];
    const preference = PREFERENCES[i % PREFERENCES.length];
    const isVoted = i % 3 !== 0; // ~67% turnout
    const isMigrated = i % 12 === 0; // ~8% migrated
    const isFake = i === 45 || i === 88; // 2 flagged fake voters for testing

    const assignedGroup = allVoterGroups[i % allVoterGroups.length];
    const assignedBooth = assignedGroup?.booth || allBooths[i % allBooths.length];
    const assignedMandal = assignedGroup?.mandal;
    const assignedVillage = assignedGroup?.village;

    voterBatch.push({
      serialNumber: i,
      epicNumber: `KDP${String(1000000 + i * 17).slice(-7)}`,
      name: `${ln} ${fn}`,
      fatherHusbandName: `${ln} ${FIRST_NAMES[(i + 7) % FIRST_NAMES.length]}`,
      relationType: i % 4 === 0 ? RelationType.HUSBAND : RelationType.FATHER,
      houseNumber: `D.No. ${Math.floor(i / 10) + 1}-${(i % 8) + 12}`,
      age: 20 + (i % 60),
      gender: i % 2 === 0 ? Gender.MALE : Gender.FEMALE,
      mobileNumber: `9848${String(100000 + i * 29).slice(-6)}`,
      stateId: apState.id,
      zoneId: prakasamZone.id,
      parliamentId: ongoleParliament.id,
      constituencyId: kondapiAC.id,
      mandalId: assignedMandal?.id || null,
      villageId: assignedVillage?.id || null,
      boothId: assignedBooth?.id || null,
      voterGroupId: assignedGroup?.id || null,
      unitId: assignedGroup?.unitId || assignedBooth?.unitId || kondapiUnit.id,
      assignedInchargeId: primary100Incharge?.id || null,
      caste,
      subCaste: caste,
      profession,
      politicalPreference: preference,
      voterStatus: isFake ? VoterStatus.FAKE : VoterStatus.ACTIVE,
      surveyStatus: SurveyStatus.SURVEYED,
      locationStatus: isMigrated ? VoterLocationStatus.MIGRATED : VoterLocationStatus.LOCAL,
      voterLocationStatus: isMigrated ? VoterLocationStatus.MIGRATED : VoterLocationStatus.LOCAL,
      migrationCity: isMigrated ? (i % 2 === 0 ? 'Hyderabad' : 'Bengaluru') : null,
      currentLocation: isMigrated ? (i % 2 === 0 ? 'Hyderabad' : 'Bengaluru') : 'Local',
      voteStatus: isVoted ? VoteStatus.VOTE_DONE : VoteStatus.NOT_VOTED,
      voteDoneAt: isVoted ? new Date(Date.now() - (i % 3600) * 1000) : null,
      voteDoneTime: isVoted ? new Date(Date.now() - (i % 3600) * 1000) : null,
      inchargeAssessment: preference,
      notes: isFake ? 'Duplicate voter card flagged by Booth Incharge' : 'Cadre verified active local voter',
    });
  }

  for (let c = 0; c < voterBatch.length; c += 200) {
    const chunk = voterBatch.slice(c, c + 200);
    await prisma.voter.createMany({ data: chunk });
  }
  console.log(`✅ Seeded ${voterBatch.length} voters with full demographic & polling metadata`);

  // ─── 7. LIVE VOTE EVENTS (Real-Time Telemetry) ───────────────────────────
  const votedVoters = await prisma.voter.findMany({
    where: { voteStatus: VoteStatus.VOTE_DONE },
    take: 20,
    orderBy: { updatedAt: 'desc' },
  });
  if (votedVoters.length > 0 && primary100Incharge) {
    await prisma.liveVoteEvent.deleteMany();
    await prisma.liveVoteEvent.createMany({
      data: votedVoters.slice(0, 15).map((v, idx) => ({
        previousStatus: VoteStatus.NOT_VOTED,
        nextStatus: VoteStatus.VOTE_DONE,
        voterId: v.id,
        unitId: v.unitId,
        inchargeId: primary100Incharge.id,
        changedAt: new Date(Date.now() - (idx + 1) * 120000),
      })),
    });
    console.log('✅ Live Vote Events recorded for realtime telemetry (15 events)');
  }

  // ─── 8. TASKS ─────────────────────────────────────────────────────────────
  await prisma.task.deleteMany();
  const mlaUser = userMap['9848012345'];
  const taskData = [
    {
      title: 'Complete 100% Door-to-Door Voter Verification — All Mandals',
      description: 'Verify phone number, resident status, and government scheme eligibility for all assigned voters.',
      priority: TaskPriority.HIGH,
      status: TaskStatus.IN_PROGRESS,
      targetLevel: OrgHierarchyLevel.CONSTITUENCY,
      assignedBy: mlaUser?.name || 'Dr. Dola Bala Veeranjaneya Swamy',
      dueDate: new Date(Date.now() + 7 * 86400000),
      constituencyId: kondapiAC.id,
      unitId: kondapiUnit.id,
      assigneeId: primary100Incharge?.id,
    },
    {
      title: 'Deploy Migration Transport Desks for Hyderabad/Bengaluru Returnees',
      description: 'Coordinate buses and reception desks at Singarayakonda Railway Station and Tangutur Bus Stand.',
      priority: TaskPriority.URGENT,
      status: TaskStatus.PENDING,
      targetLevel: OrgHierarchyLevel.MANDAL,
      assignedBy: mlaUser?.name || 'Dr. Dola Bala Veeranjaneya Swamy',
      dueDate: new Date(Date.now() + 3 * 86400000),
      constituencyId: kondapiAC.id,
      unitId: kondapiUnit.id,
    },
    {
      title: 'Fake Voter EC Objection Filing — Chinna Venkanna Palem',
      description: 'Submit formal EC Form-7 objection for 2 identified duplicate EPIC clusters.',
      priority: TaskPriority.HIGH,
      status: TaskStatus.COMPLETED,
      targetLevel: OrgHierarchyLevel.BOOTH,
      assignedBy: mlaUser?.name || 'Dr. Dola Bala Veeranjaneya Swamy',
      dueDate: new Date(Date.now() - 86400000),
      constituencyId: kondapiAC.id,
      unitId: kondapiUnit.id,
    },
    {
      title: 'BC & Farmer Outreach Drive — Marripudi & Jarugumalli',
      description: 'Conduct doorstep interaction meetings on agricultural power and irrigation canal progress.',
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.PENDING,
      targetLevel: OrgHierarchyLevel.VILLAGE,
      assignedBy: mlaUser?.name || 'Dr. Dola Bala Veeranjaneya Swamy',
      dueDate: new Date(Date.now() + 5 * 86400000),
      constituencyId: kondapiAC.id,
      unitId: kondapiUnit.id,
    },
  ];

  for (const t of taskData) {
    const task = await prisma.task.create({ data: t });
    if (primary100Incharge) {
      await prisma.taskAssignment.create({
        data: { taskId: task.id, userId: primary100Incharge.id, status: t.status },
      });
    }
  }
  console.log(`✅ Tasks seeded (${taskData.length})`);

  // ─── 9. TRAINING VIDEOS & PROGRESS ────────────────────────────────────────
  await prisma.trainingVideo.deleteMany();
  const videos = [
    {
      title: 'Kondapi Connect App — Field Worker & Incharge Guide',
      description: 'Step-by-step walkthrough for Booth Presidents and 100-Voter Incharges on marking votes and reporting.',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      duration: '14 mins',
      category: 'APP_TRAINING',
      sortOrder: 1,
    },
    {
      title: 'Election Day Live Vote Tracking Protocol',
      description: 'Standard Operating Procedure for real-time voter turnout tracking and polling station monitoring.',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      duration: '20 mins',
      category: 'ELECTION_PROCEDURE',
      sortOrder: 2,
    },
    {
      title: 'Identifying Fake & Duplicate Voters',
      description: 'Guidelines on spotting illegal voter roll alterations and submitting Form-7 objections.',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      duration: '12 mins',
      category: 'ELECTION_PROCEDURE',
      sortOrder: 3,
    },
    {
      title: 'Kondapi Demographics & Community Outreach Strategy',
      description: 'Understanding BC/SC/Kapu community priorities and voter sentiment dynamics across 6 mandals.',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      duration: '16 mins',
      category: 'STRATEGY',
      sortOrder: 4,
    },
  ];

  for (const v of videos) {
    const video = await prisma.trainingVideo.create({ data: v });
    if (primary100Incharge) {
      await prisma.trainingProgress.create({
        data: {
          userId: primary100Incharge.id,
          videoId: video.id,
          status: v.sortOrder === 1 ? TrainingStatus.COMPLETED : TrainingStatus.ASSIGNED,
          quizScore: v.sortOrder === 1 ? 95 : null,
          completedAt: v.sortOrder === 1 ? new Date() : null,
        },
      });
    }
  }
  console.log('✅ Training Videos & Progress seeded (4)');

  // ─── 10. GROUND REPORTS & POLLING REPORTS ─────────────────────────────────
  await prisma.groundReport.deleteMany();
  await prisma.pollingReport.deleteMany();

  if (mlaUser) {
    await prisma.groundReport.createMany({
      data: [
        {
          reportType: GroundReportType.GENERAL_UPDATE,
          priority: TaskPriority.MEDIUM,
          description: 'Strong youth turnout and enthusiastic reception during Kondapi Village padayatra. Over 1,500 supporters attended evening meeting.',
          issueCategory: 'CAMPAIGN_UPDATE',
          status: GroundReportStatus.RESOLVED,
          constituencyId: kondapiAC.id,
          unitId: kondapiUnit.id,
          createdById: mlaUser.id,
        },
        {
          reportType: GroundReportType.COMPLAINT_ISSUE,
          priority: TaskPriority.HIGH,
          description: 'Drinking water pipeline leakage reported near Singarayakonda Bus Stop affecting 40 households. RWS department notified.',
          issueCategory: 'PUBLIC_INFRASTRUCTURE',
          affectedVotersCount: 160,
          status: GroundReportStatus.IN_PROGRESS,
          constituencyId: kondapiAC.id,
          unitId: kondapiUnit.id,
          createdById: mlaUser.id,
        },
        {
          reportType: GroundReportType.COMPLAINT_ISSUE,
          priority: TaskPriority.URGENT,
          description: 'Chinna Venkanna Palem Booth 103: 2 duplicate EPIC entries detected sharing identical address with mismatched father names.',
          issueCategory: 'VOTER_ROLL_TAMPERING',
          affectedVotersCount: 2,
          status: GroundReportStatus.PENDING,
          constituencyId: kondapiAC.id,
          unitId: kondapiUnit.id,
          createdById: mlaUser.id,
        },
      ],
    });

    await prisma.pollingReport.createMany({
      data: [
        {
          mandalName: 'Kondapi Mandal',
          boothLabel: 'Booth 101 - ZPHS Main Hall',
          reporterName: 'Marella Venkateswarlu',
          tdpVotes: 512,
          ysrcpVotes: 340,
          jspVotes: 85,
          bjpVotes: 32,
          incVotes: 14,
          othersVotes: 12,
          totalVotes: 995,
          boothId: primaryBooth?.id,
          unitId: primaryBooth?.unitId,
          createdById: mlaUser.id,
        },
        {
          mandalName: 'Tangutur Mandal',
          boothLabel: 'Booth 145 - High School Room 1',
          reporterName: 'K. Srinivasa Rao',
          tdpVotes: 610,
          ysrcpVotes: 420,
          jspVotes: 95,
          bjpVotes: 40,
          incVotes: 10,
          othersVotes: 15,
          totalVotes: 1190,
          unitId: kondapiUnit.id,
          createdById: mlaUser.id,
        },
      ],
    });
    console.log('✅ Ground Reports & Polling Reports seeded');
  }

  // ─── 11. AI STRATEGIC INTELLIGENCE, NEWS & PROJECTIONS ─────────────────────
  await prisma.aIInsight.deleteMany();
  await prisma.newsArticle.deleteMany();
  await prisma.socialTrend.deleteMany();
  await prisma.electionProjection.deleteMany();

  await prisma.aIInsight.createMany({
    data: [
      {
        constituencyId: kondapiAC.id,
        category: 'TURNOUT_PREDICTION',
        title: 'Kondapi AC: 78.6% Projected Turnout — High Margin Advantage in Tangutur & Singarayakonda',
        content: 'Door-to-door verification indicates TDP alliance has consolidated 58.4% voter preference across Tangutur and Kondapi mandals. Swing voters in Jarugumalli require focused contact.',
        sentimentScore: 0.89,
        recommendedAction: 'Deploy transport volunteers for 2,400 confirmed returnees from Hyderabad and Ongole.',
        tags: ['TurnoutPrediction', 'Kondapi2026', 'TDPAlliance'],
      },
      {
        constituencyId: kondapiAC.id,
        category: 'CASTE_DYNAMICS',
        title: 'BC & Kapu Communities Consolidating Strongly Behind TDP-JSP Alliance (64%)',
        content: 'Field assessments show 64% preference among Backward Classes and 72% among Kapu voters in Singarayakonda and Ponnaluru mandals. SC community outreach progressing positively in Chinna Venkanna Palem.',
        sentimentScore: 0.82,
        recommendedAction: 'Hold direct interaction with agricultural labor unions in Marripudi Mandal.',
        tags: ['CasteDynamics', 'BCCommunities', 'FieldSurvey'],
      },
      {
        constituencyId: kondapiAC.id,
        category: 'FAKE_VOTER_DETECTION',
        title: 'Zero-Tolerance Duplicate EPIC Cluster Resolved in Chinna Venkanna Palem',
        content: 'Automated cross-booth analysis flagged 2 duplicate EPIC entries. Incharge verified and filed Form-7 objections.',
        sentimentScore: 0.95,
        recommendedAction: 'Audit neighboring booths in Jarugumalli for similar address transpositions.',
        tags: ['FakeVoters', 'Audit', 'Integrity'],
      },
    ],
  });

  await prisma.newsArticle.createMany({
    data: [
      {
        constituencyId: kondapiAC.id,
        headline: 'MLA Dr. Dola Bala Veeranjaneya Swamy Inspects High School Modernization in Tangutur',
        sourceName: 'Eenadu Prakasam',
        articleUrl: 'https://eenadu.net',
        snippet: 'Kondapi MLA inspected ongoing laboratory and digital classroom installations worth ₹45 Lakhs under government development grants.',
        sentiment: 'POSITIVE',
      },
      {
        constituencyId: kondapiAC.id,
        headline: 'Prakasam District Collector Releases Special Irrigation Funds for Kondapi & Jarugumalli',
        sourceName: 'Andhra Jyothy',
        articleUrl: 'https://andhrajyothy.com',
        snippet: '₹2.4 Crore sanctioned for canal desilting and drinking water pipelines ahead of summer season.',
        sentiment: 'POSITIVE',
      },
    ],
  });

  await prisma.socialTrend.createMany({
    data: [
      {
        constituencyId: kondapiAC.id,
        hashtag: '#KondapiTDPConnect',
        platform: 'X / Twitter',
        mentionCount: 14200,
        sentimentPct: 88.5,
        trendingRank: 1,
      },
      {
        constituencyId: kondapiAC.id,
        hashtag: '#DrDolaBalaMLA',
        platform: 'WhatsApp & Instagram',
        mentionCount: 9800,
        sentimentPct: 91.0,
        trendingRank: 2,
      },
    ],
  });

  await prisma.electionProjection.create({
    data: {
      constituencyId: kondapiAC.id,
      totalElectorate: 228450,
      projectedTurnout: 78.6,
      leadingPartyCode: 'TDP',
      leadMarginVotes: 24500,
      confidenceScore: 0.94,
      insightsSummary: 'TDP Alliance maintains clear commanding lead of +14.2% over nearest rival across 5 of 6 mandals.',
      scenarioData: {
        winningMandals: ['Kondapi', 'Tangutur', 'Singarayakonda', 'Ponnaluru', 'Marripudi'],
        closeMandals: ['Jarugumalli'],
      },
    },
  });
  console.log('✅ AI Strategic Intelligence, News, Trends & Projections seeded');

  // ─── 12. NOTIFICATIONS & ANNOUNCEMENTS ─────────────────────────────────────
  await prisma.announcement.deleteMany();
  await prisma.notification.deleteMany();

  await prisma.announcement.createMany({
    data: [
      {
        title: '🚨 Election War Room Activated — Live Polling Telemetry Operational',
        content: 'All Booth Presidents and 100-Voter Incharges must keep mobile app open for live vote marking.',
        priority: TaskPriority.URGENT,
        targetLevel: OrgHierarchyLevel.CONSTITUENCY,
      },
      {
        title: '🚌 Hyderabad & Bengaluru Free Return Transport Schedule Published',
        content: 'Buses depart from Kukatpally and Majestic on Friday evening. Contact Mandal Transport Incharges.',
        priority: TaskPriority.HIGH,
        targetLevel: OrgHierarchyLevel.VOTER_GROUP,
      },
    ],
  });

  if (primary100Incharge) {
    await prisma.notification.createMany({
      data: [
        {
          type: 'TASK_ASSIGNED',
          title: 'New Voter Verification Task Assigned',
          message: 'Dr. Dola Bala Veeranjaneya Swamy assigned you: Complete Door-to-Door Voter Verification.',
          userId: primary100Incharge.id,
        },
        {
          type: 'ALERT_TRIGGERED',
          title: 'Voter Group 92% Turnout Milestone Achieved!',
          message: 'Congratulations! Team 01 has crossed 65 confirmed votes out of 100.',
          userId: primary100Incharge.id,
        },
      ],
    });
  }
  console.log('✅ Notifications & Announcements seeded');

  // ─── FINAL SUMMARY ────────────────────────────────────────────────────────
  const counts = {
    states: await prisma.state.count(),
    zones: await prisma.zone.count(),
    parliaments: await prisma.parliament.count(),
    constituencies: await prisma.constituency.count(),
    mandals: await prisma.mandal.count(),
    villages: await prisma.village.count(),
    booths: await prisma.booth.count(),
    voterGroups: await prisma.voterGroup.count(),
    organizationUnits: await prisma.organizationUnit.count(),
    users: await prisma.user.count(),
    voters: await prisma.voter.count(),
    votersVoted: await prisma.voter.count({ where: { voteStatus: VoteStatus.VOTE_DONE } }),
    tasks: await prisma.task.count(),
    trainingVideos: await prisma.trainingVideo.count(),
    groundReports: await prisma.groundReport.count(),
    pollingReports: await prisma.pollingReport.count(),
    aiInsights: await prisma.aIInsight.count(),
    parties: await prisma.politicalParty.count(),
  };

  console.log('\n======================================================');
  console.log('🎉 COMPREHENSIVE ENTERPRISE SEED COMPLETE!');
  console.log('======================================================');
  Object.entries(counts).forEach(([k, v]) => console.log(`  ${k.padEnd(22)}: ${v}`));
  console.log('======================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
