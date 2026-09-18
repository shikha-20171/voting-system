import {
  AuditAction,
  Gender,
  ImportJobStatus,
  OrgHierarchyLevel,
  Prisma,
  RelationType,
  RoleType,
} from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { logAudit } from '../../middleware/audit.js';
import { UserHierarchyScope } from '../../common/types.js';

export interface RawImportRow {
  rowNumber?: number;
  epicNumber?: string;
  epic?: string;
  voterId?: string;
  name?: string;
  fullName?: string;
  relativeName?: string;
  fatherHusbandName?: string;
  relationType?: string;
  gender?: string;
  age?: number | string;
  houseNumber?: string;
  doorNo?: string;
  mobileNumber?: string;
  phone?: string;
  state?: string;
  parliament?: string;
  constituency?: string;
  mandal?: string;
  mandalName?: string;
  village?: string;
  villageName?: string;
  panchayat?: string;
  boothNumber?: string | number;
  booth?: string | number;
  voterGroup?: string;
  caste?: string;
  profession?: string;
  politicalPreference?: string;
  [key: string]: any;
}

export interface ValidationResult {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateCount: number;
  errors: {
    rowNumber: number;
    field: string;
    value?: any;
    message: string;
    suggestion: string;
  }[];
  preview: {
    rowNumber: number;
    state: string;
    parliament: string;
    constituency: string;
    mandal: string;
    village: string;
    booth: string;
    voterGroup: string;
    epicNumber: string;
    name: string;
    status: 'VALID' | 'WARNING' | 'ERROR';
    reason?: string;
  }[];
}

