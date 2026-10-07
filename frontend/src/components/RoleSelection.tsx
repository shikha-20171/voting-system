import React, { useMemo } from 'react';
import { CommandRole, RoleType } from '../types';
import RoleCard from './RoleCard';
import { useCms } from '../context/CmsContext';
import { Layers, ChevronDown, Check, Zap } from 'lucide-react';
import { getDemoAccountsForRole } from '../lib/demoAccounts';

interface RoleSelectionProps {
  onSelectRole: (role: CommandRole) => void;
  onLock: () => void;
  onChangePasscode: () => void;
  isPanelLocked: boolean;
}

export default function RoleSelection({ onSelectRole, onLock, onChangePasscode, isPanelLocked }: RoleSelectionProps) {
  const { config, t, applications, switchApplication, activeApplicationId } = useCms();

  const enabledTiers = useMemo(() => {
    if (Array.isArray(config.activeHierarchyLevels) && config.activeHierarchyLevels.length > 0) {
      return config.activeHierarchyLevels;
    }
    return ['VOTER_GROUP', 'BOOTH', 'VILLAGE', 'MANDAL', 'CONSTITUENCY'];
  }, [config.activeHierarchyLevels]);

  const activeRoles = useMemo<CommandRole[]>(() => {
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
        name: t('VOTER_GROUP', '100 Voters Incharge'),
        subtitle: 'Voter Family Cluster Committee',
        description: '100-voter cluster door-to-door outreach.',
        path: '/100-voter',
        iconName: 'Users',
      },
    ];

    // Filter strictly to enabled hierarchy tiers:
    return allRoles.filter((r) => enabledTiers.includes(r.levelKey));
  }, [config, t, enabledTiers]);

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
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6 sm:py-8 space-y-7 animate-fade-in" id="role-selection-section">
      {/* Current Workspace & Application Switcher Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-white rounded-3xl border border-slate-200/90 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-sm shrink-0"
            style={{ backgroundColor: config.primaryColor || '#f59e0b' }}
          >
            {(config.activePartyCode || 'APP').slice(0, 3)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Application</span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800">
                LIVE
              </span>
            </div>

            <div className="flex items-center gap-2 mt-0.5">
              {applications.length > 1 ? (
                <div className="relative inline-block">
                  <select
                    value={activeApplicationId || config.organisationName || ''}
                    onChange={(e) => switchApplication(e.target.value)}
                    className="text-base sm:text-lg font-black text-slate-900 bg-transparent pr-8 cursor-pointer outline-none border-b-2 border-dashed border-amber-400/80 hover:border-amber-500 transition appearance-none"
                  >
                    {applications.map((app) => (
                      <option key={app.id || app.configKey} value={app.id || app.configKey}>
                        {app.appName || app.headerTitle || app.name} ({app.partyCode || app.activePartyCode || 'APP'}) {app.isDefault ? '• Default' : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-500 absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              ) : (
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  {config.organisationName || config.headerTitle || 'Kondapi Connect'}
                </h3>
              )}
            </div>

            <p className="text-xs text-slate-500 font-medium mt-1">
              {scopeLabel} • {config.stateName || 'Andhra Pradesh'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 font-semibold text-xs text-amber-900">
            <Layers className="w-3.5 h-3.5 text-amber-600" />
            <span>{activeRoles.length} Role Modules Configured</span>
          </div>
        </div>
      </div>

      {/* Enabled Hierarchy Tiers Strip */}
      <div className="flex items-center gap-2 px-1 text-xs text-slate-600 overflow-x-auto pb-1">
        <span className="font-bold text-slate-500 shrink-0">Application Modules:</span>
        <div className="flex flex-wrap items-center gap-1.5">
          {enabledTiers.map((tier) => (
            <span
              key={tier}
              className="px-2.5 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-bold text-slate-800"
            >
              {tier.replace('_', ' ')}
            </span>
          ))}
        </div>
      </div>

      {/* Title block */}
      <div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-1 gap-2"
        id="role-selection-bar"
      >
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Select Command Role
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Choose your assigned command module to access role-specific intelligence, field operations, and reporting for <span className="font-bold text-slate-700">{config.organisationName}</span>.
          </p>
        </div>
      </div>

      {/* Quick Demo Access Bar */}
      <div className="rounded-3xl border border-amber-200/90 bg-gradient-to-r from-amber-500/10 via-amber-50/50 to-emerald-500/10 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-500 text-slate-950 font-black shrink-0">
              <Zap size={16} className="fill-slate-950" />
            </span>
            <div>
              <h3 className="text-sm font-black text-slate-900 tracking-tight">
                Quick Demo Accounts (All Roles Pre-Configured)
              </h3>
              <p className="text-xs text-slate-600">
                Click any role pill below to open login with instant 1-click access and pre-seeded field data.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-amber-900 bg-amber-100/90 px-3 py-1 rounded-full shrink-0 border border-amber-200">
            {activeRoles.length} Roles Active
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {activeRoles.map((role) => {
            const demoAcc = getDemoAccountsForRole(role.id)[0];
            return (
              <button
                key={role.id}
                onClick={() => onSelectRole(role)}
                className="group flex items-center gap-2 rounded-2xl border border-slate-200/90 bg-white/90 px-3 py-2 text-xs font-bold text-slate-800 shadow-2xs hover:border-amber-400 hover:bg-white hover:shadow-sm transition"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-500 group-hover:scale-125 transition" />
                <span className="font-extrabold text-slate-900">{role.name}:</span>
                <span className="text-slate-600 font-medium">{demoAcc?.name || 'Demo'}</span>
                <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                  {demoAcc?.mobile.slice(-4)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main card grid: Dynamically rendered according to selected hierarchy tiers */}
      {activeRoles.length === 0 ? (
        <div className="p-10 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <p className="text-slate-600 font-bold text-sm">
            No role modules are enabled for this application in the Admin hierarchy configuration.
          </p>
          <p className="text-xs text-slate-400">
            Enable modules in the Admin Console &gt; Party Applications to activate role command cards here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5" id="roles-cards-grid">
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
