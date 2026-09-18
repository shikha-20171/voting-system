import {
  Gender,
  OrgHierarchyLevel,
  Prisma,
  RelationType,
  SurveyStatus,
  VoterLocationStatus,
  VoterStatus,
  VoteStatus,
} from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

export interface RawVoterRow {
  serialNumber?: number | string;
  epicNumber?: string;
  epic?: string;
  name?: string;
  fullName?: string;
  fatherHusbandName?: string;
  relativeName?: string;
  relationType?: string;
  gender?: string;
  age?: number | string;
  houseNumber?: string;
  doorNo?: string;
  mobileNumber?: string;
  phone?: string;
  mandal?: string;
  mandalName?: string;
  village?: string;
  villageName?: string;
  panchayat?: string;
  boothNumber?: string | number;
  booth?: string | number;
  pollingStation?: string;
  voterGroup?: string;
  cluster?: string;
  team?: string;
  caste?: string;
  subCaste?: string;
  profession?: string;
  occupation?: string;
  politicalPreference?: string;
  voterStatus?: string;
  voterLocationStatus?: string;
  locationStatus?: string;
  currentLocation?: string;
  migrationCity?: string;
  notes?: string;
  remarks?: string;
}

export class BulkUploadService {
  static async importVotersFromData(constituencyId: string, rows: RawVoterRow[], _actorId?: string) {
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new Error('No voter data rows provided in upload.');
    }

    // 1. Resolve Target Constituency & Ancestors
    let constituency = await prisma.constituency.findUnique({
      where: { id: constituencyId },
      include: {
        parliament: {
          include: {
            zone: {
              include: { state: true },
            },
          },
        },
      },
    });

    if (!constituency) {
      constituency = await prisma.constituency.findFirst({
        include: {
          parliament: {
            include: {
              zone: {
                include: { state: true },
              },
            },
          },
        },
      });
    }

    if (!constituency) {
      throw new Error('Target Assembly Constituency could not be found.');
    }

    const stateId = constituency.parliament.zone.state.id;
    const zoneId = constituency.parliament.zone.id;
    const parliamentId = constituency.parliament.id;

    // Find constituency organization unit
    let constUnit = await prisma.organizationUnit.findFirst({
      where: { name: constituency.name, level: OrgHierarchyLevel.CONSTITUENCY },
    });

    if (!constUnit) {
      constUnit = await prisma.organizationUnit.create({
        data: {
          name: constituency.name,
          code: constituency.code,
          level: OrgHierarchyLevel.CONSTITUENCY,
          totalVoters: 228000,
        },
      });
    }

    // 2. Pre-load hierarchy caches for efficient batch resolution
    const existingMandals = await prisma.mandal.findMany({
      where: { constituencyId: constituency.id },
    });
    const mandalMap = new Map<string, { id: string; name: string }>();
    for (const m of existingMandals) {
      mandalMap.set(m.name.trim().toLowerCase(), { id: m.id, name: m.name });
    }

    const existingVillages = await prisma.village.findMany({
      where: { mandal: { constituencyId: constituency.id } },
    });
    const villageMap = new Map<string, { id: string; name: string; mandalId: string }>();
    for (const v of existingVillages) {
      villageMap.set(`${v.mandalId}:${v.name.trim().toLowerCase()}`, { id: v.id, name: v.name, mandalId: v.mandalId });
    }

    const existingBooths = await prisma.booth.findMany({
      where: { village: { mandal: { constituencyId: constituency.id } } },
    });
    const boothMap = new Map<string, { id: string; boothNumber: string; villageId: string }>();
    for (const b of existingBooths) {
      boothMap.set(`${b.villageId}:${String(b.boothNumber).trim().toLowerCase()}`, { id: b.id, boothNumber: b.boothNumber, villageId: b.villageId });
    }

    const existingGroups = await prisma.voterGroup.findMany({
      where: { booth: { village: { mandal: { constituencyId: constituency.id } } } },
    });
    const groupMap = new Map<string, { id: string; name: string; boothId: string }>();
    for (const g of existingGroups) {
      groupMap.set(`${g.boothId}:${g.name.trim().toLowerCase()}`, { id: g.id, name: g.name, boothId: g.boothId });
    }

    let mandalsCreated = 0;
    let villagesCreated = 0;
    let boothsCreated = 0;
    let voterGroupsCreated = 0;
    let newVotersAdded = 0;
    let votersUpdated = 0;

    // Helper: Normalize Gender
    const parseGender = (val?: string): Gender => {
      const g = (val || '').trim().toUpperCase();
      if (g.startsWith('F') || g === 'FEMALE') return Gender.FEMALE;
      if (g.startsWith('M') || g === 'MALE') return Gender.MALE;
      return Gender.OTHER;
    };

    // Helper: Normalize RelationType
    const parseRelation = (val?: string, gender?: Gender, age?: number): RelationType => {
      const r = (val || '').trim().toUpperCase();
      if (r.includes('HUSBAND') || r === 'H') return RelationType.HUSBAND;
      if (r.includes('MOTHER') || r === 'M') return RelationType.MOTHER;
      if (r.includes('FATHER') || r === 'F') return RelationType.FATHER;
      if (gender === Gender.FEMALE && (age || 0) > 23) return RelationType.HUSBAND;
      return RelationType.FATHER;
    };

