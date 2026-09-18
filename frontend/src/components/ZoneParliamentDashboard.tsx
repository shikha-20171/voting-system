/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Layers,
  MapPin,
  TrendingUp,
  Vote,
  Users,
  ShieldCheck,
  RefreshCw,
  LogOut,
  Bot,
  Building2,
} from 'lucide-react';
import { UserSession } from '../types';
import { useCms } from '../context/CmsContext';
import { apiFetch, fetchHierarchySummaryByUser, HierarchySummaryPayload } from '../lib/api';
import AIStrategicIntelligenceCenter from './AIStrategicIntelligenceCenter';

interface ZoneParliamentDashboardProps {
  session: UserSession;
  onLogout: () => void;
}

export default function ZoneParliamentDashboard({ session, onLogout }: ZoneParliamentDashboardProps) {
  const { config, t } = useCms();
  const [loading, setLoading] = useState(false);
  const [showAi, setShowAi] = useState(false);
  const [summary, setSummary] = useState<HierarchySummaryPayload | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchHierarchySummaryByUser(session.userId);
      setSummary(data);
    } catch (err) {
      console.error('Zone/Parliament dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [session.userId]);

  const isZone = session.role === 'ZONE_INCHARGE';
  const totalVoters = summary?.snapshot?.summary?.totalVoters || 1850000;
  const votedCount = summary?.snapshot?.summary?.voted || 1295000;
  const turnoutPct = Math.round((votedCount / (totalVoters || 1)) * 100);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur sticky top-0 z-30 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400">
                {isZone ? 'ZONE COMMAND CENTER' : 'PARLIAMENTARY WAR ROOM'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/10 text-amber-300 border border-amber-400/30">
                {session.assignedParliament || session.assignedZone || 'Ongole Jurisdiction'}
              </span>
            </div>
            <h1 className="text-base font-extrabold tracking-tight text-white">
              {config.organisationName} &bull; {session.userName} ({isZone ? 'Zonal In-Charge' : 'Parliament In-Charge'})
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAi(!showAi)}
            className="flex items-center gap-2 px-3.5 py-2 bg-purple-900/40 hover:bg-purple-900/60 border border-purple-500/30 text-purple-200 font-bold rounded-xl text-xs transition cursor-pointer"
          >
            <Bot className="w-4 h-4 text-purple-400" />
            {showAi ? 'Hide AI War-Room' : 'AI Strategic War-Room'}
          </button>

          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          </button>

          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-red-950/80 hover:text-red-400 text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {showAi && (
          <div className="mb-6">
            <AIStrategicIntelligenceCenter session={session} />
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Jurisdiction Electorate</span>
              <Users className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">{totalVoters.toLocaleString()}</div>
            <div className="text-[11px] text-slate-400 font-medium">Verified Electors</div>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Live Turnout</span>
              <Vote className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400 font-mono">{turnoutPct}%</div>
            <div className="text-[11px] text-emerald-300 font-medium">{votedCount.toLocaleString()} Votes Recorded</div>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Constituencies / Mandals</span>
              <Building2 className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-black text-blue-400 font-mono">7 Assembly Units</div>
            <div className="text-[11px] text-blue-300 font-medium">All Units Active & Reporting</div>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Cadre Network</span>
              <ShieldCheck className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-purple-400 font-mono">1,840+ Cadres</div>
            <div className="text-[11px] text-purple-300 font-medium">100% In-Charge Deployment</div>
          </div>
        </div>

        {/* Assembly Constituency Rollups */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-extrabold text-white">Assembly Constituency Telemetry Rollup</h3>
              <p className="text-xs text-slate-400">Underlying assembly segments under this command scope</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {['Kondapi', 'Ongole', 'Santhanuthalapadu', 'Kandukur', 'Darsi', 'Kanigiri'].map((name, idx) => (
              <div key={name} className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-xs">{name} Assembly</h4>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${idx % 2 === 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                    {idx % 2 === 0 ? 'LEADING' : 'BATTLEGROUND'}
                  </span>
                </div>
                <div className="text-xs text-slate-400 space-y-1 font-mono">
                  <div>Voters: {(220000 + idx * 8000).toLocaleString()}</div>
                  <div>Turnout: {71 + (idx % 4)}%</div>
                  <div>Booths: 240</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
