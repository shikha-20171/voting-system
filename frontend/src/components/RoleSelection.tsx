/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CommandRole, RoleType } from '../types';
import RoleCard from './RoleCard';
import SecurityControls from './SecurityControls';
import { ShieldCheck, Info, UserCheck } from 'lucide-react';

interface RoleSelectionProps {
  onSelectRole: (role: CommandRole) => void;
  onLock: () => void;
  onChangePasscode: () => void;
  isPanelLocked: boolean;
}

const ALL_ROLES: CommandRole[] = [
  {
    id: 'SUPER_ADMIN',
    name: "Super Administrator",
    subtitle: "Multi-Tenant Platform Command",
    description: "Platform management, multi-organisation setup, AI engine, and CMS.",
    path: "/super-admin",
    iconName: "ShieldCheck"
  },
  {
    id: 'STATE_ADMIN',
    name: "State Central Command",
    subtitle: "Statewide War Room",
    description: "Statewide election telemetry, majority projections, and zonal analytics.",
    path: "/state",
    iconName: "Building"
  },
  {
    id: 'CONSTITUENCY_INCHARGE',
    name: "Constituency Incharge",
    subtitle: "Kondapi Assembly Command",
    description: "Complete Constituency access, candidate operations, and mandal rollups.",
    path: "/constituency",
    iconName: "Crown"
  },
  {
    id: 'MANDAL_INCHARGE',
    name: "Mandal Incharge",
    subtitle: "Mandal Level Management",
    description: "Manage assigned mandal, villages, booths, and voter teams.",
    path: "/mandal/dashboard",
    iconName: "Layers"
  },
  {
    id: 'VILLAGE_INCHARGE',
    name: "Village Incharge",
    subtitle: "Village Level Management",
    description: "Manage assigned village, polling booths, and ground reports.",
    path: "/village",
    iconName: "Home"
  },
  {
    id: 'BOOTH_PRESIDENT',
    name: "Booth Incharge",
    subtitle: "Polling Booth Command",
    description: "Manage assigned polling booth, booth cadres, and voter turnout.",
    path: "/booth/dashboard",
    iconName: "Vote"
  },
  {
    id: 'VOTER_100_INCHARGE',
    name: "100 Voter Incharge",
    subtitle: "100 Voter Team Management",
    description: "Manage assigned cluster of ~100 voters, live marking, and outreach.",
    path: "/100-voter",
    iconName: "Users"
  }
];

export default function RoleSelection({ onSelectRole, onLock, onChangePasscode, isPanelLocked }: RoleSelectionProps) {
  return (
    <div className="relative w-full max-w-6xl mx-auto px-4 md:px-6 py-2 md:py-4 space-y-4 md:space-y-6 animate-fade-in" id="role-selection-section">
      
      {/* Background Decorative Ambient Glows */}
      <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-gradient-to-br from-amber-200/10 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-[100px] right-[-100px] w-[500px] h-[500px] bg-gradient-to-tl from-amber-100/10 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Title block with Integrated Security Controls */}
      <div 
        className="flex flex-col md:flex-row md:items-center md:justify-between border-b-2 border-slate-100 pb-3 md:pb-4 gap-4"
        id="role-selection-bar"
      >
        <div className="flex items-center gap-3">
          {/* Gold Accent Icon Badge */}
          <div className="p-2 md:p-2.5 bg-amber-50 border border-amber-200 text-amber-500 rounded-xl shadow-sm flex items-center justify-center">
            <UserCheck className="w-5.5 h-5.5 md:w-6 md:h-6 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-black text-slate-900 tracking-tight leading-tight">
              Select Command Role
            </h2>
            <p className="text-[10px] md:text-xs font-bold text-slate-400 mt-0.5">
              Access your assigned jurisdictional dashboard & live war room
            </p>
          </div>
        </div>

        {/* Security Controls right-aligned */}
        <SecurityControls 
          onLock={onLock} 
          onChangePasscode={onChangePasscode} 
          isPanelLocked={isPanelLocked} 
        />
      </div>

      {/* Main card grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5" id="roles-cards-grid">
        {ALL_ROLES.map((role) => (
          <RoleCard 
            key={role.id} 
            role={role} 
            onClick={() => onSelectRole(role)} 
          />
        ))}
      </div>

      {/* Auxiliary Security Alert Banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 md:p-4 flex gap-3 max-w-3xl mx-auto mt-4 md:mt-5 shadow-sm">
        <Info className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
        <div className="space-y-0.5">
          <h4 className="text-[10px] md:text-xs font-black text-slate-800 uppercase tracking-wider">Secure Audit Protocol Active</h4>
          <p className="text-[10px] md:text-xs text-slate-500 leading-relaxed font-semibold">
            Any activity, including failed access attempts, IP matching, and jurisdiction deviations, is cryptographically logged on the secure command-center server. Access is granted only to registered TDP workers assigned to Kondapi Constituency.
          </p>
        </div>
      </div>

    </div>
  );
}
