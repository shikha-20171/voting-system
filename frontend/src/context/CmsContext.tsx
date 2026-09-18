import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { VoterPreference } from '../types';
import {
  applyThemeVariables,
  buildPartyThemes,
  CmsConfig,
  CmsParty,
  DEFAULT_CONFIG,
  DEFAULT_PARTY_THEMES,
  fetchCmsConfig,
  PARTY_PRESETS,
  PartyPreset,
  PartyTheme,
  saveCmsConfig,
} from '../lib/cms';

interface CmsContextValue {
  config: CmsConfig;
  parties: CmsParty[];
  activeParty: CmsParty | null;
  partyThemes: Record<VoterPreference, PartyTheme>;
  announcements: any[];
  isReady: boolean;
  applyPreset: (presetId: string) => Promise<void>;
  updateConfig: (next: Partial<CmsConfig>) => Promise<void>;
  updateFeatureToggles: (toggles: Partial<CmsConfig['featureToggles']>) => Promise<void>;
  updateHierarchyLabels: (labels: Record<string, string>) => Promise<void>;
  t: (hierarchyLevel: string, fallback?: string) => string;
  isFeatureEnabled: (feature: keyof CmsConfig['featureToggles']) => boolean;
}

const CmsContext = createContext<CmsContextValue>({
  config: DEFAULT_CONFIG,
  parties: [],
  activeParty: null,
  partyThemes: DEFAULT_PARTY_THEMES,
  announcements: [],
  isReady: false,
  applyPreset: async () => {},
  updateConfig: async () => {},
  updateFeatureToggles: async () => {},
  updateHierarchyLabels: async () => {},
  t: (k, fb) => fb || k,
  isFeatureEnabled: () => true,
});

export function CmsProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<CmsConfig>(() => {
    const saved = localStorage.getItem('kdp_cms_config');
    if (saved) {
      try {
        return JSON.parse(saved) as CmsConfig;
      } catch {
        // ignore
      }
    }
    return DEFAULT_CONFIG;
  });

  const [parties, setParties] = useState<CmsParty[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let active = true;

    fetchCmsConfig()
      .then((data) => {
        if (!active) return;
        setConfig((prev) => ({
          ...data.config,
          ...prev, // preserve user session preview tweaks if any
        }));
        setParties(data.parties);
        setAnnouncements(data.announcements);
        setIsReady(true);
      })
      .catch(() => {
        if (active) setIsReady(true);
      });

    return () => {
      active = false;
    };
  }, []);

  // Update document title, favicon, and CSS variables when config changes
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = config.organisationName || 'Kondapi Political Connect';
      applyThemeVariables(config.primaryColor, config.secondaryColor, config.accentColor);
      localStorage.setItem('kdp_cms_config', JSON.stringify(config));
    }
  }, [config]);

  const activeParty = useMemo(() => {
    return parties.find((p) => p.code === config.activePartyCode) || parties[0] || null;
  }, [parties, config.activePartyCode]);

  const partyThemes = useMemo(() => buildPartyThemes(parties), [parties]);

  const applyPreset = async (presetId: string) => {
    const preset = PARTY_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    const nextConfig: CmsConfig = {
      ...config,
      organisationName: preset.appName,
      headerTitle: preset.appName,
      stateName: preset.stateName,
      activePartyCode: preset.code,
      primaryColor: preset.primaryColor,
      secondaryColor: preset.secondaryColor,
      accentColor: preset.accentColor,
      slogan: preset.slogan,
      logoUrl: preset.logoUrl,
    };

    setConfig(nextConfig);
    applyThemeVariables(preset.primaryColor, preset.secondaryColor, preset.accentColor);
    await saveCmsConfig(nextConfig);
  };

  const updateConfig = async (next: Partial<CmsConfig>) => {
    const merged = { ...config, ...next };
    setConfig(merged);
    await saveCmsConfig(merged);
  };

  const updateFeatureToggles = async (toggles: Partial<CmsConfig['featureToggles']>) => {
    const nextToggles = { ...config.featureToggles, ...toggles };
    const merged = { ...config, featureToggles: nextToggles };
    setConfig(merged);
    await saveCmsConfig(merged);
  };

  const updateHierarchyLabels = async (labels: Record<string, string>) => {
    const nextLabels = { ...config.hierarchyLabels, ...labels };
    const merged = { ...config, hierarchyLabels: nextLabels };
    setConfig(merged);
    await saveCmsConfig(merged);
  };

  const t = (hierarchyLevel: string, fallback?: string): string => {
    return config.hierarchyLabels[hierarchyLevel] || fallback || hierarchyLevel;
  };

  const isFeatureEnabled = (feature: keyof CmsConfig['featureToggles']): boolean => {
    return config.featureToggles[feature] ?? true;
  };

  return (
    <CmsContext.Provider
      value={{
        config,
        parties,
        activeParty,
        partyThemes,
        announcements,
        isReady,
        applyPreset,
        updateConfig,
        updateFeatureToggles,
        updateHierarchyLabels,
        t,
        isFeatureEnabled,
      }}
    >
      {children}
    </CmsContext.Provider>
  );
}

export function useCms() {
  const context = useContext(CmsContext);
  if (!context) {
    throw new Error('useCms must be used within a CmsProvider');
  }
  return context;
}
