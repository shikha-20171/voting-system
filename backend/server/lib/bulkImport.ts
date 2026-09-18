import {
  Gender,
  ImportJobStatus,
  Prisma,
  RelationType,
  SurveyStatus,
  VoteStatus,
  VoterLocationStatus,
  VoterStatus,
} from '@prisma/client';
import { prisma } from './prisma.js';

export interface VoterImportRow {
  serialNumber?: number;
  epicNumber: string;
  name: string;
  fatherHusbandName?: string;
  relationType?: string;
  houseNumber?: string;
  age?: number;
  gender?: string;
  mobileNumber?: string;
  caste?: string;
  subCaste?: string;
  profession?: string;
  politicalPreference?: string;
  voterStatus?: string;
  fakeReason?: string;
  surveyStatus?: string;
  voterLocationStatus?: string;
  currentLocation?: string;
  voteStatus?: string;
  notes?: string;
  assignedInchargeUserCode?: string;
  voterGroupCode?: string;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === ',' && !inQuotes) {
      result.push(current.trim());
      continue;
    }
    current += char;
  }

  result.push(current.trim());
  return result;
}

export function parseVoterCsv(csvText: string): VoterImportRow[] {
  const lines = csvText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map((header) => header.toLowerCase().replace(/\s+/g, '_'));
  const rows: VoterImportRow[] = [];

  for (let index = 1; index < lines.length; index += 1) {
    const values = parseCsvLine(lines[index]);
    const row: Record<string, string> = {};
    headers.forEach((header, headerIndex) => {
      row[header] = values[headerIndex] ?? '';
    });

    rows.push({
      serialNumber: row.serial_number ? Number(row.serial_number) : index,
      epicNumber: row.epic_number || row.epic || '',
      name: row.name || '',
      fatherHusbandName: row.father_husband_name || row.guardian || '',
      relationType: row.relation_type || 'Father',
      houseNumber: row.house_number || '',
      age: row.age ? Number(row.age) : undefined,
      gender: row.gender || 'Male',
      mobileNumber: row.mobile_number || row.mobile || '',
      caste: row.caste || undefined,
      subCaste: row.sub_caste || undefined,
      profession: row.profession || undefined,
      politicalPreference: row.political_preference || row.preference || undefined,
      voterStatus: row.voter_status || undefined,
      fakeReason: row.fake_reason || undefined,
      surveyStatus: row.survey_status || undefined,
      voterLocationStatus: row.voter_location_status || row.location_status || undefined,
      currentLocation: row.current_location || undefined,
      voteStatus: row.vote_status || undefined,
      notes: row.notes || undefined,
      assignedInchargeUserCode: row.assigned_incharge_user_code || row.incharge_code || undefined,
      voterGroupCode: row.voter_group_code || row.unit_code || undefined,
    });
  }

  return rows.filter((row) => row.epicNumber && row.name);
}

function normalizeEnumValue<T extends Record<string, string>>(value: string | undefined, enumObj: T, fallback: T[keyof T]) {
  if (!value) return fallback;
  const upper = value.toUpperCase().replace(/\s+/g, '_');
  return (enumObj[upper as keyof T] ?? fallback) as T[keyof T];
}

