import { VoterPreference } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export interface CmsConfig {
  organisationName: string;
  stateName: string;
  defaultLanguage: string;
  activePartyCode: string;
  headerTitle: string;
  slogan?: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  hierarchyLabels: Record<string, string>;
  featureToggles: {
    voterManagement: boolean;
    fakeVoterFlagging: boolean;
    migrationTracking: boolean;
    liveVoteTracking: boolean;
    casteAnalytics: boolean;
    cadreNetwork: boolean;
    training: boolean;
    tasks: boolean;
    groundReports: boolean;
    aiStrategicIntelligence: boolean;
    electionProjection: boolean;
  };
  dashboardConfig?: Record<string, Record<string, boolean>>;
  analyticsConfig?: {
    electionYear: number;
    targetSeats: number;
    majorityMark: number;
    trackedParties: string[];
  };
  aiEnabled: boolean;
}

export interface CmsParty {
  id?: string;
  code: string;
  name: string;
  shortName: string;
  primaryColor: string;
  secondaryColor?: string | null;
  accentColor?: string | null;
  logoUrl?: string | null;
  symbolName?: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface PartyTheme {
  bg: string;
  text: string;
  hex: string;
  lightBg: string;
  border: string;
  darkText: string;
}

export interface PartyPreset {
  id: string;
  name: string;
  code: string;
  stateName: string;
  appName: string;
  slogan: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl: string;
}

export const PARTY_PRESETS: PartyPreset[] = [
  {
    id: 'tdp',
    name: 'Telugu Desam Party (TDP)',
    code: 'TDP',
    stateName: 'Andhra Pradesh',
    appName: 'Kondapi TDP Connect',
    slogan: 'Empowering Cadre, Uniting Citizens for Kondapi 2026',
    primaryColor: '#eab308',
    secondaryColor: '#1e293b',
    accentColor: '#3b82f6',
    logoUrl: 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'inc',
    name: 'Indian National Congress (INC)',
    code: 'INC',
    stateName: 'Telangana / Andhra Pradesh',
    appName: 'Praja Pragathi Connect (INC)',
    slogan: 'Progress, Equality and Social Justice for All',
    primaryColor: '#0284c7',
    secondaryColor: '#16a34a',
    accentColor: '#ea580c',
    logoUrl: 'https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'ysrcp',
    name: 'YSR Congress Party (YSRCP)',
    code: 'YSRCP',
    stateName: 'Andhra Pradesh',
    appName: 'YSRCP Seva Dal Command',
    slogan: 'Navaratnalu for Every Household',
    primaryColor: '#2563eb',
    secondaryColor: '#15803d',
    accentColor: '#38bdf8',
    logoUrl: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'brs',
    name: 'Bharat Rashtra Samithi (BRS)',
    code: 'BRS',
    stateName: 'Telangana',
    appName: 'BRS Gulabi Sena Cockpit',
    slogan: 'KCR Pragathi & Bangaru Telangana',
    primaryColor: '#ec4899',
    secondaryColor: '#831843',
    accentColor: '#6366f1',
    logoUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'jsp',
    name: 'JanaSena Party (JSP)',
    code: 'JSP',
    stateName: 'Andhra Pradesh',
    appName: 'JanaSena Veera Mahila & Sainik Connect',
    slogan: 'Questioning Power, Empowering Common Citizens',
    primaryColor: '#dc2626',
    secondaryColor: '#1e293b',
    accentColor: '#f59e0b',
    logoUrl: 'https://images.unsplash.com/photo-1569974498991-d3c12a504f95?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'bjp',
    name: 'Bharatiya Janata Party (BJP)',
    code: 'BJP',
    stateName: 'National / State Wing',
    appName: 'BJP Sanghatan Vistarak Cockpit',
    slogan: 'Nation First, Development for All (Sabka Saath, Sabka Vikas)',
    primaryColor: '#f97316',
    secondaryColor: '#15803d',
    accentColor: '#1e293b',
    logoUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'aap',
    name: 'Aam Aadmi Party (AAP)',
    code: 'AAP',
    stateName: 'Delhi / Punjab / State Unit',
    appName: 'Aam Aadmi Karyakarta Network',
    slogan: 'Good Governance, Free Education & Healthcare',
    primaryColor: '#0284c7',
    secondaryColor: '#eab308',
    accentColor: '#10b981',
    logoUrl: 'https://images.unsplash.com/photo-1572945753563-804956783604?w=150&auto=format&fit=crop&q=80',
  },
];

export const DEFAULT_CONFIG: CmsConfig = {
  organisationName: 'Kondapi TDP Connect',
  headerTitle: 'Kondapi Assembly Constituency',
  stateName: 'Andhra Pradesh',
  defaultLanguage: 'te',
  activePartyCode: 'TDP',
  primaryColor: '#eab308',
  secondaryColor: '#1e293b',
  accentColor: '#3b82f6',
  slogan: 'Empowering Cadre, Uniting Citizens for Kondapi 2026',
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
  dashboardConfig: {
    CONSTITUENCY_INCHARGE: { showPulseBar: true, showMetricsGrid: true, showLiveVotingHub: true, showWarRoomProjections: true },
    MANDAL_INCHARGE: { showPulseBar: true, showMetricsGrid: true, showLiveVotingHub: true, showVillageBreakdown: true },
    VILLAGE_INCHARGE: { showPulseBar: true, showMetricsGrid: true, showLiveVotingHub: true, showBoothList: true },
    BOOTH_PRESIDENT: { showPulseBar: true, showMetricsGrid: true, showLiveVotingHub: true, showInchargeClusters: true },
    VOTER_100_INCHARGE: { showPulseBar: true, showMetricsGrid: true, showVoterChecklist: true, showLiveTurnoutLogger: true },
  },
  analyticsConfig: {
    electionYear: 2024,
    targetSeats: 175,
    majorityMark: 88,
    trackedParties: ['TDP', 'YSRCP', 'JSP', 'BJP', 'INC', 'OTH'],
  },
  aiEnabled: true,
};

export const DEFAULT_PARTY_THEMES: Record<VoterPreference, PartyTheme> = {
  TDP: { bg: 'bg-yellow-400', text: 'text-yellow-800', hex: '#eab308', lightBg: 'bg-yellow-50', border: 'border-yellow-200', darkText: 'text-yellow-800' },
  YSRCP: { bg: 'bg-blue-600', text: 'text-white', hex: '#2563eb', lightBg: 'bg-blue-50', border: 'border-blue-200', darkText: 'text-blue-800' },
  JSP: { bg: 'bg-red-600', text: 'text-white', hex: '#dc2626', lightBg: 'bg-red-50', border: 'border-red-200', darkText: 'text-red-800' },
  BJP: { bg: 'bg-orange-500', text: 'text-white', hex: '#f97316', lightBg: 'bg-orange-50', border: 'border-orange-200', darkText: 'text-orange-800' },
  INC: { bg: 'bg-sky-500', text: 'text-white', hex: '#0284c7', lightBg: 'bg-sky-50', border: 'border-sky-200', darkText: 'text-sky-950' },
  Neutral: { bg: 'bg-gray-400', text: 'text-gray-800', hex: '#9ca3af', lightBg: 'bg-gray-50', border: 'border-gray-200', darkText: 'text-gray-800' },
  OTH: { bg: 'bg-purple-600', text: 'text-white', hex: '#9333ea', lightBg: 'bg-purple-50', border: 'border-purple-200', darkText: 'text-purple-800' },
};

/**
 * Injects dynamic CSS variables into document.documentElement (:root)
 */
export function applyThemeVariables(primaryColor: string, secondaryColor?: string, accentColor?: string) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  root.style.setProperty('--party-primary', primaryColor);
  root.style.setProperty('--party-secondary', secondaryColor || '#1e293b');
  root.style.setProperty('--party-accent', accentColor || '#3b82f6');
  root.style.setProperty('--party-light', `${primaryColor}1a`);
  root.style.setProperty('--party-glow', `${primaryColor}4d`);
}

