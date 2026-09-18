import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Upload,
  Plus,
  Trash2,
  Check,
  CheckSquare,
  Square,
  Building,
  Crown,
  Users,
  Layers,
  Home,
  Vote,
  Palette,
  Flag,
  ShieldCheck,
  Sliders,
  ArrowRight,
  RefreshCw,
  X,
  ExternalLink,
  MapPin,
  Compass,
} from 'lucide-react';
import { useCms } from '../../context/CmsContext';
import { AppScope, CmsParty } from '../../lib/cms';

interface CmsStudioProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRoleModules?: () => void;
  mode?: 'setup' | 'editor';
}

interface HierarchyTierDefinition {
  key: string;
  name: string;
  roleName: string;
  subtitle: string;
  levelBadge: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ALL_HIERARCHY_TIERS: HierarchyTierDefinition[] = [
  {
    key: 'STATE',
    name: 'State Level / HQ',
    roleName: 'State Incharge',
    subtitle: 'Statewide command, majority tracker & state telemetry',
    levelBadge: 'L1',
    icon: Building,
  },
  {
    key: 'ZONE',
    name: 'Zone Level',
    roleName: 'Zone Coordinator',
    subtitle: 'Multi-parliament regional cluster oversight',
    levelBadge: 'L2',
    icon: Building,
  },
  {
    key: 'PARLIAMENT',
    name: 'Parliament / Lok Sabha',
    roleName: 'Parliament Incharge',
    subtitle: 'Parliament MP seat war room & assembly sync',
    levelBadge: 'L3',
    icon: Crown,
  },
  {
    key: 'CONSTITUENCY',
    name: 'Assembly Constituency',
    roleName: 'Constituency Incharge',
    subtitle: 'Assembly MLA seat operations & mandal tracking',
    levelBadge: 'L4',
    icon: Users,
  },
  {
    key: 'MANDAL',
    name: 'Mandal / Block',
    roleName: 'Mandal President',
    subtitle: 'Mandal cadre coordination, village clusters & issues',
    levelBadge: 'L5',
    icon: Layers,
  },
  {
    key: 'VILLAGE',
    name: 'Village / Ward',
    roleName: 'Village Incharge',
    subtitle: 'Gram panchayat ward intel & ground outreach',
    levelBadge: 'L6',
    icon: Home,
  },
  {
    key: 'BOOTH',
    name: 'Polling Booth',
    roleName: 'Booth President',
    subtitle: 'Polling booth voting command & live voter turnout',
    levelBadge: 'L7',
    icon: Vote,
  },
  {
    key: 'VOTER_GROUP',
    name: '100-Voter Cluster / Booth Committee',
    roleName: '100 Voter Incharge',
    subtitle: 'Door-to-door micro voter family committee',
    levelBadge: 'L8',
    icon: Users,
  },
];

const PRESET_THEMES = [
  {
    id: 'tdp_gold',
    name: 'TDP Yellow & Red',
    primary: '#F59E0B',
    secondary: '#DC2626',
    accent: '#0F172A',
    partyCode: 'TDP',
  },
  {
    id: 'inc_tricolor',
    name: 'INC Tricolor',
    primary: '#FF6600',
    secondary: '#138808',
    accent: '#0038A8',
    partyCode: 'INC',
  },
  {
    id: 'brs_pink',
    name: 'BRS Rose Pink',
    primary: '#E11D48',
    secondary: '#BE123C',
    accent: '#0F172A',
    partyCode: 'BRS',
  },
  {
    id: 'bjp_saffron',
    name: 'BJP Saffron & Green',
    primary: '#EA580C',
    secondary: '#15803D',
    accent: '#0F172A',
    partyCode: 'BJP',
  },
  {
    id: 'navy_royal',
    name: 'Modern Royal Blue',
    primary: '#2563EB',
    secondary: '#1D4ED8',
    accent: '#0F172A',
    partyCode: 'IND',
  },
  {
    id: 'emerald_green',
    name: 'Forest Emerald',
    primary: '#059669',
    secondary: '#047857',
    accent: '#0F172A',
    partyCode: 'IND',
  },
];

export default function CmsStudio({ isOpen, onClose, onOpenRoleModules, mode = 'setup' }: CmsStudioProps) {
  const { config, parties: existingParties, buildApplication, updateParties } = useCms();

  React.useEffect(() => {
    if (mode === 'setup' && localStorage.getItem('kdp_party_created') === 'true') {
      window.location.hash = '/app';
    }
  }, [mode]);

  // 1. Title
  const [title, setTitle] = useState(config.organisationName || 'Kondapi Connect');

  // 2. Tagline
  const [tagline, setTagline] = useState(
    config.slogan || 'Integrated Voter Management & Command Center'
  );

  // 3. Logo
  const [logoUrl, setLogoUrl] = useState(config.logoUrl || '');

  // 4. Hierarchy Levels Checkboxes
  const [selectedHierarchyLevels, setSelectedHierarchyLevels] = useState<string[]>(() => {
    return config.activeHierarchyLevels && config.activeHierarchyLevels.length > 0
      ? config.activeHierarchyLevels
      : ['CONSTITUENCY', 'MANDAL', 'VILLAGE', 'BOOTH', 'VOTER_GROUP'];
  });

  // 5. Color Theme
  const [primaryColor, setPrimaryColor] = useState(config.primaryColor || '#F59E0B');
  const [secondaryColor, setSecondaryColor] = useState(config.secondaryColor || '#DC2626');
  const [accentColor, setAccentColor] = useState(config.accentColor || '#0F172A');

  // 6. Political Parties
  const [partyList, setPartyList] = useState<CmsParty[]>(() => {
    if (existingParties && existingParties.length > 0) {
      return existingParties;
    }
    return [
      {
        code: 'TDP',
        name: 'Telugu Desam Party',
        shortName: 'TDP',
        primaryColor: '#F59E0B',
        isActive: true,
        sortOrder: 1,
      },
      {
        code: 'YSRCP',
        name: 'YSR Congress Party',
        shortName: 'YSRCP',
        primaryColor: '#004B87',
        isActive: true,
        sortOrder: 2,
      },
      {
        code: 'INC',
        name: 'Indian National Congress',
        shortName: 'INC',
        primaryColor: '#138808',
        isActive: true,
        sortOrder: 3,
      },
      {
        code: 'JSP',
        name: 'Jana Sena Party',
        shortName: 'JSP',
        primaryColor: '#DC2626',
        isActive: true,
        sortOrder: 4,
      },
      {
        code: 'BJP',
        name: 'Bharatiya Janata Party',
        shortName: 'BJP',
        primaryColor: '#EA580C',
        isActive: true,
        sortOrder: 5,
      },
      {
        code: 'OTH',
        name: 'Others / Independent',
        shortName: 'OTH',
        primaryColor: '#64748B',
        isActive: true,
        sortOrder: 6,
      },
    ];
  });

  // State for adding a new party
  const [newPartyName, setNewPartyName] = useState('');
  const [newPartyCode, setNewPartyCode] = useState('');
  const [newPartyColor, setNewPartyColor] = useState('#2563EB');

  // 7. Other Required Information
  const [stateName, setStateName] = useState(config.stateName || 'Andhra Pradesh');
  const [appScope, setAppScope] = useState<AppScope>(config.appScope || 'SINGLE_MLA');
  const [candidateName, setCandidateName] = useState(
    (config as any).candidateName || 'Dr. Dola Sree Bala Veeranjaneya Swamy'
  );
  const [constituencyName, setConstituencyName] = useState(
    config.constituencies?.[0]?.name || 'Kondapi (SC)'
  );

  // Submitting state & feedback
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildSuccess, setBuildSuccess] = useState(false);

