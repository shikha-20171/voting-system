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
  warningsCount: number;
  errors: {
    rowNumber: number;
    field: string;
    value?: any;
    message: string;
    suggestion: string;
    severity?: 'ERROR' | 'WARNING';
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

export interface SystemFieldDefinition {
  key: string;
  label: string;
  required: boolean;
  description: string;
  aliases: string[];
}

export const SYSTEM_FIELDS: SystemFieldDefinition[] = [
  {
    key: 'epicNumber',
    label: 'Voter ID / EPIC',
    required: true,
    description: 'Unique voter registration card number',
    aliases: ['voter id', 'epic', 'epic number', 'voter id / epic', 'epic_no', 'voter_id', 'card no', 'id'],
  },
  {
    key: 'fullName',
    label: 'Voter Full Name',
    required: true,
    description: 'Citizen legal full name',
    aliases: ['voter name', 'full name', 'name', 'citizen name', 'voter_name', 'candidate name'],
  },
  {
    key: 'relativeName',
    label: 'Father / Husband / Relative Name',
    required: false,
    description: 'Father or husband name as registered in electoral roll',
    aliases: ['relative name', 'father/husband name', 'father name', 'husband name', 'guardian name', 'relative_name'],
  },
  {
    key: 'relationType',
    label: 'Relation Type',
    required: false,
    description: 'FATHER, HUSBAND, MOTHER, or OTHER',
    aliases: ['relation type', 'relation', 'relationship', 'rel_type'],
  },
  {
    key: 'age',
    label: 'Age',
    required: true,
    description: 'Voter legal age (must be >= 18)',
    aliases: ['age', 'voter age', 'years'],
  },
  {
    key: 'gender',
    label: 'Gender',
    required: true,
    description: 'MALE, FEMALE, or OTHER',
    aliases: ['gender', 'sex'],
  },
  {
    key: 'mobileNumber',
    label: 'Mobile Number',
    required: false,
    description: '10-digit citizen contact number',
    aliases: ['mobile number', 'mobile', 'phone', 'contact', 'cell', 'phone number'],
  },
  {
    key: 'houseNumber',
    label: 'House / Door No',
    required: false,
    description: 'Residential address / door number',
    aliases: ['house number', 'door no', 'house no', 'address', 'h.no', 'door_no'],
  },
  {
    key: 'mandal',
    label: 'Mandal',
    required: true,
    description: 'Sub-district / administrative Mandal name',
    aliases: ['mandal', 'mandal name', 'tehsil', 'block', 'taluk'],
  },
  {
    key: 'village',
    label: 'Village / Ward',
    required: true,
    description: 'Revenue Village, Panchayat, or Urban Ward',
    aliases: ['village', 'village name', 'panchayat', 'ward', 'town', 'village / ward'],
  },
  {
    key: 'boothNumber',
    label: 'Booth Number',
    required: true,
    description: 'Assigned polling booth or part number',
    aliases: ['booth number', 'booth', 'part no', 'polling station no', 'booth no'],
  },
  {
    key: 'voterGroup',
    label: '100-Voter Group',
    required: false,
    description: 'Cluster / micro-incharge group name or number',
    aliases: ['voter group', '100-voter group', 'group', 'cluster', 'section', '100 voter incharge'],
  },
  {
    key: 'caste',
    label: 'Caste / Category',
    required: false,
    description: 'Demographic caste or social group',
    aliases: ['caste', 'community', 'category', 'sub-caste', 'social group'],
  },
  {
    key: 'profession',
    label: 'Profession',
    required: false,
    description: 'Primary occupation / livelihood',
    aliases: ['profession', 'occupation', 'job', 'work'],
  },
  {
    key: 'politicalPreference',
    label: 'Political Preference',
    required: false,
    description: 'Party leaning or neutral inclination',
    aliases: ['political preference', 'party preference', 'leaning', 'preference', 'party'],
  },
];

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
   * Return all applications available on the platform
   */
  static async getApplications() {
    const configs = await prisma.cMSConfiguration.findMany({
      include: { organisation: true },
      orderBy: { updatedAt: 'desc' },
    });

    const activeParties = await prisma.politicalParty.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    const constituenciesCount = await prisma.constituency.count();
    const votersCount = await prisma.voter.count();

    return configs.map((c) => ({
      id: c.id,
      configKey: c.configKey,
      appName: c.organisationName,
      stateName: c.stateName,
      appScope: c.appScope || 'SINGLE_MLA',
      parliamentName: c.parliamentName,
      defaultLanguage: c.defaultLanguage,
      hierarchyLabels: c.hierarchyLabels,
      featureToggles: c.featureToggles,
      aiEnabled: c.aiEnabled,
      isDefault: c.configKey === 'default',
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      constituenciesCount,
      votersCount,
      partiesCount: activeParties.length,
      parties: activeParties.map((p) => ({
        name: p.name,
        code: p.code,
        primaryColor: p.primaryColor,
      })),
    }));
  }

  /**
   * Return detailed configuration for a specific application
   */
  static async getConfiguration(appId: string) {
    const config = await this.resolveApplication(appId);
    return {
      id: config.id,
      configKey: config.configKey,
      appName: config.organisationName,
      stateName: config.stateName,
      parliamentName: config.parliamentName,
      parliamentCode: config.parliamentCode,
      candidateName: config.candidateName,
      appScope: config.appScope || 'SINGLE_MLA',
      defaultLanguage: config.defaultLanguage,
      primaryColor: config.primaryColor || '#eab308',
      secondaryColor: config.secondaryColor || '#1e293b',
      accentColor: config.accentColor || '#3b82f6',
      logoUrl: config.logoUrl,
      hierarchyLabels: config.hierarchyLabels,
      activeHierarchyLevels: config.activeHierarchyLevels || [
        'STATE',
        'ZONE',
        'PARLIAMENT',
        'CONSTITUENCY',
        'MANDAL',
        'VILLAGE',
        'BOOTH',
        'VOTER_GROUP',
      ],
      featureToggles: config.featureToggles,
      aiEnabled: config.aiEnabled,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };
  }

  /**
   * Return dynamic hierarchy tree and configured levels
   */
  static async getHierarchy(appId: string) {
    const config = await this.resolveApplication(appId);
    const activeLevels = Array.isArray(config.activeHierarchyLevels)
      ? (config.activeHierarchyLevels as string[])
      : ['STATE', 'ZONE', 'PARLIAMENT', 'CONSTITUENCY', 'MANDAL', 'VILLAGE', 'BOOTH', 'VOTER_GROUP'];

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

    const allConstituencies = await prisma.constituency.findMany({
      include: {
        parliament: { include: { zone: { include: { state: true } } } },
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
   * Return scoped constituencies with their data status, booth counts, and voter records
   */
  static async getConstituencies(appId: string, scopeFilters?: { stateId?: string; zoneId?: string; parliamentId?: string }) {
    const config = await this.resolveApplication(appId);
    const scope = config.appScope || 'SINGLE_MLA';

    const whereClause: Prisma.ConstituencyWhereInput = {};

    if (scopeFilters?.parliamentId) {
      whereClause.parliamentId = scopeFilters.parliamentId;
    } else if (scopeFilters?.zoneId) {
      whereClause.parliament = { zoneId: scopeFilters.zoneId };
    } else if (scopeFilters?.stateId) {
      whereClause.parliament = { zone: { stateId: scopeFilters.stateId } };
    } else if (scope === 'PARLIAMENT_MP' && config.parliamentName) {
      whereClause.parliament = {
        name: { contains: config.parliamentName, mode: 'insensitive' },
      };
    } else if (scope === 'SINGLE_MLA') {
      whereClause.OR = [
        { name: { contains: config.organisationName, mode: 'insensitive' } },
        { name: { contains: config.headerTitle || '', mode: 'insensitive' } },
      ];
    }

    let constituencies = await prisma.constituency.findMany({
      where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
      include: {
        parliament: {
          include: {
            zone: {
              include: {
                state: true,
              },
            },
          },
        },
        mandals: {
          include: {
            villages: {
              include: {
                booths: true,
              },
            },
          },
        },
        dataImports: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { name: 'asc' },
    });

    if (constituencies.length === 0) {
      constituencies = await prisma.constituency.findMany({
        include: {
          parliament: {
            include: {
              zone: {
                include: {
                  state: true,
                },
              },
            },
          },
          mandals: {
            include: {
              villages: {
                include: {
                  booths: true,
                },
              },
            },
          },
          dataImports: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { name: 'asc' },
        take: 25,
      });
    }

    return constituencies.map((c) => {
      let boothCount = 0;
      let villageCount = 0;
      for (const m of c.mandals) {
        villageCount += m.villages.length;
        for (const v of m.villages) {
          boothCount += v.booths.length;
        }
      }

      const latestImport = c.dataImports?.[0];
      const status = latestImport?.status || (c.totalVoters > 0 ? 'SUCCESS' : 'PENDING');

      return {
        id: c.id,
        name: c.name,
        code: c.code,
        constituencyNumber: c.constituencyNumber,
        stateName: c.parliament?.zone?.state?.name || config.stateName || 'Andhra Pradesh',
        zoneName: c.parliament?.zone?.name || 'Central Zone',
        parliamentName: c.parliament?.name || config.parliamentName || 'Main Parliament',
        mandalsCount: c.mandals.length,
        villagesCount: villageCount,
        boothsCount: boothCount,
        totalVoters: c.totalVoters,
        lastImported: latestImport?.completedAt || latestImport?.createdAt || null,
        importStatus: status,
        importedRecords: latestImport?.importedRecords || c.totalVoters,
      };
    });
  }

  /**
   * Return single constituency detail
   */
  static async getConstituencyDetail(appId: string, constituencyId: string) {
    await this.resolveApplication(appId);
    const c = await prisma.constituency.findUnique({
      where: { id: constituencyId },
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
        dataImports: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!c) {
      throw new Error(`Constituency with id '${constituencyId}' not found.`);
    }

    return c;
  }

  /**
   * Suggest auto-mapping of Excel columns to system fields
   */
  static suggestColumnMapping(headers: string[]) {
    const suggestions: Record<string, string> = {};
    const unmapped: string[] = [];

    headers.forEach((header) => {
      const normalized = header.trim().toLowerCase();
      let matchedKey: string | null = null;

      for (const field of SYSTEM_FIELDS) {
        if (field.aliases.includes(normalized) || field.label.toLowerCase() === normalized) {
          matchedKey = field.key;
          break;
        }
      }

      if (matchedKey) {
        suggestions[header] = matchedKey;
      } else {
        unmapped.push(header);
      }
    });

    return {
      suggestions,
      unmapped,
      systemFields: SYSTEM_FIELDS.map((f) => ({
        key: f.key,
        label: f.label,
        required: f.required,
        description: f.description,
      })),
    };
  }

  /**
   * Pre-flight validation of raw imported data before final database ingestion (Pure Validate-Only)
   */
  static async validateData(
    appId: string,
    level: string,
    rows: RawImportRow[],
    options?: {
      targetConstituencyId?: string;
      columnMapping?: Record<string, string>;
      fileName?: string;
    },
  ): Promise<ValidationResult> {
    const config = await this.resolveApplication(appId);
    const errors: ValidationResult['errors'] = [];
    const preview: ValidationResult['preview'] = [];

    const seenEpics = new Set<string>();
    const seenBoothsInVillage = new Set<string>();
    let duplicateCount = 0;
    let warningsCount = 0;
    let validRows = 0;

    // Check empty dataset
    if (!rows || rows.length === 0) {
      return {
        totalRows: 0,
        validRows: 0,
        invalidRows: 0,
        duplicateCount: 0,
        warningsCount: 0,
        errors: [{ rowNumber: 0, field: 'file', message: 'The uploaded file contains no data rows', suggestion: 'Upload a spreadsheet with header and data rows', severity: 'ERROR' }],
        preview: [],
      };
    }

    const mapping = options?.columnMapping;

    // Extract value using mapping or direct raw keys
    const getRowValue = (row: any, systemKey: string): string => {
      if (mapping) {
        for (const [excelCol, mappedKey] of Object.entries(mapping)) {
          if (mappedKey === systemKey && row[excelCol] !== undefined && row[excelCol] !== '') {
            return String(row[excelCol]).trim();
          }
        }
      }
      switch (systemKey) {
        case 'epicNumber':
          return String(row.epicNumber || row.epic || row.voterId || row['Voter ID / EPIC'] || row['Voter ID'] || row['EPIC'] || '').trim();
        case 'fullName':
          return String(row.fullName || row.name || row['Full Name'] || row['Voter Name'] || '').trim();
        case 'relativeName':
          return String(row.relativeName || row.fatherHusbandName || row['Relative Name'] || row['Father/Husband Name'] || '').trim();
        case 'relationType':
          return String(row.relationType || row['Relation Type'] || '').trim();
        case 'age':
          return String(row.age || row['Age'] || '').trim();
        case 'gender':
          return String(row.gender || row['Gender'] || '').trim();
        case 'mobileNumber':
          return String(row.mobileNumber || row.phone || row['Mobile Number'] || '').trim();
        case 'houseNumber':
          return String(row.houseNumber || row.doorNo || row['House No'] || row['Door No'] || '').trim();
        case 'mandal':
          return String(row.mandal || row.mandalName || row['Mandal'] || '').trim();
        case 'village':
          return String(row.village || row.villageName || row.panchayat || row['Village'] || '').trim();
        case 'boothNumber':
          return String(row.boothNumber || row.booth || row['Booth Number'] || '').trim();
        case 'voterGroup':
          return String(row.voterGroup || row['100-Voter Group'] || row.cluster || '').trim();
        case 'caste':
          return String(row.caste || row['Caste'] || '').trim();
        case 'profession':
          return String(row.profession || row['Profession'] || '').trim();
        case 'politicalPreference':
          return String(row.politicalPreference || row['Political Preference'] || '').trim();
        default:
          return String(row[systemKey] || '').trim();
      }
    };

    // Pre-fetch existing voter EPICs in database to detect duplicates
    const allEpicsInFile: string[] = [];
    for (const r of rows) {
      const ep = getRowValue(r, 'epicNumber').toUpperCase();
      if (ep) allEpicsInFile.push(ep);
    }

    const existingDbEpics = new Set<string>();
    if (allEpicsInFile.length > 0) {
      const chunkSize = 2000;
      for (let i = 0; i < allEpicsInFile.length; i += chunkSize) {
        const slice = allEpicsInFile.slice(i, i + chunkSize);
        const dbFound = await prisma.voter.findMany({
          where: { epicNumber: { in: slice } },
          select: { epicNumber: true },
        });
        dbFound.forEach((v) => existingDbEpics.add(v.epicNumber));
      }
    }

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 1;
      let rowStatus: 'VALID' | 'WARNING' | 'ERROR' = 'VALID';
      const rowReasons: string[] = [];

      const rawEpic = getRowValue(row, 'epicNumber').toUpperCase();
      const rawName = getRowValue(row, 'fullName');
      const rawAgeStr = getRowValue(row, 'age');
      const rawAge = parseInt(rawAgeStr || '0', 10);
      const rawGender = getRowValue(row, 'gender').toUpperCase();
      const rawMandal = getRowValue(row, 'mandal');
      const rawVillage = getRowValue(row, 'village');
      const rawBooth = getRowValue(row, 'boothNumber');
      const rawGroup = getRowValue(row, 'voterGroup');
      const rawMobile = getRowValue(row, 'mobileNumber');

      if (level === 'VOTER' || !level) {
        // EPIC Validation
        if (!rawEpic) {
          errors.push({
            rowNumber: rowNum,
            field: 'epicNumber',
            message: 'EPIC / Voter ID number is missing',
            suggestion: 'Enter unique EPIC Number (e.g. AP01234567)',
            severity: 'ERROR',
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
            severity: 'ERROR',
          });
          rowReasons.push('Duplicate EPIC in file');
          rowStatus = 'ERROR';
        } else if (existingDbEpics.has(rawEpic)) {
          warningsCount++;
          rowReasons.push('EPIC already exists in database (will be updated)');
          if ((rowStatus as string) !== 'ERROR') rowStatus = 'WARNING';
        }
        if (rawEpic) seenEpics.add(rawEpic);

        // Name Validation
        if (!rawName) {
          errors.push({
            rowNumber: rowNum,
            field: 'fullName',
            message: 'Voter full name is required',
            suggestion: 'Enter citizen legal full name',
            severity: 'ERROR',
          });
          rowReasons.push('Missing Voter Name');
          rowStatus = 'ERROR';
        }

        // Age Validation
        if (!rawAgeStr || isNaN(rawAge) || rawAge < 18 || rawAge > 125) {
          errors.push({
            rowNumber: rowNum,
            field: 'age',
            value: rawAgeStr,
            message: `Invalid voter age '${rawAgeStr || 'empty'}'. Must be between 18 and 125`,
            suggestion: 'Provide legal voter age (>= 18)',
            severity: 'ERROR',
          });
          rowReasons.push('Invalid Age (<18 or >125)');
          rowStatus = 'ERROR';
        }

        // Gender Validation
        if (!rawGender || (!rawGender.startsWith('M') && !rawGender.startsWith('F') && !rawGender.startsWith('O'))) {
          errors.push({
            rowNumber: rowNum,
            field: 'gender',
            value: rawGender,
            message: `Invalid gender '${rawGender || 'empty'}'. Must be MALE, FEMALE, or OTHER`,
            suggestion: 'Specify MALE, FEMALE, or OTHER',
            severity: 'ERROR',
          });
          rowReasons.push('Invalid Gender');
          rowStatus = 'ERROR';
        }

        // Mobile Validation (warning only if invalid)
        if (rawMobile && !/^\d{10}$/.test(rawMobile.replace(/\D/g, ''))) {
          errors.push({
            rowNumber: rowNum,
            field: 'mobileNumber',
            value: rawMobile,
            message: `Invalid mobile number '${rawMobile}'. Expected 10 digits`,
            suggestion: 'Check mobile number formatting',
            severity: 'WARNING',
          });
          warningsCount++;
          if (rowStatus !== 'ERROR') rowStatus = 'WARNING';
          rowReasons.push('Invalid Mobile (non-10 digit)');
        }

        // Hierarchy parent-child checks
        if (!rawMandal) {
          errors.push({
            rowNumber: rowNum,
            field: 'mandal',
            message: 'Mandal name is required',
            suggestion: 'Specify valid Mandal',
            severity: 'ERROR',
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
            severity: 'ERROR',
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
            severity: 'ERROR',
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
            severity: 'ERROR',
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
            severity: 'ERROR',
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
            severity: 'ERROR',
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
          state: config.stateName || 'Andhra Pradesh',
          parliament: config.parliamentName || 'Main Parliament',
          constituency: config.organisationName || 'Constituency',
          mandal: rawMandal || '—',
          village: rawVillage || '—',
          booth: rawBooth || '—',
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
      warningsCount,
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
      targetConstituencyId?: string;
      columnMapping?: Record<string, string>;
      importMode?: 'APPEND' | 'REPLACE';
      voterGroupSize?: number;
      fileName?: string;
      fileSize?: number;
    },
    actorId?: string,
  ) {
    const config = await this.resolveApplication(appId);
    const mode = options.importMode || 'APPEND';
    const groupSize = options.voterGroupSize || 100;
    const fileName = options.fileName || 'voter_data_import.xlsx';
    const fileSize = options.fileSize || 0;
    const mapping = options.columnMapping;

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

    // Helper to get row value using mapping or fallback
    const getRowValue = (row: any, systemKey: string): string => {
      if (mapping) {
        for (const [excelCol, mappedKey] of Object.entries(mapping)) {
          if (mappedKey === systemKey && row[excelCol] !== undefined && row[excelCol] !== '') {
            return String(row[excelCol]).trim();
          }
        }
      }
      switch (systemKey) {
        case 'epicNumber':
          return String(row.epicNumber || row.epic || row.voterId || row['Voter ID / EPIC'] || row['Voter ID'] || row['EPIC'] || '').trim();
        case 'fullName':
          return String(row.fullName || row.name || row['Full Name'] || row['Voter Name'] || '').trim();
        case 'relativeName':
          return String(row.relativeName || row.fatherHusbandName || row['Relative Name'] || row['Father/Husband Name'] || '').trim();
        case 'relationType':
          return String(row.relationType || row['Relation Type'] || '').trim();
        case 'age':
          return String(row.age || row['Age'] || '').trim();
        case 'gender':
          return String(row.gender || row['Gender'] || '').trim();
        case 'mobileNumber':
          return String(row.mobileNumber || row.phone || row['Mobile Number'] || '').trim();
        case 'houseNumber':
          return String(row.houseNumber || row.doorNo || row['House No'] || row['Door No'] || '').trim();
        case 'mandal':
          return String(row.mandal || row.mandalName || row['Mandal'] || '').trim();
        case 'village':
          return String(row.village || row.villageName || row.panchayat || row['Village'] || '').trim();
        case 'boothNumber':
          return String(row.boothNumber || row.booth || row['Booth Number'] || '').trim();
        case 'voterGroup':
          return String(row.voterGroup || row['100-Voter Group'] || row.cluster || '').trim();
        case 'caste':
          return String(row.caste || row['Caste'] || '').trim();
        case 'profession':
          return String(row.profession || row['Profession'] || '').trim();
        case 'politicalPreference':
          return String(row.politicalPreference || row['Political Preference'] || '').trim();
        default:
          return String(row[systemKey] || '').trim();
      }
    };

    // 1. Resolve Target Constituency strictly
    let constituency: any = null;
    if (options.targetConstituencyId) {
      constituency = await prisma.constituency.findUnique({
        where: { id: options.targetConstituencyId },
        include: { parliament: { include: { zone: { include: { state: true } } } } },
      });
    }

    if (!constituency) {
      constituency = await prisma.constituency.findFirst({
        where: {
          OR: [
            { name: { contains: config.organisationName, mode: 'insensitive' } },
            { name: { contains: config.headerTitle || '', mode: 'insensitive' } },
          ],
        },
        include: { parliament: { include: { zone: { include: { state: true } } } } },
      });
    }

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

    // 2. Create DataImport record
    const dataImport = await prisma.dataImport.create({
      data: {
        applicationId: config.id,
        uploadedById: creatorId,
        fileName,
        fileSize,
        targetHierarchyId: constituency.parliamentId,
        targetConstituencyId: constituency.id,
        mode,
        status: 'PROCESSING',
        totalRecords: rows.length,
        startedAt: new Date(),
        metadata: {
          appName: config.organisationName,
          targetConstituencyName: constituency.name,
          level,
          voterGroupSize: groupSize,
        } as unknown as Prisma.InputJsonValue,
      },
    });

    // Also persist ImportJob for backward compatibility
    const job = await prisma.importJob.create({
      data: {
        fileName,
        status: ImportJobStatus.PROCESSING,
        totalRows: rows.length,
        createdById: creatorId,
        startedAt: new Date(),
        payload: {
          applicationId: config.id,
          dataImportId: dataImport.id,
          appName: config.organisationName,
          targetConstituencyId: constituency.id,
          level,
          importMode: mode,
          groupSize,
        } as unknown as Prisma.InputJsonValue,
      },
    });

    // Save column mappings if provided
    if (mapping) {
      for (const [excelCol, sysField] of Object.entries(mapping)) {
        await prisma.dataImportMapping.create({
          data: {
            importId: dataImport.id,
            excelColumn: excelCol,
            systemField: sysField,
          },
        }).catch(() => {});
      }
    }

    try {
      // 3. If REPLACE mode, strictly wipe existing voters in target constituency ONLY
      if (mode === 'REPLACE' && level === 'VOTER') {
        const deletedCount = await prisma.voter.deleteMany({
          where: { constituencyId: constituency.id },
        });

        await logAudit({
          action: AuditAction.DELETE,
          entityType: 'ConstituencyVotersReplace',
          entityId: constituency.id,
          userId: creatorId,
          changes: {
            replacedConstituencyId: constituency.id,
            constituencyName: constituency.name,
            deletedVotersCount: deletedCount.count,
          } as unknown as Prisma.InputJsonValue,
        });
      }

      // Hierarchy caches scoped to target constituency
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
      let boothsCreated = 0;
      let voterGroupsCreated = 0;
      const errorRecords: Array<{
        rowNumber: number;
        field: string;
        value?: string;
        errorMessage: string;
        severity: string;
      }> = [];

      const parseGender = (val?: string): Gender => {
        const g = (val || '').trim().toUpperCase();
        if (g.startsWith('F') || g === 'FEMALE') return Gender.FEMALE;
        if (g.startsWith('M') || g === 'MALE') return Gender.MALE;
        return Gender.OTHER;
      };

      const parseRelation = (val?: string): RelationType => {
        const r = (val || '').trim().toUpperCase();
        if (r.includes('HUSBAND') || r === 'H') return RelationType.HUSBAND;
        if (r.includes('MOTHER') || r === 'M') return RelationType.MOTHER;
        return RelationType.FATHER;
      };

      // Ingest in sequential chunks
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 1;
        const epic = getRowValue(row, 'epicNumber').toUpperCase();
        const rawName = getRowValue(row, 'fullName');

        if (!epic || !rawName) {
          skippedCount++;
          errorCount++;
          errorRecords.push({
            rowNumber: rowNum,
            field: !epic ? 'epicNumber' : 'fullName',
            value: !epic ? 'empty' : 'empty',
            errorMessage: 'Missing required EPIC Number or Voter Full Name',
            severity: 'ERROR',
          });
          continue;
        }

        try {
          const mandalName = getRowValue(row, 'mandal') || `${constituency.name} Mandal`;
          const villageName = getRowValue(row, 'village') || `${mandalName} Village`;
          const boothRaw = getRowValue(row, 'boothNumber') || '101';
          const groupRaw = getRowValue(row, 'voterGroup') || `Group ${Math.floor(i / groupSize) + 1}`;

          // 1. Ensure Mandal within selected Constituency
          let mandalId = mandalMap.get(mandalName.toLowerCase());
          if (!mandalId) {
            let m = await prisma.mandal.findFirst({
              where: {
                constituencyId: constituency.id,
                name: { equals: mandalName, mode: 'insensitive' },
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

          // 2. Ensure Village within Mandal
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

          // 3. Automatic Booth Mapping (Find or Create)
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
                  name: `Polling Station No. ${boothRaw}`,
                  pollingStation: `${villageName} Polling Station ${boothRaw}`,
                  totalVoters: 1000,
                },
              });
              boothsCreated++;
            }
            boothId = b.id;
            boothMap.set(bKey, boothId);
          }

          // 4. Automatic 100-Voter Group Mapping (Find or Create)
          const gKey = `${boothId}:${groupRaw.toLowerCase()}`;
          let groupId = groupMap.get(gKey);
          if (!groupId) {
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
                  code: `VG-${boothRaw}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
                  totalVoters: 100,
                },
              });
              voterGroupsCreated++;
            }
            groupId = g.id;
            groupMap.set(gKey, groupId);
          }

          // 5. Upsert Voter record
          const ageNum = parseInt(getRowValue(row, 'age') || '30', 10);
          const gender = parseGender(getRowValue(row, 'gender'));
          const relation = parseRelation(getRowValue(row, 'relationType'));
          const relativeName = getRowValue(row, 'relativeName') || 'Relative';
          const houseNo = getRowValue(row, 'houseNumber') || '1-1';
          const mobile = getRowValue(row, 'mobileNumber') || null;
          const caste = getRowValue(row, 'caste') || null;
          const profession = getRowValue(row, 'profession') || null;
          const politicalPref = getRowValue(row, 'politicalPreference') || 'NEUTRAL';

          const existingVoter = await prisma.voter.findUnique({
            where: { epicNumber: epic },
          });

          if (existingVoter) {
            await prisma.voter.update({
              where: { epicNumber: epic },
              data: {
                name: rawName,
                fatherHusbandName: relativeName,
                relationType: relation,
                age: isNaN(ageNum) ? 30 : ageNum,
                gender,
                mobileNumber: mobile,
                houseNumber: houseNo,
                caste,
                profession,
                politicalPreference: politicalPref,
                constituencyId: constituency.id,
                mandalId,
                villageId,
                boothId,
                voterGroupId: groupId,
                updatedById: creatorId,
              },
            });
            updatedCount++;
          } else {
            await prisma.voter.create({
              data: {
                serialNumber: i + 1,
                epicNumber: epic,
                name: rawName,
                fatherHusbandName: relativeName,
                relationType: relation,
                houseNumber: houseNo,
                age: isNaN(ageNum) ? 30 : ageNum,
                gender,
                mobileNumber: mobile,
                caste,
                profession,
                politicalPreference: politicalPref,
                constituencyId: constituency.id,
                mandalId,
                villageId,
                boothId,
                voterGroupId: groupId,
                updatedById: creatorId,
              },
            });
            successCount++;
          }
        } catch (err: any) {
          errorCount++;
          errorRecords.push({
            rowNumber: rowNum,
            field: 'voter',
            value: epic,
            errorMessage: err.message || 'Error creating voter record',
            severity: 'ERROR',
          });
        }
      }

      // Update total voters on Constituency
      const totalVotersInAC = await prisma.voter.count({
        where: { constituencyId: constituency.id },
      });
      await prisma.constituency.update({
        where: { id: constituency.id },
        data: { totalVoters: totalVotersInAC },
      });

      // 6. Record individual DataImportErrors in database
      if (errorRecords.length > 0) {
        const errorChunks = errorRecords.slice(0, 1000);
        for (const err of errorChunks) {
          await prisma.dataImportError.create({
            data: {
              importId: dataImport.id,
              rowNumber: err.rowNumber,
              field: err.field,
              value: err.value ? String(err.value).slice(0, 255) : null,
              errorMessage: err.errorMessage.slice(0, 500),
              severity: err.severity || 'ERROR',
            },
          }).catch(() => {});
        }
      }

      // Final status determination
      const finalStatus =
        errorCount === 0 && (successCount > 0 || updatedCount > 0)
          ? 'SUCCESS'
          : successCount > 0 || updatedCount > 0
          ? 'PARTIAL_SUCCESS'
          : 'FAILED';

      // 7. Update DataImport & ImportJob records
      await prisma.dataImport.update({
        where: { id: dataImport.id },
        data: {
          status: finalStatus,
          validRecords: successCount + updatedCount,
          importedRecords: successCount,
          updatedRecords: updatedCount,
          skippedRecords: skippedCount,
          failedRecords: errorCount,
          boothsCount: boothsCreated,
          voterGroupsCount: voterGroupsCreated,
          completedAt: new Date(),
        },
      });

      await prisma.importJob.update({
        where: { id: job.id },
        data: {
          status: finalStatus === 'SUCCESS' ? ImportJobStatus.COMPLETED : ImportJobStatus.FAILED,
          successCount: successCount + updatedCount,
          errorCount,
          completedAt: new Date(),
          errors: errorRecords.slice(0, 100) as unknown as Prisma.InputJsonValue,
        },
      });

      // 8. Log Audit Record
      await logAudit({
        action: AuditAction.BULK_IMPORT,
        entityType: 'DataImport',
        entityId: dataImport.id,
        userId: creatorId,
        changes: {
          applicationId: config.id,
          targetConstituencyId: constituency.id,
          targetConstituencyName: constituency.name,
          mode,
          status: finalStatus,
          totalRecords: rows.length,
          importedRecords: successCount,
          updatedRecords: updatedCount,
          failedRecords: errorCount,
          boothsCreated,
          voterGroupsCreated,
        } as unknown as Prisma.InputJsonValue,
      });

      return {
        importId: dataImport.id,
        jobId: job.id,
        status: finalStatus,
        applicationName: config.organisationName,
        targetConstituency: constituency.name,
        targetConstituencyId: constituency.id,
        totalRows: rows.length,
        totalRecords: rows.length,
        successCount: successCount + updatedCount,
        importedCount: successCount,
        updatedCount,
        skippedCount,
        errorCount,
        failedCount: errorCount,
        boothsCount: boothsCreated,
        voterGroupsCount: voterGroupsCreated,
        errors: errorRecords.slice(0, 50),
      };
    } catch (err: any) {
      await prisma.dataImport.update({
        where: { id: dataImport.id },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
        },
      });
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
   * Return paginated import history for an application with filters
   */
  static async getDataImports(
    appId: string,
    query?: {
      status?: string;
      constituencyId?: string;
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const config = await this.resolveApplication(appId);
    const page = Math.max(1, query?.page || 1);
    const limit = Math.min(100, Math.max(1, query?.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.DataImportWhereInput = {
      applicationId: config.id,
    };

    if (query?.status && query.status !== 'ALL') {
      where.status = query.status;
    }

    if (query?.constituencyId && query.constituencyId !== 'ALL') {
      where.targetConstituencyId = query.constituencyId;
    }

    if (query?.startDate || query?.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    const [total, items] = await Promise.all([
      prisma.dataImport.count({ where }),
      prisma.dataImport.findMany({
        where,
        include: {
          uploadedBy: {
            select: { id: true, name: true, userCode: true, mobileNumber: true },
          },
          targetConstituency: {
            include: {
              parliament: {
                include: {
                  zone: {
                    include: {
                      state: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const formatted = items.map((item) => ({
      id: item.id,
      applicationId: item.applicationId,
      applicationName: config.organisationName,
      stateName: item.targetConstituency?.parliament?.zone?.state?.name || config.stateName || 'Andhra Pradesh',
      zoneName: item.targetConstituency?.parliament?.zone?.name || 'Central Zone',
      parliamentName: item.targetConstituency?.parliament?.name || config.parliamentName || 'Main Parliament',
      constituencyName: item.targetConstituency?.name || 'Main Constituency',
      constituencyId: item.targetConstituencyId,
      fileName: item.fileName,
      fileSize: item.fileSize,
      mode: item.mode,
      status: item.status,
      totalRecords: item.totalRecords,
      validRecords: item.validRecords,
      importedRecords: item.importedRecords,
      updatedRecords: item.updatedRecords,
      skippedRecords: item.skippedRecords,
      failedRecords: item.failedRecords,
      boothsCount: item.boothsCount,
      voterGroupsCount: item.voterGroupsCount,
      uploadedBy: item.uploadedBy?.name || item.uploadedBy?.userCode || 'System Admin',
      uploadedByMobile: item.uploadedBy?.mobileNumber,
      createdAt: item.createdAt,
      completedAt: item.completedAt,
    }));

    return {
      items: formatted,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Return single import details by ID
   */
  static async getDataImportById(importId: string) {
    const item = await prisma.dataImport.findUnique({
      where: { id: importId },
      include: {
        uploadedBy: { select: { id: true, name: true, userCode: true, mobileNumber: true } },
        targetConstituency: {
          include: {
            parliament: { include: { zone: { include: { state: true } } } },
          },
        },
        errors: { take: 100 },
        mappings: true,
      },
    });

    if (!item) {
      throw new Error(`DataImport with id '${importId}' not found.`);
    }

    return {
      ...item,
      stateName: item.targetConstituency?.parliament?.zone?.state?.name || 'Andhra Pradesh',
      zoneName: item.targetConstituency?.parliament?.zone?.name || 'Central Zone',
      parliamentName: item.targetConstituency?.parliament?.name || 'Main Parliament',
      constituencyName: item.targetConstituency?.name || 'Main Constituency',
    };
  }

  /**
   * Return errors for an import record
   */
  static async getDataImportErrors(importId: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(importId);
    if (!isUuid) return [];

    const errors = await prisma.dataImportError.findMany({
      where: { importId },
      orderBy: { rowNumber: 'asc' },
      take: 500,
    });

    if (errors.length > 0) {
      return errors;
    }

    // Check ImportJob errors fallback
    const job = await prisma.importJob.findUnique({
      where: { id: importId },
    });
    if (job?.errors && Array.isArray(job.errors)) {
      return job.errors;
    }

    return [];
  }

  /**
   * Generate CSV error report string
   */
  static async downloadErrorReport(importId: string): Promise<string> {
    const errors = await this.getDataImportErrors(importId);
    let csv = 'Row Number,Field,Value,Error Message,Severity\n';
    for (const err of errors) {
      const rowNum = (err as any).rowNumber || (err as any).row || '';
      const field = (err as any).field || '';
      const val = `"${String((err as any).value || '').replace(/"/g, '""')}"`;
      const msg = `"${String((err as any).errorMessage || (err as any).error || '').replace(/"/g, '""')}"`;
      const sev = (err as any).severity || 'ERROR';
      csv += `${rowNum},${field},${val},${msg},${sev}\n`;
    }
    return csv;
  }

  /**
   * Return recent import jobs for backward compatibility
   */
  static async getImportHistory(appId: string) {
    const result = await this.getDataImports(appId, { limit: 20 });
    return result.items;
  }

  /**
   * Get detailed error report for an import job
   */
  static async getImportJobErrors(jobId: string) {
    return this.getDataImportErrors(jobId);
  }

  /**
   * Query assigned incharges with jurisdiction metadata
   */
  static async getIncharges(appId: string, level?: string, jurisdictionId?: string) {
    const config = await this.resolveApplication(appId);
    const upperLevel = level?.toUpperCase();

    const assignments = await prisma.userHierarchyAssignment.findMany({
      where: {
        isActive: true,
        ...(upperLevel
          ? {
              roleType: {
                in: this.getRolesForLevel(upperLevel),
              },
            }
          : {}),
        ...(jurisdictionId ? this.getJurisdictionWhere(upperLevel, jurisdictionId) : {}),
      },
      include: {
        user: true,
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
      take: 200,
    });

    return assignments.map((a) => {
      const jType = this.getLevelForRole(a.roleType);
      const jName =
        a.voterGroup?.name ||
        a.booth?.name ||
        a.village?.name ||
        a.mandal?.name ||
        a.constituency?.name ||
        a.parliament?.name ||
        a.zone?.name ||
        a.state?.name ||
        'Unassigned';

      const parentName =
        a.booth?.name ||
        a.village?.name ||
        a.mandal?.name ||
        a.constituency?.name ||
        a.parliament?.name ||
        a.zone?.name ||
        config.stateName ||
        'HQ';

      return {
        id: a.id,
        userId: a.userId,
        userName: a.user.name,
        mobileNumber: a.user.mobileNumber,
        email: a.user.email,
        role: a.roleType,
        inchargeType: this.getInchargeLabel(a.roleType, config.hierarchyLabels),
        jurisdictionType: jType,
        jurisdictionName: jName,
        parentJurisdiction: parentName,
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
   * Assign a user to a specific jurisdiction
   */
  static async assignIncharge(appId: string, body: any, actorId?: string) {
    await this.resolveApplication(appId);
    let userId = body.userId;

    if (!userId) {
      if (!body.name || !body.mobileNumber) {
        throw new Error('Name and mobile number are required to create a new incharge user.');
      }
      let existingUser = await prisma.user.findUnique({
        where: { mobileNumber: body.mobileNumber },
      });

      if (!existingUser) {
        const userCode = `INC-${body.mobileNumber.slice(-4)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
        existingUser = await prisma.user.create({
          data: {
            name: body.name,
            mobileNumber: body.mobileNumber,
            email: body.email || null,
            userCode,
            role: body.role as RoleType,
          },
        });
      }
      userId = existingUser.id;
    }

    const unitLevel = body.unitLevel.toUpperCase();
    const unitId = body.unitId;

    const assignmentData: any = {
      userId,
      roleType: body.role as RoleType,
      isActive: true,
      assignedAt: new Date(),
    };

    switch (unitLevel) {
      case 'STATE':
        assignmentData.stateId = unitId;
        break;
      case 'ZONE':
        assignmentData.zoneId = unitId;
        break;
      case 'PARLIAMENT':
        assignmentData.parliamentId = unitId;
        break;
      case 'CONSTITUENCY':
        assignmentData.constituencyId = unitId;
        break;
      case 'MANDAL':
        assignmentData.mandalId = unitId;
        break;
      case 'VILLAGE':
        assignmentData.villageId = unitId;
        break;
      case 'BOOTH':
        assignmentData.boothId = unitId;
        break;
      case 'VOTER_GROUP':
        assignmentData.voterGroupId = unitId;
        break;
    }

    const assignment = await prisma.userHierarchyAssignment.create({
      data: assignmentData,
      include: { user: true },
    });

    if (unitLevel === 'VOTER_GROUP') {
      await prisma.voterGroup.update({
        where: { id: unitId },
        data: { assignedInchargeId: userId },
      });
    }

    await logAudit({
      action: AuditAction.CREATE,
      entityType: 'UserHierarchyAssignment',
      entityId: assignment.id,
      userId: actorId || userId,
      changes: assignmentData,
    });

    return assignment;
  }

  /**
   * Delete or deactivate incharge jurisdiction assignment
   */
  static async deleteIncharge(appId: string, assignmentId: string, actorId?: string) {
    await this.resolveApplication(appId);
    const existing = await prisma.userHierarchyAssignment.findUnique({
      where: { id: assignmentId },
    });

    if (!existing) {
      throw new Error(`Assignment with ID '${assignmentId}' not found.`);
    }

    await prisma.userHierarchyAssignment.delete({
      where: { id: assignmentId },
    });

    if (existing.voterGroupId) {
      await prisma.voterGroup.update({
        where: { id: existing.voterGroupId },
        data: { assignedInchargeId: null },
      });
    }

    await logAudit({
      action: AuditAction.DELETE,
      entityType: 'UserHierarchyAssignment',
      entityId: assignmentId,
      userId: actorId || existing.userId,
      changes: { deactivatedAssignmentId: assignmentId },
    });

    return { success: true };
  }

  /**
   * Return voters scoped to application and logged-in incharge jurisdiction
   */
  static async getVoters(appId: string, query: any, userScope?: UserHierarchyScope) {
    await this.resolveApplication(appId);
    const page = Math.max(1, parseInt(query?.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(query?.limit || '20', 10)));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (userScope) {
      if (userScope.voterGroupId) where.voterGroupId = userScope.voterGroupId;
      else if (userScope.boothId) where.boothId = userScope.boothId;
      else if (userScope.villageId) where.villageId = userScope.villageId;
      else if (userScope.mandalId) where.mandalId = userScope.mandalId;
      else if (userScope.constituencyId) where.constituencyId = userScope.constituencyId;
    }

    if (query?.boothId) where.boothId = query.boothId;
    if (query?.mandalId) where.mandalId = query.mandalId;
    if (query?.villageId) where.villageId = query.villageId;
    if (query?.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { epicNumber: { contains: query.search, mode: 'insensitive' } },
        { mobileNumber: { contains: query.search } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.voter.count({ where }),
      prisma.voter.findMany({
        where,
        include: {
          mandal: true,
          village: true,
          booth: true,
          voterGroup: true,
        },
        orderBy: { serialNumber: 'asc' },
        skip,
        take: limit,
      }),
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
   * KPI Rollup summary for the application
   */
  static async getSummary(appId: string, userScope?: UserHierarchyScope) {
    const config = await this.resolveApplication(appId);
    const scopeWhere: any = {};

    if (userScope) {
      if (userScope.constituencyId) scopeWhere.constituencyId = userScope.constituencyId;
      if (userScope.mandalId) scopeWhere.mandalId = userScope.mandalId;
      if (userScope.villageId) scopeWhere.villageId = userScope.villageId;
      if (userScope.boothId) scopeWhere.boothId = userScope.boothId;
      if (userScope.voterGroupId) scopeWhere.voterGroupId = userScope.voterGroupId;
    }

    const [totalVoters, verifiedVoters, totalBooths, totalGroups, totalIncharges, totalTasks] =
      await Promise.all([
        prisma.voter.count({ where: scopeWhere }),
        prisma.voter.count({ where: { ...scopeWhere, surveyStatus: 'VERIFIED' } }),
        prisma.booth.count(),
        prisma.voterGroup.count(),
        prisma.userHierarchyAssignment.count({ where: { isActive: true } }),
        prisma.task.count(),
      ]);

    return {
      applicationId: config.id,
      appName: config.organisationName,
      stateName: config.stateName || 'Andhra Pradesh',
      totalVoters,
      verifiedCount: verifiedVoters,
      verificationRate: totalVoters > 0 ? Math.round((verifiedVoters / totalVoters) * 100) : 0,
      totalBooths,
      totalGroups,
      totalIncharges,
      totalTasks,
    };
  }

  private static getRolesForLevel(level: string): RoleType[] {
    switch (level) {
      case 'STATE':
        return [RoleType.STATE_ADMIN, RoleType.HIGH_COMMAND];
      case 'ZONE':
        return [RoleType.ZONE_INCHARGE];
      case 'PARLIAMENT':
        return [RoleType.PARLIAMENT_INCHARGE];
      case 'CONSTITUENCY':
        return [RoleType.CONSTITUENCY_INCHARGE, RoleType.VIEWER];
      case 'MANDAL':
        return [RoleType.MANDAL_INCHARGE];
      case 'VILLAGE':
        return [RoleType.VILLAGE_INCHARGE];
      case 'BOOTH':
        return [RoleType.BOOTH_PRESIDENT, RoleType.BOOTH_INCHARGE, RoleType.POLLING_AGENT];
      case 'VOTER_GROUP':
        return [RoleType.VOTER_100_INCHARGE, RoleType.VOLUNTEER];
      default:
        return [];
    }
  }

  private static getLevelForRole(role: RoleType): string {
    switch (role) {
      case RoleType.STATE_ADMIN:
      case RoleType.HIGH_COMMAND:
        return 'STATE';
      case RoleType.ZONE_INCHARGE:
        return 'ZONE';
      case RoleType.PARLIAMENT_INCHARGE:
        return 'PARLIAMENT';
      case RoleType.CONSTITUENCY_INCHARGE:
        return 'CONSTITUENCY';
      case RoleType.MANDAL_INCHARGE:
        return 'MANDAL';
      case RoleType.VILLAGE_INCHARGE:
        return 'VILLAGE';
      case RoleType.BOOTH_PRESIDENT:
      case RoleType.BOOTH_INCHARGE:
      case RoleType.POLLING_AGENT:
        return 'BOOTH';
      case RoleType.VOTER_100_INCHARGE:
      case RoleType.VOLUNTEER:
        return 'VOTER_GROUP';
      default:
        return 'ORGANISATION';
    }
  }

  private static getInchargeLabel(role: RoleType, labels?: any): string {
    const defaultLabels: Record<string, string> = {
      STATE_ADMIN: 'State Incharge',
      HIGH_COMMAND: 'High Command',
      ZONE_INCHARGE: 'Zone Coordinator',
      PARLIAMENT_INCHARGE: 'Parliament Incharge',
      CONSTITUENCY_INCHARGE: 'Constituency Incharge',
      MANDAL_INCHARGE: 'Mandal President',
      VILLAGE_INCHARGE: 'Village Incharge',
      BOOTH_PRESIDENT: 'Booth President',
      BOOTH_INCHARGE: 'Booth Incharge',
      VOTER_100_INCHARGE: '100 Voter Incharge',
      POLLING_AGENT: 'Polling Agent',
      VOLUNTEER: 'Volunteer',
      VIEWER: 'Viewer',
    };

    const level = this.getLevelForRole(role);
    if (labels && labels[level]) {
      return labels[level];
    }

    return defaultLabels[role] || role;
  }

  private static getJurisdictionWhere(level?: string, jurisdictionId?: string): any {
    if (!jurisdictionId) return {};
    switch (level) {
      case 'STATE':
        return { stateId: jurisdictionId };
      case 'ZONE':
        return { zoneId: jurisdictionId };
      case 'PARLIAMENT':
        return { parliamentId: jurisdictionId };
      case 'CONSTITUENCY':
        return { constituencyId: jurisdictionId };
      case 'MANDAL':
        return { mandalId: jurisdictionId };
      case 'VILLAGE':
        return { villageId: jurisdictionId };
      case 'BOOTH':
        return { boothId: jurisdictionId };
      case 'VOTER_GROUP':
        return { voterGroupId: jurisdictionId };
      default:
        return {};
    }
  }
}
