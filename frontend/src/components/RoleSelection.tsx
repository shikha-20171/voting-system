import React, { useMemo } from 'react';
import { CommandRole, RoleType } from '../types';
import RoleCard from './RoleCard';
import { ShieldCheck, Info, UserCheck, Layers, Sparkles, Sliders } from 'lucide-react';
import { useCms } from '../context/CmsContext';

interface RoleSelectionProps {
  onSelectRole: (role: CommandRole) => void;
  onLock: () => void;
  onChangePasscode: () => void;
  isPanelLocked: boolean;
}

export default function RoleSelection({ onSelectRole, onLock, onChangePasscode, isPanelLocked }: RoleSelectionProps) {
  const { config, t } = useCms();

  const activeRoles = useMemo<CommandRole[]>(() => {
    let enabledLevels: string[] | null = null;
    if (Array.isArray(config.activeHierarchyLevels) && config.activeHierarchyLevels.length > 0) {
      enabledLevels = config.activeHierarchyLevels;
    } else {
      try {
        const saved = localStorage.getItem('kdp_cms_config');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed.activeHierarchyLevels) && parsed.activeHierarchyLevels.length > 0) {
            enabledLevels = parsed.activeHierarchyLevels;
          }
        }
      } catch {}
    }

    const safeLevels = enabledLevels || ['CONSTITUENCY', 'MANDAL', 'VILLAGE', 'BOOTH'];

    const allRoles: (CommandRole & { levelKey: string })[] = [
      // 1. State Incharge
      {
        id: 'STATE_ADMIN',
        levelKey: 'STATE',
        name: t('STATE', 'State Incharge'),
        subtitle: `${config.stateName || 'State'} Command`,
        description: 'Statewide command & majority telemetry.',
        path: '/state',
        iconName: 'Building',
      },
      // 2. Zone Coordinator
      {
        id: 'ZONE_INCHARGE' as any,
        levelKey: 'ZONE',
        name: t('ZONE', 'Zone Coordinator'),
        subtitle: 'Multi-Parliament Oversight',
        description: 'Multi-Parliament zone level coordination.',
        path: '/zone',
        iconName: 'Building',
      },
      // 3. Parliament Incharge
      {
        id: 'PARLIAMENT_INCHARGE' as any,
        levelKey: 'PARLIAMENT',
        name: t('PARLIAMENT', 'Parliament Incharge'),
        subtitle: `${config.parliamentName || 'Lok Sabha'} MP Seat`,
        description: 'Parliament MP War Room Command.',
        path: '/parliament',
        iconName: 'Crown',
      },
      // 4. Constituency Incharge
      {
        id: 'CONSTITUENCY_INCHARGE',
        levelKey: 'CONSTITUENCY',
        name: t('CONSTITUENCY', 'Constituency Incharge'),
        subtitle: `${config.constituencies?.[0]?.name || 'Assembly'} MLA Seat`,
        description: 'Assembly Constituency MLA operations.',
        path: '/constituency',
        iconName: 'Users',
      },
      // 5. Mandal President
      {
        id: 'MANDAL_INCHARGE',
        levelKey: 'MANDAL',
        name: t('MANDAL', 'Mandal President'),
        subtitle: 'Mandal & Block Division',
        description: 'Mandal level cadre & booth oversight.',
        path: '/mandal/dashboard',
        iconName: 'Layers',
      },
      // 6. Village Incharge
      {
        id: 'VILLAGE_INCHARGE',
        levelKey: 'VILLAGE',
        name: t('VILLAGE', 'Village Incharge'),
        subtitle: 'Gram Panchayat & Local Ward',
        description: 'Village ward & local community unit.',
        path: '/village',
        iconName: 'Home',
      },
      // 7. Booth President
      {
        id: 'BOOTH_PRESIDENT',
        levelKey: 'BOOTH',
        name: t('BOOTH', 'Booth President'),
        subtitle: 'Polling Booth Management',
        description: 'Polling booth command & voter turnout.',
        path: '/booth/dashboard',
        iconName: 'Vote',
      },
      // 8. 100 Voter Incharge
      {
        id: 'VOTER_100_INCHARGE',
        levelKey: 'VOTER_GROUP',
        name: t('VOTER_GROUP', '100 Voter Incharge'),
        subtitle: 'Voter Family Cluster Committee',
        description: '100-voter cluster door-to-door outreach.',
        path: '/100-voter',
        iconName: 'Users',
      },
    ];

    return allRoles.filter((role) => enabledLevels.includes(role.levelKey));
  }, [config, t]);

  const scopeLabel = useMemo(() => {
    switch (config.appScope) {
      case 'SINGLE_MLA':
        return 'Configured for 1 MLA Candidate';
      case 'PARLIAMENT_MP':
        return `Configured for 1 MP + ${config.constituencies?.length || 7} MLA Candidates`;
      case 'ZONE':
        return 'Configured for Zone Level (~3 MPs + 21 MLAs)';
      case 'STATE':
        return `Statewide Command (${config.stateName})`;
      default:
        return 'Configured Jurisdictional Hierarchy';
    }
  }, [config]);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 md:px-6 py-4 space-y-6 animate-fade-in" id="role-selection-section">
      {/* Current Workspace & Switch to CMS Studio Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-xs"
            style={{ backgroundColor: config.primaryColor || '#f59e0b' }}
          >
            {(config.activePartyCode || 'APP').slice(0, 3)}
          </div>
          <div>
            <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <span>Active Workspace: {config.organisationName || 'Kondapi Connect'}</span>
              <span className="px-2 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800">
                LIVE
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium">
              {scopeLabel} • {config.stateName || 'Andhra Pradesh'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => {
              window.location.hash = '/cms';
            }}
            className="px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer bg-slate-50 hover:bg-slate-100"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-700" />
            <span>CMS Studio</span>
          </button>
        </div>
      </div>

      {/* Title block */}
      <div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-2 gap-4"
        id="role-selection-bar"
      >
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            Select Command Role
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            {activeRoles.length} role module{activeRoles.length === 1 ? '' : 's'} active for your organization
          </p>
        </div>
      </div>

      {/* Main card grid: Dynamically rendered according to selected hierarchy tiers */}
      {activeRoles.length === 0 ? (
        <div className="p-10 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <p className="text-slate-600 font-bold text-sm">
            No hierarchy levels are currently active.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="roles-cards-grid">
          {activeRoles.map((role, idx) => (
            <RoleCard
              key={role.id}
              role={role}
              index={idx}
              onClick={() => onSelectRole(role)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