  // Hierarchy toggle handler
  const handleToggleHierarchy = (key: string) => {
    setSelectedHierarchyLevels((prev) => {
      if (prev.includes(key)) {
        if (prev.length === 1) {
          return prev; // keep at least one
        }
        return prev.filter((k) => k !== key);
      } else {
        return [...prev, key];
      }
    });
  };

  const handleSelectAllHierarchy = () => {
    setSelectedHierarchyLevels(ALL_HIERARCHY_TIERS.map((t) => t.key));
  };

  const handleSelectStandardHierarchy = () => {
    setSelectedHierarchyLevels(['CONSTITUENCY', 'MANDAL', 'VILLAGE', 'BOOTH']);
  };

  // Logo file upload handler
  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setLogoUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Add Party handler
  const handleAddParty = () => {
    if (!newPartyName.trim()) return;
    const cleanCode = (newPartyCode.trim() || newPartyName.slice(0, 4)).toUpperCase();

    // Check duplicate code
    if (partyList.some((p) => p.code === cleanCode)) {
      alert(`A political party with code "${cleanCode}" already exists.`);
      return;
    }

    const newParty: CmsParty = {
      code: cleanCode,
      name: newPartyName.trim(),
      shortName: cleanCode,
      primaryColor: newPartyColor,
      isActive: true,
      sortOrder: partyList.length + 1,
    };

    setPartyList([...partyList, newParty]);
    setNewPartyName('');
    setNewPartyCode('');
    setNewPartyColor('#2563EB');
  };

