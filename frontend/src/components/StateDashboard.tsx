/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  MapPin,
  TrendingUp,
  Vote,
  Users,
  ShieldCheck,
  Layers,
  ArrowRight,
  RefreshCw,
  LogOut,
  Sparkles,
  Bot,
  AlertTriangle,
  Building,
} from 'lucide-react';
import { UserSession } from '../types';
import { useCms } from '../context/CmsContext';
import { apiFetch, fetchStateAnalytics, HierarchyAnalyticsResponse } from '../lib/api';
import AIStrategicIntelligenceCenter from './AIStrategicIntelligenceCenter';

interface StateDashboardProps {
  session: UserSession;
  onLogout: () => void;
}

export default function StateDashboard({ session, onLogout }: StateDashboardProps) {
  const { config, t } = useCms();
  const [loading, setLoading] = useState(false);
  const [showAi, setShowAi] = useState(false);
  const [analytics, setAnalytics] = useState<HierarchyAnalyticsResponse | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchStateAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error('State dashboard load failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalVoters = analytics?.summary?.totalVoters || 42800000;
  const votedCount = analytics?.summary?.voted || 29960000;
  const turnoutPct = analytics?.summary?.turnoutPercentage || 70.0;
  const totalSeats = 175;
  const majoritySeats = 88;
  const projectedLeading = analytics?.projections?.winningAreasCount || 112;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950">
      {/* Top Command Bar */}
      <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur sticky top-0 z-30 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400">
                STATE APEX COMMAND
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400/10 text-emerald-300 border border-emerald-400/30">
                LIVE AGGREGATION
              </span>
            </div>
            <h1 className="text-base font-extrabold tracking-tight text-white">
              {config.organisationName} &bull; State Central War Room
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAi(!showAi)}
            className="flex items-center gap-2 px-3.5 py-2 bg-purple-900/40 hover:bg-purple-900/60 border border-purple-500/30 text-purple-200 font-bold rounded-xl text-xs transition cursor-pointer"
          >
            <Bot className="w-4 h-4 text-purple-400" />
            {showAi ? 'Hide AI Briefing' : 'AI Strategic War-Room'}
          </button>

          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition cursor-pointer"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          </button>

          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-red-950/80 hover:text-red-400 text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Exit Command
          </button>
        </div>
      </header>

      {/* Main Dashboard Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {showAi && (
          <div className="mb-6">
            <AIStrategicIntelligenceCenter session={session} />
          </div>
        )}

        {/* Apex KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Total State Electorate</span>
              <Users className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">{totalVoters.toLocaleString()}</div>
            <div className="text-[11px] text-slate-400 font-medium">Across all 26 Parliamentary Zones</div>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Statewide Live Turnout</span>
              <Vote className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400 font-mono">{turnoutPct}%</div>
            <div className="text-[11px] text-emerald-300 font-medium">{votedCount.toLocaleString()} Verified Votes Cast</div>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Seat Projection (Configured)</span>
              <TrendingUp className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-black text-blue-400 font-mono">{projectedLeading} / {totalSeats}</div>
            <div className="text-[11px] text-blue-300 font-medium">Majority Target: {majoritySeats} Seats</div>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Active Cadre Strength</span>
              <ShieldCheck className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-purple-400 font-mono">184,200+</div>
            <div className="text-[11px] text-purple-300 font-medium">Booths & 100-Voter Units</div>
          </div>
        </div>

        {/* Statewide Hierarchy Breakdown */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                Zonal & Parliamentary Hierarchy Rollup
              </h3>
              <p className="text-xs text-slate-400">Bottom-up aggregated field telemetry</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white text-xs">Coastal Andhra Zone</h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">LEADING</span>
              </div>
              <div className="text-xs text-slate-400 space-y-1 font-mono">
                <div>Electorate: 18,400,000</div>
                <div>Turnout: 72.4%</div>
                <div>Projected Seats: 58 / 82</div>
              </div>
            </div>

            <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white text-xs">Rayalaseema Zone</h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400">CONTEST</span>
              </div>
              <div className="text-xs text-slate-400 space-y-1 font-mono">
                <div>Electorate: 14,200,000</div>
                <div>Turnout: 68.1%</div>
                <div>Projected Seats: 32 / 52</div>
              </div>
            </div>

            <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white text-xs">Uttarandhra Zone</h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">LEADING</span>
              </div>
              <div className="text-xs text-slate-400 space-y-1 font-mono">
                <div>Electorate: 10,200,000</div>
                <div>Turnout: 69.8%</div>
                <div>Projected Seats: 22 / 41</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
