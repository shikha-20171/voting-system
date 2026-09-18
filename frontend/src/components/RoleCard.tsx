/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Crown, Layers, Home, Vote, Users, ShieldCheck, Building, Sparkles } from 'lucide-react';
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
    subtitleColorClass: 'text-emerald-500', // Matches "Mandal Level Management" green color in the image
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
  onClick: () => void;
  key?: React.Key;
}

export default function RoleCard({ role, onClick }: RoleCardProps) {
  const IconComponent = iconMap[role.iconName] || ShieldCheck;
  
  // Retrieve the appropriate theme based on role ID, falling back to constituency defaults if not found
  const theme = cardThemes[role.id] || cardThemes.CONSTITUENCY_INCHARGE;

  return (
    <div
      onClick={onClick}
      id={`role-card-${role.id}`}
      className={`relative overflow-hidden bg-white border-2 ${theme.borderClass} ${theme.hoverBorderClass} ${theme.bgClass} rounded-2xl p-4 md:p-5 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 cursor-pointer flex flex-col justify-between h-[255px] md:h-[265px] lg:h-[275px]`}
    >
      <div>
        {/* Card Header: Beautiful themed Icon Box & Active Pulse Badge */}
        <div className="flex items-start justify-between mb-3 md:mb-4">
          <div className={`p-2.5 ${theme.iconBgClass} rounded-xl ${theme.iconColorClass} transition-transform duration-300 hover:scale-105`}>
            <IconComponent className="w-5.5 h-5.5 md:w-6 md:h-6 stroke-[2.5]" />
          </div>

          {/* Active Status Indicator */}
          <div className="flex items-center gap-1 bg-emerald-50/80 border border-emerald-100 px-2 py-0.5 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[9px] uppercase font-black text-emerald-600 tracking-wider">Active</span>
          </div>
        </div>

        {/* Text Details */}
        <div className="space-y-0.5">
          <h3 className="font-extrabold text-base md:text-lg text-slate-900 tracking-tight leading-snug">
            {role.name}
          </h3>
          
          <p className={`text-[10px] md:text-xs font-black uppercase tracking-wide ${theme.subtitleColorClass}`}>
            {role.subtitle}
          </p>

          <p className="text-[11px] md:text-xs font-semibold text-slate-400 leading-normal mt-1.5 pt-0.5">
            {role.description}
          </p>
        </div>
      </div>

      {/* Full-width Access Portal Button inside card */}
      <div className="mt-3 md:mt-4">
        <button
          className={`w-full py-2 rounded-xl font-black text-[11px] md:text-xs tracking-wide shadow-sm flex items-center justify-center gap-1 transition-all ${theme.btnBgClass}`}
        >
          Access Portal &rarr;
        </button>
      </div>
    </div>
  );
}