export async function processVoterImportJob(jobId: string) {
  const job = await prisma.importJob.findUnique({ where: { id: jobId } });
  if (!job) return;

  const rows = ((job.payload ?? job.errors) as { rows?: VoterImportRow[] } | null)?.rows;
  if (!rows?.length) {
    await prisma.importJob.update({
      where: { id: jobId },
      data: {
        status: ImportJobStatus.FAILED,
        errorCount: 1,
        errors: { message: 'No import rows found' },
        completedAt: new Date(),
      },
    });
    return;
  }

  await prisma.importJob.update({
    where: { id: jobId },
    data: {
      status: ImportJobStatus.PROCESSING,
      startedAt: new Date(),
      totalRows: rows.length,
    },
  });

  const [units, users] = await Promise.all([
    prisma.organizationUnit.findMany(),
    prisma.user.findMany(),
  ]);
  const unitByCode = new Map(units.map((unit: any) => [unit.code ?? '', unit]));
  const userByCode = new Map(users.map((user: any) => [user.userCode, user]));
  const defaultIncharge = users.find((user: any) => user.role === 'VOTER_100_INCHARGE');

  const importErrors: Array<{ row: number; epicNumber: string; message: string }> = [];
  let successCount = 0;

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    try {
      const targetUnit = row.voterGroupCode ? unitByCode.get(row.voterGroupCode) : units.find((unit: any) => unit.id === job.unitId);
      if (!targetUnit) {
        throw new Error('Target voter group not found');
      }

      const incharge = row.assignedInchargeUserCode
        ? userByCode.get(row.assignedInchargeUserCode)
        : defaultIncharge;

      if (!incharge) {
        throw new Error('Assigned incharge not found');
      }

      const relation = normalizeEnumValue(row.relationType, RelationType, RelationType.FATHER);
      const gender = normalizeEnumValue(row.gender, Gender, Gender.MALE);

      const data: Prisma.VoterCreateInput = {
        serialNumber: row.serialNumber ?? index + 1,
        epicNumber: row.epicNumber,
        name: row.name,
        fatherHusbandName: row.fatherHusbandName || 'Unknown',
        relationType: relation,
        houseNumber: row.houseNumber || '-',
        age: row.age ?? 18,
        gender,
        mobileNumber: row.mobileNumber || null,
        caste: row.caste || null,
        subCaste: row.subCaste || null,
        profession: row.profession || null,
        politicalPreference: row.politicalPreference || 'NEUTRAL',
        voterStatus: normalizeEnumValue(row.voterStatus, VoterStatus, VoterStatus.ACTIVE),
        surveyStatus: normalizeEnumValue(row.surveyStatus, SurveyStatus, SurveyStatus.NOT_SURVEYED),
        voterLocationStatus: normalizeEnumValue(row.voterLocationStatus, VoterLocationStatus, VoterLocationStatus.LOCAL),
        currentLocation: row.currentLocation || null,
        voteStatus: normalizeEnumValue(row.voteStatus, VoteStatus, VoteStatus.NOT_VOTED),
        notes: row.notes || null,
        unit: { connect: { id: targetUnit.id } },
        assignedIncharge: { connect: { id: incharge.id } },
      };

      await prisma.voter.upsert({
        where: { epicNumber: row.epicNumber },
        update: {
          name: data.name,
          fatherHusbandName: data.fatherHusbandName,
          relationType: data.relationType,
          houseNumber: data.houseNumber,
          age: data.age,
          gender: data.gender,
          mobileNumber: data.mobileNumber,
          caste: data.caste,
          subCaste: data.subCaste,
          profession: data.profession,
          politicalPreference: data.politicalPreference,
          voterStatus: data.voterStatus,
          surveyStatus: data.surveyStatus,
          voterLocationStatus: data.voterLocationStatus,
          currentLocation: data.currentLocation,
          voteStatus: data.voteStatus,
          notes: data.notes,
          unitId: targetUnit.id,
          assignedInchargeId: incharge.id,
        },
        create: data,
      });

      successCount += 1;
    } catch (error) {
      importErrors.push({
        row: index + 1,
        epicNumber: row.epicNumber,
        message: error instanceof Error ? error.message : 'Unknown row import error',
      });
    }
  }

  const finalStatus = importErrors.length === 0
    ? ImportJobStatus.COMPLETED
    : successCount > 0
      ? ImportJobStatus.COMPLETED
      : ImportJobStatus.FAILED;

  await prisma.importJob.update({
    where: { id: jobId },
    data: {
      status: finalStatus,
      successCount,
      errorCount: importErrors.length,
      errors: importErrors.length ? (importErrors as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
      completedAt: new Date(),
    },
  });
}