export class ApplicationsService {
  /**
   * Helper to resolve application configuration by ID, configKey, or fallback to default
   */
  static async resolveApplication(appIdOrKey: string): Promise<any> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(appIdOrKey);
    let config: any = await prisma.cMSConfiguration.findFirst({
      where: {
        OR: [
          ...(isUuid ? [{ id: appIdOrKey }, { organisationId: appIdOrKey }] : []),
          { configKey: appIdOrKey },
          { organisationName: { equals: appIdOrKey, mode: 'insensitive' } },
        ],
      },
      include: {
        organisation: {
          include: {
            states: {
              include: {
                zones: {
                  include: {
                    parliaments: {
                      include: {
                        constituencies: true,
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

    if (!config) {
      config = await prisma.cMSConfiguration.findFirst({
        where: { configKey: 'default' },
        include: {
          organisation: {
            include: {
              states: {
                include: {
                  zones: {
                    include: {
                      parliaments: {
                        include: {
                          constituencies: true,
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
    }

    if (!config) {
      throw new Error(`Application with identifier '${appIdOrKey}' not found.`);
    }

    return config;
  }

  /**
   * Return application's dynamic hierarchy tree and configured levels
   */
  static async getHierarchy(appId: string) {
    const config = await this.resolveApplication(appId);
    const activeLevels = Array.isArray(config.activeHierarchyLevels)
      ? (config.activeHierarchyLevels as string[])
      : ['CONSTITUENCY', 'MANDAL', 'VILLAGE', 'BOOTH', 'VOTER_GROUP'];

    const hierarchyLabels = (config.hierarchyLabels as Record<string, string>) || {
      STATE: 'State',
      ZONE: 'Zone',
      PARLIAMENT: 'Parliament',
      CONSTITUENCY: 'Constituency',
      MANDAL: 'Mandal',
      VILLAGE: 'Village',
      BOOTH: 'Booth',
      VOTER_GROUP: '100-Voter Incharge',
    };

    // Find state and parliament
    const stateName = config.stateName || 'Andhra Pradesh';
    const state = await prisma.state.findFirst({
      where: { name: { equals: stateName, mode: 'insensitive' } },
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

    // Also fetch all constituencies that match this state or org
    const allConstituencies = await prisma.constituency.findMany({
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
      orderBy: { name: 'asc' },
    });

    return {
      applicationId: config.id,
      configKey: config.configKey,
      appName: config.organisationName,
      appScope: config.appScope || 'SINGLE_MLA',
      activeHierarchyLevels: activeLevels,
      hierarchyLabels,
      state: state || null,
      constituencies: allConstituencies,
    };
  }

  /**
   * Return child nodes for cascading dropdowns
   */
  static async getHierarchyNodesByLevel(appId: string, level: string, parentId?: string) {
    await this.resolveApplication(appId);
    const upperLevel = level.toUpperCase();

    switch (upperLevel) {
      case 'STATE':
        return prisma.state.findMany({ orderBy: { name: 'asc' } });
      case 'ZONE':
        return prisma.zone.findMany({
          where: parentId ? { stateId: parentId } : undefined,
          orderBy: { name: 'asc' },
        });
      case 'PARLIAMENT':
        return prisma.parliament.findMany({
          where: parentId ? { zoneId: parentId } : undefined,
          orderBy: { name: 'asc' },
        });
      case 'CONSTITUENCY':
        return prisma.constituency.findMany({
          where: parentId ? { parliamentId: parentId } : undefined,
          orderBy: { name: 'asc' },
        });
      case 'MANDAL':
        return prisma.mandal.findMany({
          where: parentId ? { constituencyId: parentId } : undefined,
          orderBy: { name: 'asc' },
        });
      case 'VILLAGE':
        return prisma.village.findMany({
          where: parentId ? { mandalId: parentId } : undefined,
          orderBy: { name: 'asc' },
        });
      case 'BOOTH':
        return prisma.booth.findMany({
          where: parentId ? { villageId: parentId } : undefined,
          orderBy: { boothNumber: 'asc' },
        });
      case 'VOTER_GROUP':
        return prisma.voterGroup.findMany({
          where: parentId ? { boothId: parentId } : undefined,
          orderBy: { name: 'asc' },
        });
      default:
        return [];
    }
  }

  /**
   * Pre-flight validation of raw imported data before final database ingestion
   */
  static async validateData(
    appId: string,
    level: string,
    rows: RawImportRow[],
  ): Promise<ValidationResult> {
    const config = await this.resolveApplication(appId);
    const errors: ValidationResult['errors'] = [];
    const preview: ValidationResult['preview'] = [];

    const seenEpics = new Set<string>();
    const seenBoothsInVillage = new Set<string>();
    let duplicateCount = 0;
    let validRows = 0;

    // Pre-fetch existing voter EPICs in database to detect duplicates
    const allEpicsInFile = rows
      .map((r) => String(r.epicNumber || r.epic || r.voterId || '').trim().toUpperCase())
      .filter(Boolean);

    const existingDbEpics = new Set<string>();
    if (allEpicsInFile.length > 0) {
      const dbFound = await prisma.voter.findMany({
        where: { epicNumber: { in: allEpicsInFile.slice(0, 2000) } },
        select: { epicNumber: true },
      });
      dbFound.forEach((v) => existingDbEpics.add(v.epicNumber));
    }

    // Pre-fetch existing hierarchy for relational validation
    const dbConstituencies = await prisma.constituency.findMany({
      include: {
        parliament: { include: { zone: { include: { state: true } } } },
        mandals: {
          include: {
            villages: {
              include: {
                booths: true,
              },
            },
          },
        },
      },
    });

    const constituencyMap = new Map(dbConstituencies.map((c) => [c.name.trim().toLowerCase(), c]));
    const mandalMap = new Map<string, { id: string; constituencyId: string; name: string }>();
    const villageMap = new Map<string, { id: string; mandalId: string; name: string }>();
    const boothMap = new Map<string, { id: string; villageId: string; boothNumber: string }>();

    for (const c of dbConstituencies) {
      for (const m of c.mandals) {
        mandalMap.set(m.name.trim().toLowerCase(), { id: m.id, constituencyId: c.id, name: m.name });
        for (const v of m.villages) {
          villageMap.set(`${m.id}:${v.name.trim().toLowerCase()}`, { id: v.id, mandalId: m.id, name: v.name });
          for (const b of v.booths) {
            boothMap.set(`${v.id}:${String(b.boothNumber).trim().toLowerCase()}`, {
              id: b.id,
              villageId: v.id,
              boothNumber: b.boothNumber,
            });
          }
        }
      }
    }

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 1;
      let rowStatus: 'VALID' | 'WARNING' | 'ERROR' = 'VALID';
      const rowReasons: string[] = [];

      const rawEpic = String(row.epicNumber || row.epic || row.voterId || '').trim().toUpperCase();
      const rawName = String(row.fullName || row.name || '').trim();
      const rawAge = parseInt(String(row.age || '0'), 10);
      const rawGender = String(row.gender || '').trim().toUpperCase();
      const rawMandal = String(row.mandal || row.mandalName || '').trim();
      const rawVillage = String(row.village || row.villageName || row.panchayat || '').trim();
      const rawBooth = String(row.boothNumber || row.booth || '').trim();
      const rawGroup = String(row.voterGroup || row.cluster || '').trim();
      const rawConst = String(row.constituency || '').trim();
      const rawParl = String(row.parliament || config.parliamentName || '').trim();
      const rawState = String(row.state || config.stateName || 'Andhra Pradesh').trim();

      if (level === 'VOTER' || !level) {
        // Voter ID / EPIC validation
        if (!rawEpic) {
          errors.push({
            rowNumber: rowNum,
            field: 'epicNumber',
            message: 'EPIC / Voter ID number is missing',
            suggestion: 'Enter unique EPIC Number (e.g. AP01234567)',
          });
          rowReasons.push('Missing EPIC Number');
          rowStatus = 'ERROR';
        } else if (seenEpics.has(rawEpic)) {
          duplicateCount++;
          errors.push({
            rowNumber: rowNum,
            field: 'epicNumber',
            value: rawEpic,
            message: `Duplicate EPIC '${rawEpic}' inside uploaded file`,
            suggestion: 'Remove duplicate record from spreadsheet',
          });
          rowReasons.push('Duplicate EPIC in file');
          rowStatus = 'ERROR';
        } else if (existingDbEpics.has(rawEpic)) {
          rowStatus = (rowStatus as string) === 'ERROR' ? 'ERROR' : 'WARNING';
          rowReasons.push('EPIC already exists in database (will be updated)');
        }
        if (rawEpic) seenEpics.add(rawEpic);

        // Name validation
        if (!rawName) {
          errors.push({
            rowNumber: rowNum,
            field: 'fullName',
            message: 'Voter full name is required',
            suggestion: 'Enter citizen full legal name',
          });
          rowReasons.push('Missing Voter Name');
          rowStatus = 'ERROR';
        }

        // Age validation
        if (isNaN(rawAge) || rawAge < 18 || rawAge > 125) {
          errors.push({
            rowNumber: rowNum,
            field: 'age',
            value: row.age,
            message: `Invalid voter age '${row.age || 'empty'}'. Must be between 18 and 125`,
            suggestion: 'Provide legal voter age (>= 18)',
          });
          rowReasons.push('Invalid Age (<18 or >125)');
          rowStatus = 'ERROR';
        }

        // Hierarchy parent-child checks
        if (!rawMandal) {
          errors.push({
            rowNumber: rowNum,
            field: 'mandal',
            message: 'Mandal name is required',
            suggestion: 'Specify valid Mandal',
          });
          rowReasons.push('Missing Mandal');
          rowStatus = 'ERROR';
        }

        if (!rawVillage) {
          errors.push({
            rowNumber: rowNum,
            field: 'village',
            message: 'Village / Ward name is required',
            suggestion: 'Specify Village / Ward',
          });
          rowReasons.push('Missing Village');
          rowStatus = 'ERROR';
        }

        if (!rawBooth) {
          errors.push({
            rowNumber: rowNum,
            field: 'boothNumber',
            message: 'Booth Number is required for voter assignment',
            suggestion: 'Specify Booth Number (e.g. 101)',
          });
          rowReasons.push('Missing Booth');
          rowStatus = 'ERROR';
        }
      } else if (level === 'BOOTH') {
        if (!rawBooth) {
          errors.push({
            rowNumber: rowNum,
            field: 'boothNumber',
            message: 'Booth Number is required',
            suggestion: 'Specify Booth Number',
          });
          rowReasons.push('Missing Booth Number');
          rowStatus = 'ERROR';
        }
        if (!rawVillage) {
          errors.push({
            rowNumber: rowNum,
            field: 'village',
            message: 'Parent Village is required',
            suggestion: 'Specify Village name',
          });
          rowReasons.push('Missing Parent Village');
          rowStatus = 'ERROR';
        }
        const boothKey = `${rawVillage.toLowerCase()}:${rawBooth.toLowerCase()}`;
        if (seenBoothsInVillage.has(boothKey)) {
          duplicateCount++;
          errors.push({
            rowNumber: rowNum,
            field: 'boothNumber',
            value: rawBooth,
            message: `Booth ${rawBooth} is duplicated in village ${rawVillage}`,
            suggestion: 'Ensure unique booth numbers per village',
          });
          rowReasons.push('Duplicate Booth in Village');
          rowStatus = 'ERROR';
        }
        seenBoothsInVillage.add(boothKey);
      }

      if (rowStatus === 'VALID' || rowStatus === 'WARNING') {
        validRows++;
      }

      // Add to preview table (first 250 rows for performance)
      if (preview.length < 250) {
        preview.push({
          rowNumber: rowNum,
          state: rawState,
          parliament: rawParl,
          constituency: rawConst || 'Constituency',
          mandal: rawMandal,
          village: rawVillage,
          booth: rawBooth,
          voterGroup: rawGroup || 'Auto 100-Group',
          epicNumber: rawEpic || '—',
          name: rawName || '—',
          status: rowStatus,
          reason: rowReasons.length > 0 ? rowReasons.join('; ') : 'Valid record ready for ingestion',
        });
      }
    }

    return {
      totalRows: rows.length,
      validRows,
      invalidRows: rows.length - validRows,
      duplicateCount,
      errors: errors.slice(0, 500),
      preview,
    };
  }

  /**
   * Transactional import of validated data into database hierarchy & voter tables
   */
  static async importData(
    appId: string,
    level: string,
    rows: RawImportRow[],
    options: {
      importMode?: 'APPEND' | 'REPLACE';
      voterGroupSize?: number;
      fileName?: string;
    },
    actorId?: string,
  ) {
    const config = await this.resolveApplication(appId);
    const mode = options.importMode || 'APPEND';
    const groupSize = options.voterGroupSize || 100;
    const fileName = options.fileName || 'voter_data_import.xlsx';

    // Find default user if actorId is not provided
    let creatorId = actorId;
    if (!creatorId) {
      const adminUser = await prisma.user.findFirst({
        where: { role: RoleType.SUPER_ADMIN },
      });
      creatorId = adminUser?.id || (await prisma.user.findFirst())?.id;
    }

    if (!creatorId) {
      throw new Error('Valid user identity is required to perform data import.');
    }

    // 1. Create ImportJob record
    const job = await prisma.importJob.create({
      data: {
        fileName,
        status: ImportJobStatus.PROCESSING,
        totalRows: rows.length,
        createdById: creatorId,
        startedAt: new Date(),
        payload: {
          applicationId: config.id,
          appName: config.organisationName,
          level,
          importMode: mode,
          groupSize,
        } as unknown as Prisma.InputJsonValue,
      },
    });

    try {
      // 2. Resolve or create target Constituency
      let constituency = await prisma.constituency.findFirst({
        where: {
          OR: [
            { name: { contains: config.organisationName, mode: 'insensitive' } },
            { name: { contains: config.headerTitle || '', mode: 'insensitive' } },
          ],
        },
        include: { parliament: { include: { zone: { include: { state: true } } } } },
      });

      if (!constituency) {
        constituency = await prisma.constituency.findFirst({
          include: { parliament: { include: { zone: { include: { state: true } } } } },
        });
      }

      if (!constituency) {
        let state = await prisma.state.findFirst();
        if (!state) {
          state = await prisma.state.create({
            data: { name: config.stateName || 'Andhra Pradesh', code: 'AP', totalVoters: 40000000 },
          });
        }
        let zone = await prisma.zone.findFirst();
        if (!zone) {
          zone = await prisma.zone.create({ data: { stateId: state.id, name: 'Central Zone', code: 'CZ' } });
        }
        let par = await prisma.parliament.findFirst();
        if (!par) {
          par = await prisma.parliament.create({
            data: { zoneId: zone.id, name: config.parliamentName || 'Main Parliament', code: 'PC-MAIN' },
          });
        }
        constituency = await prisma.constituency.create({
          data: {
            parliamentId: par.id,
            name: config.organisationName || 'Main Constituency',
            code: 'AC-MAIN',
            totalVoters: 228000,
          },
          include: { parliament: { include: { zone: { include: { state: true } } } } },
        });
      }

      if (mode === 'REPLACE' && level === 'VOTER') {
        await prisma.voter.deleteMany({
          where: { constituencyId: constituency.id },
        });
      }

      // Hierarchy lookup caches
      const existingMandals = await prisma.mandal.findMany({ where: { constituencyId: constituency.id } });
      const mandalMap = new Map<string, string>(existingMandals.map((m) => [m.name.trim().toLowerCase(), m.id]));

      const existingVillages = await prisma.village.findMany({
        where: { mandal: { constituencyId: constituency.id } },
      });
      const villageMap = new Map<string, string>(
        existingVillages.map((v) => [`${v.mandalId}:${v.name.trim().toLowerCase()}`, v.id]),
      );

      const existingBooths = await prisma.booth.findMany({
        where: { village: { mandal: { constituencyId: constituency.id } } },
      });
      const boothMap = new Map<string, string>(
        existingBooths.map((b) => [`${b.villageId}:${String(b.boothNumber).trim().toLowerCase()}`, b.id]),
      );

      const existingGroups = await prisma.voterGroup.findMany({
        where: { booth: { village: { mandal: { constituencyId: constituency.id } } } },
      });
      const groupMap = new Map<string, string>(
        existingGroups.map((g) => [`${g.boothId}:${g.name.trim().toLowerCase()}`, g.id]),
      );

      let successCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;
      let errorCount = 0;
      const errorLog: any[] = [];

      const parseGender = (val?: string): Gender => {
        const g = (val || '').trim().toUpperCase();
        if (g.startsWith('F') || g === 'FEMALE') return Gender.FEMALE;
        if (g.startsWith('M') || g === 'MALE') return Gender.MALE;
        return Gender.OTHER;
      };

      const parseRelation = (val?: string, gender?: Gender): RelationType => {
        const r = (val || '').trim().toUpperCase();
        if (r.includes('HUSBAND') || r === 'H') return RelationType.HUSBAND;
        if (r.includes('MOTHER') || r === 'M') return RelationType.MOTHER;
        return RelationType.FATHER;
      };

      // Process in sequential chunks
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 1;
        const epic = String(row.epicNumber || row.epic || row.voterId || '').trim().toUpperCase();
        const rawName = String(row.fullName || row.name || '').trim();

        if (!epic || !rawName) {
          skippedCount++;
          errorCount++;
          errorLog.push({ rowNumber: rowNum, error: 'Missing required EPIC or Name' });
          continue;
        }

        try {
          const mandalName = String(row.mandal || row.mandalName || `${constituency.name} Mandal`).trim();
          const villageName = String(row.village || row.villageName || `${mandalName} Village`).trim();
          const boothRaw = String(row.boothNumber || row.booth || '101').trim();
          const groupRaw = String(row.voterGroup || `Group ${Math.floor(i / groupSize) + 1}`).trim();

          // 1. Ensure Mandal
          let mandalId = mandalMap.get(mandalName.toLowerCase());
          if (!mandalId) {
            let m = await prisma.mandal.findFirst({
              where: {
                OR: [
                  { constituencyId: constituency.id, name: { equals: mandalName, mode: 'insensitive' } },
                  { name: { equals: mandalName, mode: 'insensitive' } },
                ],
              },
            });
            if (!m) {
              m = await prisma.mandal.create({
                data: {
                  constituencyId: constituency.id,
                  name: mandalName,
                  code: `MND-${mandalName.slice(0, 4).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
                  totalVoters: 25000,
                },
              });
            }
            mandalId = m.id;
            mandalMap.set(mandalName.toLowerCase(), mandalId);
          }

          // 2. Ensure Village
          const vKey = `${mandalId}:${villageName.toLowerCase()}`;
          let villageId = villageMap.get(vKey);
          if (!villageId) {
            let v = await prisma.village.findFirst({
              where: {
                mandalId,
                name: { equals: villageName, mode: 'insensitive' },
              },
            });
            if (!v) {
              v = await prisma.village.create({
                data: {
                  mandalId,
                  name: villageName,
                  code: `VLG-${villageName.slice(0, 4).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
                  totalVoters: 3000,
                },
              });
            }
            villageId = v.id;
            villageMap.set(vKey, villageId);
          }

          // 3. Ensure Booth
          const bKey = `${villageId}:${boothRaw.toLowerCase()}`;
          let boothId = boothMap.get(bKey);
          if (!boothId) {
            let b = await prisma.booth.findFirst({
              where: {
                villageId,
                boothNumber: boothRaw,
              },
            });
            if (!b) {
              b = await prisma.booth.create({
                data: {
                  villageId,
                  boothNumber: boothRaw,
                  code: `BTH-${boothRaw}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
                  name: `Polling Station ${boothRaw}`,
                  totalVoters: 1000,
                },
              });
            }
            boothId = b.id;
            boothMap.set(bKey, boothId);
          }

          // 4. Ensure Voter Group
          const gKey = `${boothId}:${groupRaw.toLowerCase()}`;
          let voterGroupId = groupMap.get(gKey);
          if (!voterGroupId) {
            let g = await prisma.voterGroup.findFirst({
              where: {
                boothId,
                name: { equals: groupRaw, mode: 'insensitive' },
              },
            });
            if (!g) {
              g = await prisma.voterGroup.create({
                data: {
                  boothId,
                  name: groupRaw,
                  code: `VG-${boothId.slice(0, 4)}-${groupRaw.replace(/\s+/g, '-')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
                  totalVoters: groupSize,
                },
              });
            }
            voterGroupId = g.id;
            groupMap.set(gKey, voterGroupId);
          }

          const gender = parseGender(row.gender);
          const age = parseInt(String(row.age || '25'), 10) || 25;
          const relationType = parseRelation(row.relationType, gender);

          // 5. Upsert Voter
          const existingVoter = await prisma.voter.findUnique({
            where: { epicNumber: epic },
            select: { id: true },
          });

          if (existingVoter) {
            await prisma.voter.update({
              where: { id: existingVoter.id },
              data: {
                name: rawName,
                fatherHusbandName: row.relativeName || row.fatherHusbandName || 'Relative',
                relationType,
                gender,
                age,
                houseNumber: row.houseNumber || row.doorNo || 'N/A',
                mobileNumber: row.mobileNumber || row.phone || null,
                constituencyId: constituency.id,
                mandalId,
                villageId,
                boothId,
                voterGroupId,
                caste: row.caste || null,
                profession: row.profession || null,
                politicalPreference: row.politicalPreference || 'NEUTRAL',
              },
            });
            updatedCount++;
            successCount++;
          } else {
            await prisma.voter.create({
              data: {
                serialNumber: parseInt(String(row.serialNumber || (i + 1)), 10) || (i + 1),
                epicNumber: epic,
                name: rawName,
                fatherHusbandName: row.relativeName || row.fatherHusbandName || 'Relative',
                relationType,
                gender,
                age,
                houseNumber: row.houseNumber || row.doorNo || 'N/A',
                mobileNumber: row.mobileNumber || row.phone || null,
                constituencyId: constituency.id,
                mandalId,
                villageId,
                boothId,
                voterGroupId,
                caste: row.caste || null,
                profession: row.profession || null,
                politicalPreference: row.politicalPreference || 'NEUTRAL',
              },
            });
            successCount++;
          }
        } catch (err: any) {
          errorCount++;
          errorLog.push({ rowNumber: rowNum, epic, error: err.message || 'Error processing row' });
        }
      }

      // Update ImportJob record
      const updatedJob = await prisma.importJob.update({
        where: { id: job.id },
        data: {
          status: errorCount === rows.length ? ImportJobStatus.FAILED : ImportJobStatus.COMPLETED,
          successCount,
          errorCount,
          completedAt: new Date(),
          errors: errorLog.slice(0, 500) as unknown as Prisma.InputJsonValue,
        },
      });

      await logAudit({
        action: AuditAction.CREATE,
        entityType: 'DataImport',
        entityId: job.id,
        userId: creatorId,
        changes: {
          applicationId: config.id,
          appName: config.organisationName,
          totalRows: rows.length,
          successCount,
          updatedCount,
          errorCount,
          skippedCount,
        } as unknown as Prisma.InputJsonValue,
      });

      return {
        jobId: updatedJob.id,
        status: updatedJob.status,
        totalRows: rows.length,
        successCount,
        updatedCount,
        skippedCount,
        errorCount,
        errors: errorLog,
      };
    } catch (err: any) {
      await prisma.importJob.update({
        where: { id: job.id },
        data: {
          status: ImportJobStatus.FAILED,
          completedAt: new Date(),
          errors: [{ error: err.message || 'Fatal error during import execution' }] as unknown as Prisma.InputJsonValue,
        },
      });
      throw err;
    }
  }

  /**
   * Return recent import jobs for an application
   */
  static async getImportHistory(appId: string) {
    const config = await this.resolveApplication(appId);
    const jobs = await prisma.importJob.findMany({
      where: {
        payload: {
          path: ['applicationId'],
          equals: config.id,
        },
      },
      include: {
        createdBy: {
          select: { id: true, name: true, userCode: true, mobileNumber: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // Fallback if no JSON path matches: return all recent jobs
    if (jobs.length === 0) {
      return prisma.importJob.findMany({
        include: {
          createdBy: {
            select: { id: true, name: true, userCode: true, mobileNumber: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
    }

    return jobs;
  }

  /**
   * Get detailed error report for an import job
   */
  static async getImportJobErrors(jobId: string) {
    const job = await prisma.importJob.findUnique({
      where: { id: jobId },
      include: { createdBy: { select: { name: true, mobileNumber: true } } },
    });

    if (!job) {
      throw new Error(`Import job '${jobId}' not found`);
    }

    return {
      jobId: job.id,
      fileName: job.fileName,
      status: job.status,
      totalRows: job.totalRows,
      successCount: job.successCount,
      errorCount: job.errorCount,
      createdAt: job.createdAt,
      errors: job.errors || [],
    };
  }

  /**
   * Return active Incharges for an application
   */
  static async getIncharges(appId: string, level?: string, jurisdictionId?: string) {
    const config = await this.resolveApplication(appId);

    const where: Prisma.UserHierarchyAssignmentWhereInput = {
      isActive: true,
    };

    if (level) {
      where.roleType = level as RoleType;
    }

    if (jurisdictionId) {
      where.OR = [
        { stateId: jurisdictionId },
        { zoneId: jurisdictionId },
        { parliamentId: jurisdictionId },
        { constituencyId: jurisdictionId },
        { mandalId: jurisdictionId },
        { villageId: jurisdictionId },
        { boothId: jurisdictionId },
        { voterGroupId: jurisdictionId },
      ];
    }

    const assignments = await prisma.userHierarchyAssignment.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            userCode: true,
            name: true,
            mobileNumber: true,
            email: true,
            role: true,
            accountStatus: true,
          },
        },
        state: true,
        zone: true,
        parliament: true,
        constituency: true,
        mandal: true,
        village: true,
        booth: true,
        voterGroup: true,
      },
      orderBy: { assignedAt: 'desc' },
      take: 100,
    });

    return assignments.map((a) => {
      let jurisdictionName = 'Constituency';
      let jurisdictionType = 'CONSTITUENCY';
      let parentJurisdiction = '—';

      if (a.voterGroup) {
        jurisdictionName = a.voterGroup.name;
        jurisdictionType = 'VOTER_GROUP';
        parentJurisdiction = a.booth ? `Booth ${a.booth.boothNumber}` : '—';
      } else if (a.booth) {
        jurisdictionName = `Booth ${a.booth.boothNumber} - ${a.booth.name}`;
        jurisdictionType = 'BOOTH';
        parentJurisdiction = a.village?.name || '—';
      } else if (a.village) {
        jurisdictionName = a.village.name;
        jurisdictionType = 'VILLAGE';
        parentJurisdiction = a.mandal?.name || '—';
      } else if (a.mandal) {
        jurisdictionName = a.mandal.name;
        jurisdictionType = 'MANDAL';
        parentJurisdiction = a.constituency?.name || '—';
      } else if (a.constituency) {
        jurisdictionName = a.constituency.name;
        jurisdictionType = 'CONSTITUENCY';
        parentJurisdiction = a.parliament?.name || '—';
      } else if (a.parliament) {
        jurisdictionName = a.parliament.name;
        jurisdictionType = 'PARLIAMENT';
        parentJurisdiction = a.zone?.name || '—';
      } else if (a.zone) {
        jurisdictionName = a.zone.name;
        jurisdictionType = 'ZONE';
        parentJurisdiction = a.state?.name || '—';
      } else if (a.state) {
        jurisdictionName = a.state.name;
        jurisdictionType = 'STATE';
        parentJurisdiction = 'Country';
      }

      return {
        id: a.id,
        userId: a.user.id,
        userName: a.user.name || a.user.userCode,
        mobileNumber: a.user.mobileNumber,
        email: a.user.email,
        role: a.roleType,
        inchargeType: a.roleType.replace(/_/g, ' '),
        jurisdictionType,
        jurisdictionName,
        parentJurisdiction,
        status: a.isActive ? 'ACTIVE' : 'INACTIVE',
        assignedAt: a.assignedAt,
        details: {
          stateId: a.stateId,
          zoneId: a.zoneId,
          parliamentId: a.parliamentId,
          constituencyId: a.constituencyId,
          mandalId: a.mandalId,
          villageId: a.villageId,
          boothId: a.boothId,
          voterGroupId: a.voterGroupId,
        },
      };
    });
  }

  /**
   * Assign or provision an Incharge to a specific jurisdiction node
   */
  static async assignIncharge(
    appId: string,
    payload: {
      userId?: string;
      name?: string;
      mobileNumber?: string;
      email?: string;
      role: RoleType;
      unitLevel: string;
      unitId: string;
      parentUnitId?: string;
      reason?: string;
    },
    actorId?: string,
  ) {
    const config = await this.resolveApplication(appId);

    let user = null;
    if (payload.userId) {
      user = await prisma.user.findUnique({ where: { id: payload.userId } });
    }

    if (!user && payload.mobileNumber) {
      const cleanMobile = payload.mobileNumber.replace(/\D/g, '').slice(-10);
      user = await prisma.user.findFirst({
        where: {
          OR: [{ mobileNumber: cleanMobile }, { mobileNumber: `+91${cleanMobile}` }],
        },
      });

      if (!user) {
        const orgId = config.organisationId || (await prisma.organisation.findFirst())?.id;
        user = await prisma.user.create({
          data: {
            organisationId: orgId,
            userCode: `USR-${cleanMobile.slice(-4)}-${Date.now().toString().slice(-4)}`,
            name: payload.name || `Cadre ${cleanMobile.slice(-4)}`,
            mobileNumber: cleanMobile,
            email: payload.email || `${cleanMobile}@kondapi.app`,
            role: payload.role,
            accountStatus: 'ACTIVE',
          },
        });
      }
    }

    if (!user) {
      throw new Error('User identity could not be resolved or created.');
    }

    // Deactivate previous active assignment for this user
    await prisma.userHierarchyAssignment.updateMany({
      where: { userId: user.id, isActive: true },
      data: { isActive: false },
    });

    const assignmentData: Prisma.UserHierarchyAssignmentUncheckedCreateInput = {
      userId: user.id,
      roleType: payload.role,
      isActive: true,
    };

    const level = payload.unitLevel.toUpperCase();
    if (level === 'STATE') assignmentData.stateId = payload.unitId;
    else if (level === 'ZONE') assignmentData.zoneId = payload.unitId;
    else if (level === 'PARLIAMENT') assignmentData.parliamentId = payload.unitId;
    else if (level === 'CONSTITUENCY') assignmentData.constituencyId = payload.unitId;
    else if (level === 'MANDAL') assignmentData.mandalId = payload.unitId;
    else if (level === 'VILLAGE') assignmentData.villageId = payload.unitId;
    else if (level === 'BOOTH') assignmentData.boothId = payload.unitId;
    else if (level === 'VOTER_GROUP') {
      assignmentData.voterGroupId = payload.unitId;
      await prisma.voterGroup.updateMany({
        where: { id: payload.unitId },
        data: { assignedInchargeId: user.id },
      });
      await prisma.voter.updateMany({
        where: { voterGroupId: payload.unitId },
        data: { assignedInchargeId: user.id },
      });
    }

    const createdAssignment = await prisma.userHierarchyAssignment.create({
      data: assignmentData,
    });

    // Update user role to match assignment
    await prisma.user.update({
      where: { id: user.id },
      data: { role: payload.role },
    });

    await logAudit({
      action: AuditAction.CREATE,
      entityType: 'InchargeAssignment',
      entityId: createdAssignment.id,
      userId: actorId,
      changes: {
        applicationId: config.id,
        inchargeName: user.name,
        role: payload.role,
        unitLevel: payload.unitLevel,
        unitId: payload.unitId,
        reason: payload.reason || 'Assigned via CMS Assign Incharges',
      } as unknown as Prisma.InputJsonValue,
    });

    return createdAssignment;
  }

  /**
   * Delete or deactivate an incharge assignment
   */
  static async deleteIncharge(appId: string, assignmentId: string, actorId?: string) {
    const config = await this.resolveApplication(appId);
    const assignment = await prisma.userHierarchyAssignment.findUnique({
      where: { id: assignmentId },
      include: { user: true },
    });

    if (!assignment) {
      throw new Error(`Incharge assignment '${assignmentId}' not found.`);
    }

    const updated = await prisma.userHierarchyAssignment.update({
      where: { id: assignmentId },
      data: { isActive: false },
    });

    await logAudit({
      action: AuditAction.DELETE,
      entityType: 'InchargeAssignment',
      entityId: assignmentId,
      userId: actorId,
      changes: {
        applicationId: config.id,
        deactivatedUser: assignment.user?.name,
      } as unknown as Prisma.InputJsonValue,
    });

    return updated;
  }

  /**
   * Return voters strictly scoped to application and logged in user's jurisdiction
   */
  static async getVoters(appId: string, query: any, userScope?: UserHierarchyScope) {
    const config = await this.resolveApplication(appId);

    const where: Prisma.VoterWhereInput = {};

    // Enforce user hierarchy scope if present
    if (userScope && !userScope.isGlobalScope) {
      if (userScope.accessibleBoothIds.size > 0) {
        where.boothId = { in: Array.from(userScope.accessibleBoothIds) };
      } else if (userScope.accessibleVillageIds.size > 0) {
        where.villageId = { in: Array.from(userScope.accessibleVillageIds) };
      } else if (userScope.accessibleMandalIds.size > 0) {
        where.mandalId = { in: Array.from(userScope.accessibleMandalIds) };
      } else if (userScope.accessibleConstituencyIds.size > 0) {
        where.constituencyId = { in: Array.from(userScope.accessibleConstituencyIds) };
      }
    }

    if (query?.search) {
      const s = String(query.search).trim();
      where.OR = [
        { name: { contains: s, mode: 'insensitive' } },
        { epicNumber: { contains: s, mode: 'insensitive' } },
        { mobileNumber: { contains: s } },
        { houseNumber: { contains: s, mode: 'insensitive' } },
      ];
    }

    if (query?.mandalId) where.mandalId = query.mandalId;
    if (query?.villageId) where.villageId = query.villageId;
    if (query?.boothId) where.boothId = query.boothId;
    if (query?.voterGroupId) where.voterGroupId = query.voterGroupId;

    const page = Math.max(1, parseInt(query?.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(query?.limit || '20', 10)));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.voter.findMany({
        where,
        skip,
        take: limit,
        include: {
          booth: true,
          village: true,
          mandal: true,
          voterGroup: true,
        },
        orderBy: { name: 'asc' },
      }),
      prisma.voter.count({ where }),
    ]);

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Executive KPI rollups respecting application scope and user jurisdiction
   */
  static async getSummary(appId: string, userScope?: UserHierarchyScope) {
    const config = await this.resolveApplication(appId);

    const voterWhere: Prisma.VoterWhereInput = {};
    const boothWhere: Prisma.BoothWhereInput = {};
    const groupWhere: Prisma.VoterGroupWhereInput = {};

    if (userScope && !userScope.isGlobalScope) {
      if (userScope.accessibleBoothIds.size > 0) {
        voterWhere.boothId = { in: Array.from(userScope.accessibleBoothIds) };
        boothWhere.id = { in: Array.from(userScope.accessibleBoothIds) };
      } else if (userScope.accessibleMandalIds.size > 0) {
        voterWhere.mandalId = { in: Array.from(userScope.accessibleMandalIds) };
      }
    }

    const [totalVoters, totalBooths, totalGroups, totalIncharges, totalTasks, verifiedCount] = await Promise.all([
      prisma.voter.count({ where: voterWhere }),
      prisma.booth.count({ where: boothWhere }),
      prisma.voterGroup.count({ where: groupWhere }),
      prisma.userHierarchyAssignment.count({ where: { isActive: true } }),
      prisma.task.count(),
      prisma.voter.count({ where: { ...voterWhere, surveyStatus: 'VERIFIED' } }),
    ]);

    return {
      applicationId: config.id,
      appName: config.organisationName,
      stateName: config.stateName,
      totalVoters,
      totalBooths,
      totalGroups,
      totalIncharges,
      totalTasks,
      verifiedCount,
      verificationRate: totalVoters > 0 ? Math.round((verifiedCount / totalVoters) * 100) : 0,
    };
  }
}
