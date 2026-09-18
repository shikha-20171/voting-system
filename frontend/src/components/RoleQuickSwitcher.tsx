import React, { useState, useMemo } from 'react';
import {
  Building,
  Crown,
  Layers,
  Home,
  Vote,
  Users,
  Sparkles,
  ChevronDown,
  ChevronUp,
  LogOut,
} from 'lucide-react';
import { RoleType, UserSession } from '../types';
import { getMockSessionForRole } from '../lib/api';
import { useCms } from '../context/CmsContext';

interface RoleQuickSwitcherProps {
  currentRole?: RoleType;
  currentPath: string;
  onSwitchSession: (session: UserSession) => void;
  onLogout: () => void;
}

const SWITCHER_ITEMS: {
  role: RoleType | 'ROLES';
  label: string;
  shortLabel: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}[] = [
  { role: 'ROLES', label: 'Role Command Center (Selection)', shortLabel: 'Role Selection', path: '/app', icon: Users, color: '#10b981' },
  { role: 'ROLES', label: 'CMS Platform Admin', shortLabel: 'Platform Admin', path: '/platform-admin', icon: Sparkles, color: '#f59e0b' },
  { role: 'ROLES', label: 'Assign Data (Import)', shortLabel: 'Assign Data', path: '/assign-data', icon: Layers, color: '#06b6d4' },
  { role: 'ROLES', label: 'Assign Incharges', shortLabel: 'Assign Incharges', path: '/assign-incharges', icon: Users, color: '#ec4899' },
  { role: 'STATE_ADMIN', label: 'State Incharge', shortLabel: 'State', path: '/state', icon: Building, color: '#f59e0b' },
  { role: 'PARLIAMENT_INCHARGE', label: 'Parliament Incharge (MP)', shortLabel: 'Parliament', path: '/parliament', icon: Crown, color: '#3b82f6' },
  { role: 'CONSTITUENCY_INCHARGE', label: 'Constituency Incharge (MLA)', shortLabel: 'Constituency', path: '/constituency', icon: Crown, color: '#06b6d4' },
  { role: 'MANDAL_INCHARGE', label: 'Mandal President', shortLabel: 'Mandal', path: '/mandal', icon: Layers, color: '#10b981' },
  { role: 'VILLAGE_INCHARGE', label: 'Village Incharge', shortLabel: 'Village', path: '/village', icon: Home, color: '#84cc16' },
  { role: 'BOOTH_PRESIDENT', label: 'Booth President', shortLabel: 'Booth', path: '/booth', icon: Vote, color: '#eab308' },
  { role: 'VOTER_100_INCHARGE', label: '100-Voter Incharge', shortLabel: '100-Voter', path: '/100-voter', icon: Users, color: '#f97316' },
];

const roleLevelMap: Record<string, string> = {
  STATE_ADMIN: 'STATE',
  PARLIAMENT_INCHARGE: 'PARLIAMENT',
  CONSTITUENCY_INCHARGE: 'CONSTITUENCY',
  MANDAL_INCHARGE: 'MANDAL',
  VILLAGE_INCHARGE: 'VILLAGE',
  BOOTH_PRESIDENT: 'BOOTH',
  VOTER_100_INCHARGE: 'VOTER_GROUP',
};