    // Helper: Normalize Preference
    const parsePreference = (val?: string): string => {
      const p = (val || '').trim().toUpperCase();
      if (p.includes('TDP')) return 'TDP';
      if (p.includes('YSR')) return 'YSRCP';
      if (p.includes('JSP') || p.includes('JANASENA')) return 'JSP';
      if (p.includes('BJP')) return 'BJP';
      if (p.includes('INC') || p.includes('CONG')) return 'INC';
      return 'NEUTRAL';
    };

    // 3. Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const epic = String(row.epicNumber || row.epic || '').trim().toUpperCase();
      const rawName = String(row.name || row.fullName || '').trim();

      if (!epic || !rawName) {
        continue;
      }

      const mandalName = String(row.mandal || row.mandalName || 'Kondapi').trim();
      const villageName = String(row.village || row.villageName || row.panchayat || `${mandalName} Village`).trim();
      const boothRaw = String(row.boothNumber || row.booth || row.pollingStation || 'Booth 101').trim();
      const groupName = String(row.voterGroup || row.cluster || row.team || 'Team A (Voters 1-100)').trim();

      // Ensure Mandal
      const mandalKey = mandalName.toLowerCase();
      let mandalRecord = mandalMap.get(mandalKey);
      if (!mandalRecord) {
        const createdMandal = await prisma.mandal.create({
          data: {
            constituencyId: constituency.id,
            name: mandalName,
            code: `MDL-${mandalName.slice(0, 4).toUpperCase()}`,
            totalVoters: 38000,
          },
        });
        await prisma.organizationUnit.create({
          data: {
            name: mandalName,
            code: `MDL-${mandalName.slice(0, 4).toUpperCase()}`,
            level: OrgHierarchyLevel.MANDAL,
            parentId: constUnit.id,
          },
        });
        mandalRecord = { id: createdMandal.id, name: createdMandal.name };
        mandalMap.set(mandalKey, mandalRecord);
        mandalsCreated++;
      }

      // Ensure Village
      const villageKey = `${mandalRecord.id}:${villageName.toLowerCase()}`;
      let villageRecord = villageMap.get(villageKey);
      if (!villageRecord) {
        const mandalUnit = await prisma.organizationUnit.findFirst({
          where: { name: mandalRecord.name, level: OrgHierarchyLevel.MANDAL },
        });
        const createdVillage = await prisma.village.create({
          data: {
            mandalId: mandalRecord.id,
            name: villageName,
            code: `VIL-${villageName.slice(0, 4).toUpperCase()}`,
            totalVoters: 3500,
          },
        });
        await prisma.organizationUnit.create({
          data: {
            name: villageName,
            code: `VIL-${villageName.slice(0, 4).toUpperCase()}`,
            level: OrgHierarchyLevel.VILLAGE,
            parentId: mandalUnit?.id || constUnit.id,
          },
        });
        villageRecord = { id: createdVillage.id, name: createdVillage.name, mandalId: mandalRecord.id };
        villageMap.set(villageKey, villageRecord);
        villagesCreated++;
      }

      // Ensure Booth
      const boothNumberStr = boothRaw.startsWith('Booth') ? boothRaw : `Booth ${boothRaw}`;
      const boothKey = `${villageRecord.id}:${boothNumberStr.toLowerCase()}`;
      let boothRecord = boothMap.get(boothKey);
      if (!boothRecord) {
        const villageUnit = await prisma.organizationUnit.findFirst({
          where: { name: villageRecord.name, level: OrgHierarchyLevel.VILLAGE },
        });
        const createdBooth = await prisma.booth.create({
          data: {
            villageId: villageRecord.id,
            boothNumber: boothNumberStr,
            name: boothNumberStr,
            code: `B-${boothNumberStr.replace(/\D/g, '') || String(i + 1)}`,
            pollingStation: boothNumberStr,
            totalVoters: 1000,
          },
        });
        await prisma.organizationUnit.create({
          data: {
            name: boothNumberStr,
            code: `B-${boothNumberStr.replace(/\D/g, '') || String(i + 1)}`,
            level: OrgHierarchyLevel.BOOTH,
            parentId: villageUnit?.id || constUnit.id,
          },
        });
        boothRecord = { id: createdBooth.id, boothNumber: createdBooth.boothNumber, villageId: villageRecord.id };
        boothMap.set(boothKey, boothRecord);
        boothsCreated++;
      }