export async function fetchCmsConfig(): Promise<{ config: CmsConfig; parties: CmsParty[]; announcements: any[] }> {
  try {
    const res = await fetch(`${API_BASE}/api/cms/config`);
    if (!res.ok) throw new Error('Failed to load CMS config');
    const data = await res.json();
    const payload = data.data || {};

    const rawConfig = payload.config || {};
    const config: CmsConfig = {
      organisationName: rawConfig.organisationName || DEFAULT_CONFIG.organisationName,
      headerTitle: rawConfig.organisationName || DEFAULT_CONFIG.headerTitle,
      stateName: rawConfig.stateName || DEFAULT_CONFIG.stateName,
      defaultLanguage: rawConfig.defaultLanguage || DEFAULT_CONFIG.defaultLanguage,
      activePartyCode: DEFAULT_CONFIG.activePartyCode,
      primaryColor: DEFAULT_CONFIG.primaryColor,
      secondaryColor: DEFAULT_CONFIG.secondaryColor,
      accentColor: DEFAULT_CONFIG.accentColor,
      slogan: DEFAULT_CONFIG.slogan,
      hierarchyLabels: (rawConfig.hierarchyLabels as Record<string, string>) || DEFAULT_CONFIG.hierarchyLabels,
      featureToggles: {
        ...DEFAULT_CONFIG.featureToggles,
        ...(rawConfig.featureToggles as any),
      },
      dashboardConfig: DEFAULT_CONFIG.dashboardConfig,
      analyticsConfig: DEFAULT_CONFIG.analyticsConfig,
      aiEnabled: rawConfig.aiEnabled ?? true,
    };

    const parties = (payload.parties as CmsParty[]) || [];
    const announcements = payload.announcements || [];

    // Apply primary color from active party or config
    const activeParty = parties.find((p) => p.code === config.activePartyCode) || parties[0];
    if (activeParty) {
      config.primaryColor = activeParty.primaryColor;
      config.secondaryColor = activeParty.secondaryColor || '#1e293b';
      config.accentColor = activeParty.accentColor || '#3b82f6';
      applyThemeVariables(config.primaryColor, config.secondaryColor, config.accentColor);
    }

    return { config, parties, announcements };
  } catch (err) {
    console.warn('[CMS] Fallback to default local config:', err);
    applyThemeVariables(DEFAULT_CONFIG.primaryColor, DEFAULT_CONFIG.secondaryColor, DEFAULT_CONFIG.accentColor);
    return { config: DEFAULT_CONFIG, parties: [], announcements: [] };
  }
}

export async function saveCmsConfig(config: Partial<CmsConfig>, token?: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/cms/branding`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        appName: config.organisationName,
        headerTitle: config.headerTitle || config.organisationName,
        primaryColor: config.primaryColor,
        secondaryColor: config.secondaryColor,
        accentColor: config.accentColor,
        activePartyCode: config.activePartyCode,
      }),
    });

    if (config.featureToggles) {
      await fetch(`${API_BASE}/api/cms/features`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(config.featureToggles),
      });
    }

    return res.ok;
  } catch (err) {
    console.error('[CMS] Save failed:', err);
    return false;
  }
}

export function buildPartyThemes(parties: CmsParty[]): Record<VoterPreference, PartyTheme> {
  const themes = { ...DEFAULT_PARTY_THEMES };

  parties.forEach((party) => {
    const key = party.code as VoterPreference;
    if (key) {
      themes[key] = {
        bg: `bg-[${party.primaryColor}]`,
        text: 'text-white',
        hex: party.primaryColor,
        lightBg: `bg-[${party.primaryColor}1a]`,
        border: `border-[${party.primaryColor}4d]`,
        darkText: 'text-slate-900',
      };
    }
  });

  return themes;
}