  // Remove Party handler
  const handleRemoveParty = (codeToRemove: string) => {
    if (partyList.length <= 1) {
      alert('At least one political party is required.');
      return;
    }
    setPartyList(partyList.filter((p) => p.code !== codeToRemove));
  };

  // Preset Theme selection
  const handleApplyPresetTheme = (preset: (typeof PRESET_THEMES)[0]) => {
    setPrimaryColor(preset.primary);
    setSecondaryColor(preset.secondary);
    setAccentColor(preset.accent);
  };

  // SUBMIT / BUILD APPLICATION HANDLER
  const handleSubmitBuildApplication = async () => {
    if (!title.trim()) {
      alert('Please enter an application title.');
      return;
    }

    if (selectedHierarchyLevels.length === 0) {
      alert('Please select at least one hierarchy level.');
      return;
    }

    setIsBuilding(true);

    try {
      const activePartyCode = partyList[0]?.code || 'TDP';

      const buildPayload = {
        appName: title.trim(),
        organisationName: title.trim(),
        headerTitle: title.trim(),
        slogan: tagline.trim(),
        logoUrl: logoUrl.trim(),
        primaryColor,
        secondaryColor,
        accentColor,
        stateName,
        appScope,
        candidateName,
        activePartyCode,
        activeHierarchyLevels: selectedHierarchyLevels,
        constituencies: [
          {
            name: constituencyName.trim() || 'Assembly Constituency',
            code: 'AC01',
            totalVoters: 185000,
          },
        ],
        politicalParties: partyList,
      };

      // 1. Direct local persistence for zero-lag instant UI reflection
      const currentStoredConfig = (() => {
        try {
          const s = localStorage.getItem('kdp_cms_config');
          return s ? JSON.parse(s) : {};
        } catch {
          return {};
        }
      })();

      const mergedConfig = {
        ...config,
        ...currentStoredConfig,
        ...buildPayload,
        activeHierarchyLevels: selectedHierarchyLevels,
      };

      localStorage.setItem('kdp_cms_config', JSON.stringify(mergedConfig));
      localStorage.setItem('kdp_custom_parties', JSON.stringify(partyList));

      await buildApplication(buildPayload);
      updateParties(partyList);

      if (mode === 'setup') {
        localStorage.setItem('kdp_party_created', 'true');
      }

      setBuildSuccess(true);

      setTimeout(() => {
        setIsBuilding(false);
        if (onOpenRoleModules) {
          onOpenRoleModules();
        } else if (mode === 'setup') {
          window.location.hash = '/app';
        } else {
          onClose();
        }
      }, 500);
    } catch (err) {
      console.error('Failed to build application:', err);
      setIsBuilding(false);
      alert(err instanceof Error ? err.message : 'Failed to save CMS configuration. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-amber-100 py-6 px-4 sm:px-6 lg:px-10">
      {/* Top Bar with Navigation and Status */}
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-xs font-black text-base"
            style={{ backgroundColor: primaryColor }}
          >
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                CMS Studio
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                {mode === 'editor' ? 'Live Configuration' : 'One-Time Party Setup'}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Create your party application below. Once created, CMS Studio will lock and the role modules will be generated.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {mode === 'editor' && (
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50"
            >
              Close
            </button>
          )}
          <span className="px-3.5 py-1.5 rounded-xl bg-amber-100/80 border border-amber-300 text-amber-950 text-xs font-black tracking-wide flex items-center gap-1.5 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Single Party Creation Phase</span>
          </span>
        </div>
      </div>

      {/* Main Content Layout: Form Controls on Left, Sticky Real-Time Preview on Right */}
      <div className="max-w-6xl mx-auto mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ============================================================== */}
        {/* LEFT COLUMN: THE CONFIGURATION FORM */}
        {/* ============================================================== */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-8">
          {/* ============================================================ */}
          {/* 1. APPLICATION TITLE */}
          {/* ============================================================ */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
              <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-900 text-xs font-black flex items-center justify-center">
                1
              </span>
              <label className="text-sm font-black text-slate-900">Application Title</label>
              <span className="text-[11px] text-rose-500 font-bold">*Required</span>
            </div>
            <p className="text-xs text-slate-500">
              Enter the main headline title for this application (displayed on header, splash, and reports).
            </p>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Kondapi TDP Connect or Telangana Congress Connect"
              className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 rounded-xl text-slate-900 text-sm font-semibold focus:border-amber-500 focus:outline-none transition-all"
            />
          </section>

          {/* ============================================================ */}
          {/* 2. APPLICATION TAGLINE */}
          {/* ============================================================ */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
              <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-900 text-xs font-black flex items-center justify-center">
                2
              </span>
              <label className="text-sm font-black text-slate-900">Application Tagline / Slogan</label>
            </div>
            <p className="text-xs text-slate-500">
              Enter the mission tagline or subtitle displayed under the application title.
            </p>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="e.g. Integrated Voter Management & Cadre Command Center"
              className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 rounded-xl text-slate-900 text-sm font-semibold focus:border-amber-500 focus:outline-none transition-all"
            />
          </section>

          {/* ============================================================ */}
          {/* 3. APPLICATION LOGO */}
          {/* ============================================================ */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
              <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-900 text-xs font-black flex items-center justify-center">
                3
              </span>
              <label className="text-sm font-black text-slate-900">Application Logo</label>
            </div>
            <p className="text-xs text-slate-500">
              Upload a logo image file directly or paste an image URL.
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Logo Preview box */}
              <div className="w-20 h-20 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs relative group">
                {logoUrl ? (
                  <>
                    <img src={logoUrl} alt="Logo Preview" className="w-full h-full object-contain p-1" />
                    <button
                      onClick={() => setLogoUrl('')}
                      className="absolute inset-0 bg-slate-900/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-bold cursor-pointer"
                      title="Remove Logo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-white font-black text-xl"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {(partyList[0]?.code || 'APP').slice(0, 3)}
                  </div>
                )}
              </div>

              {/* Upload file + URL input */}
              <div className="flex-1 space-y-2.5 w-full">
                <div className="flex items-center gap-3">
                  <label className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all shadow-2xs">
                    <Upload className="w-3.5 h-3.5 text-slate-600" />
                    <span>Upload Logo Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoFileUpload}
                      className="hidden"
                    />
                  </label>
                  {logoUrl && (
                    <button
                      onClick={() => setLogoUrl('')}
                      className="text-xs text-rose-600 hover:text-rose-700 font-bold cursor-pointer"
                    >
                      Clear Logo
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="Or paste an image web URL (https://...)"
                  className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 rounded-xl text-slate-800 text-xs font-medium focus:border-amber-500 focus:outline-none transition-all"
                />
              </div>
            </div>
          </section>

          {/* ============================================================ */}
          {/* 4. HIERARCHY LEVELS (CHECKBOXES) */}
          {/* ============================================================ */}
          <section className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-900 text-xs font-black flex items-center justify-center">
                  4
                </span>
                <label className="text-sm font-black text-slate-900">
                  Hierarchy Levels ({selectedHierarchyLevels.length} of {ALL_HIERARCHY_TIERS.length} Selected)
                </label>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllHierarchy}
                  className="text-xs text-amber-700 hover:text-amber-800 font-bold cursor-pointer"
                >
                  Select All
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={handleSelectStandardHierarchy}
                  className="text-xs text-slate-600 hover:text-slate-900 font-bold cursor-pointer"
                >
                  Standard 4 Tiers
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              Select the required hierarchy levels using the checkboxes.
              <strong className="text-slate-800">
                {' '}Only the selected levels will be generated as active role cards
              </strong>{' '}
              on the role-based module page!
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {ALL_HIERARCHY_TIERS.map((tier) => {
                const isSelected = selectedHierarchyLevels.includes(tier.key);
                const TierIcon = tier.icon;

                return (
                  <div
                    key={tier.key}
                    onClick={() => handleToggleHierarchy(tier.key)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer select-none flex items-start gap-3 ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/40 ring-1 ring-amber-500 shadow-2xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <div className="pt-0.5">
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-amber-600 fill-amber-50" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-black text-slate-900 flex items-center gap-1.5 truncate">
                          <TierIcon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{tier.name}</span>
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                            isSelected ? 'bg-amber-200/70 text-amber-900' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {tier.levelBadge}
                        </span>
                      </div>
                      <div className="text-[11px] font-bold text-amber-700 mt-0.5">
                        Card: {tier.roleName}
                      </div>
                      <p className="text-[10px] text-slate-500 leading-tight mt-0.5 line-clamp-2">
                        {tier.subtitle}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ============================================================ */}
          {/* 5. COLOR THEME */}
          {/* ============================================================ */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
              <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-900 text-xs font-black flex items-center justify-center">
                5
              </span>
              <label className="text-sm font-black text-slate-900">Color Theme & Palette</label>
            </div>
            <p className="text-xs text-slate-500">
              Select custom colors or pick a curated party palette to theme headers, buttons, and badges.
            </p>

            {/* Quick 1-Click Themes */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Preset Palettes:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PRESET_THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => handleApplyPresetTheme(theme)}
                    className="p-2 rounded-xl border border-slate-200 hover:border-slate-400 bg-slate-50 hover:bg-white text-left transition-all cursor-pointer flex items-center gap-2.5 shadow-2xs"
                  >
                    <div className="flex -space-x-1 shrink-0">
                      <div className="w-4 h-4 rounded-full border border-white" style={{ backgroundColor: theme.primary }} />
                      <div className="w-4 h-4 rounded-full border border-white" style={{ backgroundColor: theme.secondary }} />
                    </div>
                    <span className="text-xs font-bold text-slate-800 truncate">{theme.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Color Pickers */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="space-y-1 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <label className="text-[11px] font-black text-slate-700 block">Primary Brand Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-8 h-8 rounded-lg border border-slate-300 cursor-pointer p-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 uppercase"
                  />
                </div>
              </div>

              <div className="space-y-1 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <label className="text-[11px] font-black text-slate-700 block">Secondary Accent</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-8 h-8 rounded-lg border border-slate-300 cursor-pointer p-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 uppercase"
                  />
                </div>
              </div>

              <div className="space-y-1 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <label className="text-[11px] font-black text-slate-700 block">Neutral Accent</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-8 h-8 rounded-lg border border-slate-300 cursor-pointer p-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 uppercase"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* ============================================================ */}
          {/* 6. POLITICAL PARTIES (MANUAL & DYNAMIC ENTRY) */}
          {/* ============================================================ */}
          <section className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-900 text-xs font-black flex items-center justify-center">
                  6
                </span>
                <label className="text-sm font-black text-slate-900">
                  Political Parties ({partyList.length} Active)
                </label>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                Parties available in voter telemetry & surveys
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Manually enter the names of the political parties that should be available in this application.
            </p>

            {/* Add Party Form */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-amber-600" />
                <span>Add Political Party to this Application</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                <div className="sm:col-span-6">
                  <input
                    type="text"
                    value={newPartyName}
                    onChange={(e) => setNewPartyName(e.target.value)}
                    placeholder="Party Name (e.g. Samajwadi Party)"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-3">
                  <input
                    type="text"
                    value={newPartyCode}
                    onChange={(e) => setNewPartyCode(e.target.value)}
                    placeholder="Code (e.g. SP)"
                    maxLength={6}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 uppercase focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-3 flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2 py-1">
                    <input
                      type="color"
                      value={newPartyColor}
                      onChange={(e) => setNewPartyColor(e.target.value)}
                      className="w-6 h-6 rounded border-0 cursor-pointer p-0 bg-transparent"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAddParty}
                    className="flex-1 px-3 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black rounded-xl text-xs transition-all shadow-2xs cursor-pointer flex items-center justify-center gap-1 active:scale-95"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            </div>

            {/* List of current political parties */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {partyList.map((party) => (
                <div
                  key={party.code}
                  className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-2 shadow-2xs hover:border-slate-300 transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-5 h-5 rounded-lg shrink-0 border border-black/10 shadow-2xs"
                      style={{ backgroundColor: party.primaryColor }}
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-black text-slate-900 truncate">
                        {party.name}
                      </div>
                      <span className="font-mono text-[10px] text-slate-500 font-bold">
                        {party.code}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveParty(party.code)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Remove Party"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* ============================================================ */}
          {/* 7. OTHER REQUIRED INFORMATION */}
          {/* ============================================================ */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
              <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-900 text-xs font-black flex items-center justify-center">
                7
              </span>
              <label className="text-sm font-black text-slate-900">Other Required Information</label>
            </div>
            <p className="text-xs text-slate-500">
              Configure jurisdiction, territorial scope, and candidate details for this deployment.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* State / Region */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">State / Region</label>
                <select
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:border-amber-500 focus:outline-none"
                >
                  <option value="Andhra Pradesh">Andhra Pradesh</option>
                  <option value="Telangana">Telangana</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Delhi NCT">Delhi NCT</option>
                  <option value="National Command">National Command</option>
                </select>
              </div>

              {/* Application Scope */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Territorial Scope</label>
                <select
                  value={appScope}
                  onChange={(e) => setAppScope(e.target.value as AppScope)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:border-amber-500 focus:outline-none"
                >
                  <option value="SINGLE_MLA">Single MLA (1 Assembly Constituency)</option>
                  <option value="PARLIAMENT_MP">Parliament MP (1 Lok Sabha Seat, ~7 MLAs)</option>
                  <option value="ZONE">Regional Zone (~3 MPs, 21 MLAs)</option>
                  <option value="STATE">Statewide Command</option>
                </select>
              </div>

              {/* Candidate / Leader Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Key Leader / Candidate Name</label>
                <input
                  type="text"
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  placeholder="e.g. Dr. Dola Sree Bala Veeranjaneya Swamy"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Main Constituency */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Main Constituency / Unit</label>
                <input
                  type="text"
                  value={constituencyName}
                  onChange={(e) => setConstituencyName(e.target.value)}
                  placeholder="e.g. Kondapi (SC)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </section>

          {/* ============================================================ */}
          {/* SUBMIT / BUILD APPLICATION BUTTON */}
          {/* ============================================================ */}
          <div className="pt-4 border-t border-slate-200">
            <button
              type="button"
              disabled={isBuilding}
              onClick={handleSubmitBuildApplication}
              className="w-full py-4 px-6 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-2xl font-black text-base shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3 cursor-pointer active:scale-98 disabled:opacity-60"
            >
              {isBuilding ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin text-slate-950" />
                  <span>Generating Application & Provisioning Entities...</span>
                </>
              ) : buildSuccess ? (
                <>
                  <Check className="w-5 h-5 text-slate-950" />
                  <span>Application Built! Opening Role-Based Modules...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 fill-slate-950" />
                  <span>Submit / Build Application</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
            <p className="text-center text-xs text-slate-500 font-medium mt-2">
              Automatically builds the application and redirects to the role-based module page with only your configured hierarchy levels.
            </p>
          </div>
        </div>

        {/* ============================================================== */}
        {/* RIGHT COLUMN: STICKY REAL-TIME APPLICATION PREVIEW */}
        {/* ============================================================== */}
        <div className="lg:col-span-4 sticky top-6 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                Live App Preview
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-100 text-emerald-800">
                Live
              </span>
            </div>

            {/* Mockup Card */}
            <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-2xs">
              {/* Header color accent */}
              <div className="h-2 w-full" style={{ backgroundColor: primaryColor }} />

              <div className="p-4 space-y-3 text-center">
                {/* Logo / Monogram */}
                <div className="mx-auto w-14 h-14 rounded-full border-2 border-slate-200 bg-white flex items-center justify-center overflow-hidden shadow-xs">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-0.5" />
                  ) : (
                    <span
                      className="font-black text-lg"
                      style={{ color: primaryColor }}
                    >
                      {(partyList[0]?.code || 'APP').slice(0, 3)}
                    </span>
                  )}
                </div>

                {/* Title & Tagline */}
                <div>
                  <h3 className="font-black text-slate-900 text-sm md:text-base leading-tight">
                    {title || 'Untitled Application'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium mt-1 leading-snug">
                    {tagline || 'Integrated Voter Command'}
                  </p>
                </div>

                {/* Location & Scope */}
                <div className="py-1 px-2.5 rounded-lg bg-slate-50 border border-slate-100 text-[10px] text-slate-600 font-bold flex items-center justify-center gap-1.5">
                  <MapPin className="w-3 h-3 text-amber-500" />
                  <span>{constituencyName} • {stateName}</span>
                </div>

                {/* Active Parties */}
                <div className="pt-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Available Parties ({partyList.length})
                  </div>
                  <div className="flex flex-wrap justify-center gap-1">
                    {partyList.slice(0, 6).map((p) => (
                      <span
                        key={p.code}
                        className="px-2 py-0.5 rounded text-[9px] font-black text-white"
                        style={{ backgroundColor: p.primaryColor }}
                      >
                        {p.code}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Enabled Role Cards Preview */}
                <div className="pt-2 border-t border-slate-100 text-left">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Generated Roles</span>
                    <span className="text-amber-600 font-black">{selectedHierarchyLevels.length} Cards</span>
                  </div>
                  <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
                    {ALL_HIERARCHY_TIERS.filter((t) => selectedHierarchyLevels.includes(t.key)).map((t) => (
                      <div
                        key={t.key}
                        className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-200/60 text-[10px] font-bold text-slate-700 flex items-center justify-between"
                      >
                        <span>{t.roleName}</span>
                        <span className="text-[9px] text-slate-400 font-mono">{t.levelBadge}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Action Button in Sidebar */}
            <button
              type="button"
              disabled={isBuilding}
              onClick={handleSubmitBuildApplication}
              className="w-full py-2.5 px-3 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-60"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Submit / Build Application</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
