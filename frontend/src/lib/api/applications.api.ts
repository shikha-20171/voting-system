import { apiFetch } from './client';

export interface ApplicationHierarchy {
  applicationId: string;
  configKey: string;
  appName: string;
  appScope: string;
  activeHierarchyLevels: string[];
  hierarchyLabels: Record<string, string>;
  state: any;
  constituencies: any[];
}

export interface ValidationReport {
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

export interface ImportSummary {
  jobId: string;
  status: string;
  totalRows: number;
  successCount: number;
  updatedCount: number;
  skippedCount: number;
  errorCount: number;
  errors: any[];
}

export interface InchargeRecord {
  id: string;
  userId: string;
  userName: string;
  mobileNumber: string;
  email?: string;
  role: string;
  inchargeType: string;
  jurisdictionType: string;
  jurisdictionName: string;
  parentJurisdiction: string;
  status: 'ACTIVE' | 'INACTIVE';
  assignedAt: string;
  details: {
    stateId?: string;
    zoneId?: string;
    parliamentId?: string;
    constituencyId?: string;
    mandalId?: string;
    villageId?: string;
    boothId?: string;
    voterGroupId?: string;
  };
}

export interface ApplicationSummaryKpis {
  applicationId: string;
  appName: string;
  stateName: string;
  totalVoters: number;
  totalBooths: number;
  totalGroups: number;
  totalIncharges: number;
  totalTasks: number;
  verifiedCount: number;
  verificationRate: number;
}

export async function fetchCmsApplications(): Promise<any[]> {
  const res = await apiFetch<any>('/api/cms/applications');
  return res.data || res || [];
}

export async function fetchApplicationHierarchy(appId: string): Promise<ApplicationHierarchy> {
  const res = await apiFetch<any>(`/api/applications/${encodeURIComponent(appId)}/hierarchy`);
  return res.data || res;
}

export async function fetchHierarchyNodes(
  appId: string,
  level: string,
  parentId?: string,
): Promise<any[]> {
  const qs = parentId ? `?parentId=${encodeURIComponent(parentId)}` : '';
  const res = await apiFetch<any>(
    `/api/applications/${encodeURIComponent(appId)}/hierarchy/${encodeURIComponent(level)}${qs}`,
  );
  return res.data || res || [];
}

export async function validateApplicationData(
  appId: string,
  level: string,
  rows: any[],
): Promise<ValidationReport> {
  const res = await apiFetch<any>(`/api/applications/${encodeURIComponent(appId)}/data/validate`, {
    method: 'POST',
    body: JSON.stringify({ level, rows }),
  });
  return res.data || res;
}

export async function importApplicationData(
  appId: string,
  payload: {
    level: string;
    rows: any[];
    importMode?: 'APPEND' | 'REPLACE';
    voterGroupSize?: number;
    fileName?: string;
  },
): Promise<ImportSummary> {
  const res = await apiFetch<any>(`/api/applications/${encodeURIComponent(appId)}/data/import`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data || res;
}

export async function fetchImportHistory(appId: string): Promise<any[]> {
  const res = await apiFetch<any>(`/api/applications/${encodeURIComponent(appId)}/data/history`);
  return res.data || res || [];
}

export async function fetchImportErrors(jobId: string): Promise<any> {
  const res = await apiFetch<any>(`/api/applications/data/errors/${encodeURIComponent(jobId)}`);
  return res.data || res;
}

export async function fetchApplicationIncharges(
  appId: string,
  level?: string,
  jurisdictionId?: string,
): Promise<InchargeRecord[]> {
  const params = new URLSearchParams();
  if (level) params.append('level', level);
  if (jurisdictionId) params.append('jurisdictionId', jurisdictionId);
  const qs = params.toString() ? `?${params.toString()}` : '';
  const res = await apiFetch<any>(
    `/api/applications/${encodeURIComponent(appId)}/incharges${qs}`,
  );
  return res.data || res || [];
}

export async function assignApplicationIncharge(
  appId: string,
  payload: {
    userId?: string;
    name?: string;
    mobileNumber?: string;
    email?: string;
    role: string;
    unitLevel: string;
    unitId: string;
    parentUnitId?: string;
    reason?: string;
  },
): Promise<any> {
  const res = await apiFetch<any>(`/api/applications/${encodeURIComponent(appId)}/incharges`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data || res;
}

export async function deleteApplicationIncharge(
  appId: string,
  inchargeId: string,
): Promise<any> {
  const res = await apiFetch<any>(
    `/api/applications/${encodeURIComponent(appId)}/incharges/${encodeURIComponent(inchargeId)}`,
    {
      method: 'DELETE',
    },
  );
  return res.data || res;
}

export async function fetchApplicationSummary(appId: string): Promise<ApplicationSummaryKpis> {
  const res = await apiFetch<any>(`/api/applications/${encodeURIComponent(appId)}/reports/summary`);
  return res.data || res;
}
