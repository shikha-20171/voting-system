/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Crown, Layers, Home, Vote, Users, ShieldCheck, Building, Sparkles, Flag } from 'lucide-react';
import { CommandRole } from '../types';

// Simple mapping for Lucide icons
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Crown,
  Layers,
  Home,
  Vote,
  Users,
  ShieldCheck,
  Building,
  Sparkles,
};

const cardThemes: Record<string, {
  borderClass: string;
  hoverBorderClass: string;
  bgClass: string;
  iconBgClass: string;
  iconColorClass: string;
  subtitleColorClass: string;
  btnBgClass: string;
}> = {
  SUPER_ADMIN: {
    borderClass: 'border-yellow-300',
    hoverBorderClass: 'hover:border-yellow-500',
    bgClass: 'bg-yellow-50/20',
    iconBgClass: 'bg-yellow-100',
    iconColorClass: 'text-yellow-600',
    subtitleColorClass: 'text-yellow-600',
    btnBgClass: 'bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-black',
  },
  STATE_ADMIN: {
    borderClass: 'border-indigo-200',
    hoverBorderClass: 'hover:border-indigo-400',
    bgClass: 'bg-indigo-50/15',
    iconBgClass: 'bg-indigo-100/70',
    iconColorClass: 'text-indigo-600',
    subtitleColorClass: 'text-indigo-500',
    btnBgClass: 'bg-indigo-600 hover:bg-indigo-700 text-white',
  },
  ZONE_INCHARGE: {
    borderClass: 'border-teal-200',
    hoverBorderClass: 'hover:border-teal-400',
    bgClass: 'bg-teal-50/15',
    iconBgClass: 'bg-teal-100/70',
    iconColorClass: 'text-teal-600',
    subtitleColorClass: 'text-teal-500',
    btnBgClass: 'bg-teal-600 hover:bg-teal-700 text-white',
  },
  PARLIAMENT_INCHARGE: {
    borderClass: 'border-fuchsia-200',
    hoverBorderClass: 'hover:border-fuchsia-400',
    bgClass: 'bg-fuchsia-50/15',
    iconBgClass: 'bg-fuchsia-100/70',
    iconColorClass: 'text-fuchsia-600',
    subtitleColorClass: 'text-fuchsia-500',
    btnBgClass: 'bg-fuchsia-600 hover:bg-fuchsia-700 text-white',
  },
  CONSTITUENCY_INCHARGE: {
    borderClass: 'border-amber-200',
    hoverBorderClass: 'hover:border-amber-400',
    bgClass: 'bg-amber-50/15',
    iconBgClass: 'bg-amber-100/70',
    iconColorClass: 'text-amber-500',
    subtitleColorClass: 'text-amber-500',
    btnBgClass: 'bg-amber-400 hover:bg-amber-500 text-white',
  },
  MANDAL_INCHARGE: {
    borderClass: 'border-emerald-200',
    hoverBorderClass: 'hover:border-emerald-400',
    bgClass: 'bg-emerald-50/15',
    iconBgClass: 'bg-emerald-100/70',
    iconColorClass: 'text-emerald-600',
    subtitleColorClass: 'text-emerald-500',
    btnBgClass: 'bg-emerald-500 hover:bg-emerald-600 text-white',
  },
  VILLAGE_INCHARGE: {
    borderClass: 'border-blue-200',
    hoverBorderClass: 'hover:border-blue-400',
    bgClass: 'bg-blue-50/15',
    iconBgClass: 'bg-blue-100/70',
    iconColorClass: 'text-blue-600',
    subtitleColorClass: 'text-blue-500',
    btnBgClass: 'bg-blue-500 hover:bg-blue-600 text-white',
  },
  BOOTH_PRESIDENT: {
    borderClass: 'border-purple-200',
    hoverBorderClass: 'hover:border-purple-400',
    bgClass: 'bg-purple-50/15',
    iconBgClass: 'bg-purple-100/70',
    iconColorClass: 'text-purple-600',
    subtitleColorClass: 'text-purple-500',
    btnBgClass: 'bg-purple-600 hover:bg-purple-700 text-white',
  },
  VOTER_100_INCHARGE: {
    borderClass: 'border-orange-200',
    hoverBorderClass: 'hover:border-orange-400',
    bgClass: 'bg-orange-50/15',
    iconBgClass: 'bg-orange-100/70',
    iconColorClass: 'text-orange-600',
    subtitleColorClass: 'text-orange-500',
    btnBgClass: 'bg-orange-500 hover:bg-orange-600 text-white',
  },
};

interface RoleCardProps {
  role: CommandRole;
  index?: number;
  onClick: () => void;
  key?: React.Key;
}

export default function RoleCard({ role, index, onClick }: RoleCardProps) {
  const IconComponent = iconMap[role.iconName] || Flag;

  return (
    <div
      onClick={onClick}
      id={`role-card-${role.id}`}
      className="relative bg-white border border-slate-200/80 hover:border-slate-300 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between group h-[175px] md:h-[185px]"
    >
      <div>
        {/* Header: Soft Gray Rounded Icon Container & Green Active Dot */}
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 group-hover:text-slate-900 group-hover:bg-slate-100 transition-colors">
            <IconComponent className="w-5 h-5 stroke-[2]" />
          </div>

          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-50" title="Module Active" />
        </div>

        {/* Title & Subtitle */}
        <div className="space-y-1">
          <h3 className="font-bold text-base md:text-[17px] text-slate-900 tracking-tight group-hover:text-slate-950">
            {role.name}
          </h3>
          <p className="text-xs font-medium text-slate-400">
            {role.subtitle}
          </p>
        </div>
      </div>

      {/* Footer subtle hint */}
      <div className="pt-2 flex items-center justify-between text-[11px] font-semibold text-slate-400 group-hover:text-slate-600 transition-colors">
        <span>Click to access dashboard</span>
        <span className="opacity-0 group-hover:opacity-100 transition-opacity font-bold text-slate-800">&rarr;</span>
      </div>
    </div>
  );
}