export default function RoleQuickSwitcher({
  currentRole,
  currentPath,
  onSwitchSession,
  onLogout,
}: RoleQuickSwitcherProps) {
  const { config } = useCms();
  const [isExpanded, setIsExpanded] = useState(false);

  const enabledLevels = useMemo(() => {
    if (Array.isArray(config.activeHierarchyLevels) && config.activeHierarchyLevels.length > 0) {
      return config.activeHierarchyLevels;
    }
    try {
      const saved = localStorage.getItem('kdp_cms_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.activeHierarchyLevels) && parsed.activeHierarchyLevels.length > 0) {
          return parsed.activeHierarchyLevels;
        }
      }
    } catch {}
    return ['CONSTITUENCY', 'MANDAL', 'VILLAGE', 'BOOTH'];
  }, [config.activeHierarchyLevels]);

  const visibleItems = useMemo(() => {
    return SWITCHER_ITEMS.filter((item) => {
      const level = roleLevelMap[item.role];
      if (!level) return true; // ROLES
      return enabledLevels.includes(level);
    });
  }, [enabledLevels]);

  const handleSelect = (item: (typeof SWITCHER_ITEMS)[number]) => {
    if (item.path) {
      window.location.hash = item.path;
      if (item.role !== 'ROLES') {
        const newSession = getMockSessionForRole(item.role);
        onSwitchSession(newSession);
      }
      return;
    }
  };

  const activeItem =
    visibleItems.find((i) => {
      if (currentPath === i.path) return true;
      if ((currentPath === '/app' || currentPath === '/roles') && i.path === '/app') return true;
      return i.role === currentRole;
    }) ||
    visibleItems[0] ||
    SWITCHER_ITEMS[0];

  return (
    <div className="w-full bg-slate-950 border-b border-slate-800 text-slate-200 z-50 sticky top-0 text-xs select-none shadow-md">
      <div className="max-w-7xl mx-auto px-3 py-1.5 flex items-center justify-between gap-2">
        {/* Left: Active Module Indicator & Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-amber-400 font-bold transition cursor-pointer"
            title="Click to jump across any VIAP module"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Module Switcher:</span>
            <span className="text-white font-extrabold">{activeItem.shortLabel}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
          </button>

          <span className="text-[11px] text-slate-400 hidden lg:inline">
            Active Hierarchy: <span className="text-amber-400 font-semibold font-mono">{enabledLevels.length} Levels</span>
          </span>
        </div>

        {/* Center/Right: Quick Action Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar">
          {visibleItems.slice(0, 8).map((item) => {
            const Icon = item.icon;
            const isCurrent = (item.role === 'ROLES' && (currentPath === '/app' || currentPath === '/roles')) || item.role === currentRole;
            return (
              <button
                key={item.role}
                onClick={() => handleSelect(item)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition whitespace-nowrap cursor-pointer ${
                  isCurrent
                    ? 'bg-amber-400 text-slate-950 shadow-xs scale-102'
                    : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{item.shortLabel}</span>
              </button>
            );
          })}

          <button
            onClick={onLogout}
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 border border-rose-500/30 text-[11px] font-bold transition cursor-pointer ml-1"
            title="Log out or switch account"
          >
            <LogOut className="w-3 h-3" />
            <span className="hidden md:inline">Exit</span>
          </button>
        </div>
      </div>

      {/* Expanded Grid for complete selection */}
      {isExpanded && (
        <div className="bg-slate-900/95 backdrop-blur-md border-t border-slate-800 p-4 animate-fade-in shadow-2xl">
          <div className="max-w-7xl mx-auto">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2.5 flex items-center justify-between">
              <span>Direct Jump to Active Hierarchy Modules ({visibleItems.length})</span>
              <span className="text-slate-500">Press ESC or click button above to close</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const isCurrent = (item.role === 'ROLES' && (currentPath === '/app' || currentPath === '/roles')) || item.role === currentRole;
                return (
                  <button
                    key={item.role}
                    onClick={() => {
                      handleSelect(item);
                      setIsExpanded(false);
                    }}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      isCurrent
                        ? 'bg-amber-400 text-slate-950 border-amber-300 font-black shadow-md'
                        : 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700/80 text-slate-200'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isCurrent ? 'bg-slate-950 text-amber-400' : 'bg-slate-900 text-slate-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold truncate">{item.label}</div>
                      <div className={`text-[10px] truncate ${isCurrent ? 'text-slate-900 font-semibold' : 'text-slate-400'}`}>
                        {item.path}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