      // Ensure Voter Group
      const groupKey = `${boothRecord.id}:${groupName.toLowerCase()}`;
      let groupRecord = groupMap.get(groupKey);
      if (!groupRecord) {
        const boothUnit = await prisma.organizationUnit.findFirst({
          where: { name: boothRecord.boothNumber, level: OrgHierarchyLevel.BOOTH },
        });
        const createdGroup = await prisma.voterGroup.create({
          data: {
            boothId: boothRecord.id,
            name: groupName,
            code: `VG-${boothRecord.boothNumber.replace(/\D/g, '')}-${groupName.slice(0, 3).toUpperCase()}`,
            totalVoters: 100,
          },
        });
        const createdGroupUnit = await prisma.organizationUnit.create({
          data: {
            name: `${boothRecord.boothNumber} - ${groupName}`,
            code: `VG-${boothRecord.boothNumber.replace(/\D/g, '')}-${groupName.slice(0, 3).toUpperCase()}`,
            level: OrgHierarchyLevel.VOTER_GROUP,
            parentId: boothUnit?.id || constUnit.id,
          },
        });
        groupRecord = { id: createdGroup.id, name: createdGroup.name, boothId: boothRecord.id };
        groupMap.set(groupKey, groupRecord);
        voterGroupsCreated++;
      }

      const gender = parseGender(String(row.gender || 'M'));
      const age = Math.max(18, Math.min(115, parseInt(String(row.age || '35'), 10) || 35));
      const relationType = parseRelation(row.relationType, gender, age);
      const relativeName = String(row.fatherHusbandName || row.relativeName || `${rawName.split(' ')[0]} Relative`).trim();
      const houseNo = String(row.houseNumber || row.doorNo || `${(i % 20) + 1}-${10 + (i % 50)}`).trim();
      const mobile = String(row.mobileNumber || row.phone || `9848${String(100000 + (i * 13) % 899999)}`).trim();
      const preference = parsePreference(row.politicalPreference);
      const isMigrated = String(row.voterLocationStatus || row.locationStatus || '').toLowerCase().includes('migrat');
      const migrationCity = String(row.migrationCity || row.currentLocation || (isMigrated ? 'Hyderabad' : 'Local')).trim();

      const voterPayload: Prisma.VoterCreateInput = {
        serialNumber: parseInt(String(row.serialNumber || i + 1), 10) || i + 1,
        epicNumber: epic,
        name: rawName,
        fatherHusbandName: relativeName,
        relationType,
        houseNumber: houseNo,
        age,
        gender,
        mobileNumber: mobile,
        state: { connect: { id: stateId } },
        zone: { connect: { id: zoneId } },
        parliament: { connect: { id: parliamentId } },
        constituency: { connect: { id: constituency.id } },
        mandal: { connect: { id: mandalRecord.id } },
        village: { connect: { id: villageRecord.id } },
        booth: { connect: { id: boothRecord.id } },
        voterGroup: { connect: { id: groupRecord.id } },
        caste: String(row.caste || row.subCaste || 'General').trim(),
        subCaste: String(row.subCaste || row.caste || 'General').trim(),
        profession: String(row.profession || row.occupation || 'Agriculture').trim(),
        politicalPreference: preference,
        voterStatus: VoterStatus.ACTIVE,
        surveyStatus: SurveyStatus.SURVEYED,
        locationStatus: isMigrated ? VoterLocationStatus.MIGRATED : VoterLocationStatus.LOCAL,
        voterLocationStatus: isMigrated ? VoterLocationStatus.MIGRATED : VoterLocationStatus.LOCAL,
        currentLocation: migrationCity,
        migrationCity: isMigrated ? migrationCity : null,
        voteStatus: VoteStatus.NOT_VOTED,
        inchargeAssessment: preference,
        notes: String(row.notes || row.remarks || `Imported via CMS Excel Voter Roll for ${constituency.name}`).trim(),
      };

      const existingVoter = await prisma.voter.findUnique({
        where: { epicNumber: epic },
      });

      if (existingVoter) {
        await prisma.voter.update({
          where: { id: existingVoter.id },
          data: {
            name: rawName,
            fatherHusbandName: relativeName,
            relationType,
            houseNumber: houseNo,
            age,
            gender,
            mobileNumber: mobile,
            constituencyId: constituency.id,
            mandalId: mandalRecord.id,
            villageId: villageRecord.id,
            boothId: boothRecord.id,
            voterGroupId: groupRecord.id,
            caste: String(row.caste || row.subCaste || existingVoter.caste || 'General').trim(),
            subCaste: String(row.subCaste || row.caste || existingVoter.subCaste || 'General').trim(),
            profession: String(row.profession || row.occupation || existingVoter.profession || 'Agriculture').trim(),
            politicalPreference: preference,
            locationStatus: isMigrated ? VoterLocationStatus.MIGRATED : VoterLocationStatus.LOCAL,
            voterLocationStatus: isMigrated ? VoterLocationStatus.MIGRATED : VoterLocationStatus.LOCAL,
            currentLocation: migrationCity,
            migrationCity: isMigrated ? migrationCity : null,
            notes: String(row.notes || row.remarks || existingVoter.notes || '').trim(),
          },
        });
        votersUpdated++;
      } else {
        await prisma.voter.create({
          data: voterPayload,
        });
        newVotersAdded++;
      }
    }

    return {
      success: true,
      constituencyId: constituency.id,
      constituencyName: constituency.name,
      totalProcessed: rows.length,
      newVotersAdded,
      votersUpdated,
      mandalsCreated,
      villagesCreated,
      boothsCreated,
      voterGroupsCreated,
    };
  }
}
