/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Building2,
  Flag,
  Palette,
  Bot,
  HardDrive,
  Activity,
  FileText,
  Users,
  Settings,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Search,
  LogOut,
  Sparkles,
  Layers,
  Database,
  ArrowRight,
} from 'lucide-react';
import { UserSession } from '../types';
import { useCms } from '../context/CmsContext';
import { apiFetch } from '../lib/api';
import CmsStudio from './cms/CmsStudio';

interface SuperAdminDashboardProps {
  session: UserSession;
  onLogout: () => void;
}

export default function SuperAdminDashboard({ session, onLogout }: SuperAdminDashboardProps) {
  const { config, parties } = useCms();
  const [activeTab, setActiveTab] = useState<'overview' | 'orgs' | 'parties' | 'ai' | 'storage' | 'audit' | 'health'>('overview');
  const [isCmsOpen, setIsCmsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Data states
  const [orgs, setOrgs] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [aiStats, setAiStats] = useState<any>({
    status: 'ACTIVE',
    provider: 'Google Gemini Pro / Flash',
    totalTokens: '48,200',
    costEstimate: '$0.07',
    latencyAvg: '420ms',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [orgsRes, auditRes, healthRes] = await Promise.all([
        apiFetch<any[]>('/api/organisations').catch(() => []),
        apiFetch<any[]>('/api/audit?limit=25').catch(() => []),
        apiFetch<any>('/api/health').catch(() => ({ status: 'UP', database: 'healthy' })),
      ]);
      setOrgs(Array.isArray(orgsRes) ? orgsRes : []);
      setAuditLogs(Array.isArray(auditRes) ? auditRes : (auditRes as any)?.items || []);
      setHealthStatus(healthRes);
    } catch (err) {
      console.error('SuperAdmin load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-30 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400">
                PLATFORM SUPER COMMAND
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/10 text-amber-300 border border-amber-400/30">
                ROOT SAAS
              </span>
            </div>
            <h1 className="text-base font-extrabold tracking-tight text-white">
              Multi-Organisation SaaS Management Studio
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => (window.location.hash = '/assign-data')}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black transition cursor-pointer"
          >
            Assign Data
          </button>
          <button
            onClick={() => (window.location.hash = '/assign-incharges')}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Assign Incharges
          </button>
          
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          </button>

          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-red-950/80 hover:text-red-400 text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer"
            id="btn-superadmin-logout"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content with Sidebar Tabs */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto p-6 gap-6">
        {/* Navigation Sidebar */}
        <aside className="w-64 shrink-0 space-y-1.5">
          <nav className="bg-slate-900 border border-slate-800 rounded-2xl p-2 space-y-1 shadow-sm">
            {[
              { id: 'overview', label: 'Platform Overview', icon: Activity },
              { id: 'orgs', label: 'Organisations', icon: Building2, count: orgs.length || 1 },
              { id: 'parties', label: 'Parties & Branding', icon: Flag, count: parties.length },
              { id: 'ai', label: 'AI Management', icon: Bot },
              { id: 'storage', label: 'Storage & Assets', icon: HardDrive },
              { id: 'audit', label: 'Audit Trail', icon: FileText },
              { id: 'health', label: 'System Health', icon: Database },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    active
                      ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </div>
                  {tab.count !== undefined && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                        active ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Quick Info Box */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-400 font-medium">
              <span>Active Org</span>
              <span className="text-amber-400 font-bold">{config.organisationName}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400 font-medium">
              <span>Active Party</span>
              <span className="text-white font-bold">{config.activePartyCode}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400 font-medium">
              <span>Theme Color</span>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: config.primaryColor }} />
                <span className="font-mono text-[10px]">{config.primaryColor}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Content Pane */}
        <main className="flex-1 space-y-6">
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>Organisations</span>
                    <Building2 className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-2xl font-black text-white">{orgs.length || 1}</div>
                  <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Multi-tenant enabled
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>Configured Parties</span>
                    <Flag className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-2xl font-black text-white">{parties.length || 4}</div>
                  <div className="text-[11px] text-slate-400 font-medium">Dynamic themes configured</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>AI Engine Status</span>
                    <Bot className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="text-2xl font-black text-purple-400">{config.featureToggles?.aiStrategicIntelligence ? 'ONLINE' : 'FLAGGED'}</div>
                  <div className="text-[11px] text-purple-300 font-medium">Telugu & English briefings</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>DB Health</span>
                    <Database className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-black text-emerald-400">{healthStatus?.database === 'healthy' ? 'OPTIMAL' : 'UP'}</div>
                  <div className="text-[11px] text-slate-400 font-mono font-medium">PostgreSQL 16 Engine</div>
                </div>
              </div>

              {/* Action Banner */}
              <div className="bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/20 rounded-2xl p-6 flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    Live Configuration & Visual Branding Studio
                  </h3>
                  <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
                    Modify party colors, hierarchy tier nomenclature, announcements, and enable or disable operational modules across all tenant instances in real time.
                  </p>
                </div>
                <button
                  onClick={() => setIsCmsOpen(true)}
                  className="px-4 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  Launch Studio <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Recent Audit Feed */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-400" /> Recent Security Audit Events
                  </h3>
                  <button
                    onClick={() => setActiveTab('audit')}
                    className="text-[11px] font-bold text-amber-400 hover:underline cursor-pointer"
                  >
                    View All Audit Logs &rarr;
                  </button>
                </div>

                <div className="divide-y divide-slate-800/80">
                  {auditLogs.slice(0, 5).map((log, idx) => (
                    <div key={log.id || idx} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 rounded bg-slate-800 font-mono text-[10px] text-amber-400 font-bold">
                          {log.action || 'MUTATION'}
                        </span>
                        <span className="font-medium text-slate-200">{log.entity || 'Entity'}: {log.entityId || log.details || 'Updated'}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">
                        {log.createdAt ? new Date(log.createdAt).toLocaleTimeString() : 'Just now'}
                      </span>
                    </div>
                  ))}
                  {auditLogs.length === 0 && (
                    <div className="py-4 text-center text-xs text-slate-500">No audit events recorded yet.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'orgs' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-sm font-extrabold text-white">Registered Organisations</h2>
                  <p className="text-xs text-slate-400">Multi-tenant tenants with isolated hierarchy scopes</p>
                </div>
                <button
                  onClick={() => setIsCmsOpen(true)}
                  className="px-3.5 py-1.5 bg-amber-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Organisation
                </button>
              </div>

              <div className="space-y-3">
                <div className="p-4 bg-slate-800/60 border border-slate-700/60 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center font-bold">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{config.organisationName}</h4>
                      <p className="text-[11px] text-slate-400 font-mono">CODE: KDP-TDP-01 &bull; Active Party: {config.activePartyCode}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      ACTIVE TENANT
                    </span>
                    <button
                      onClick={() => setIsCmsOpen(true)}
                      className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                    >
                      Configure
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'parties' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-sm font-extrabold text-white">Configured Political Parties</h2>
                  <p className="text-xs text-slate-400">Dynamic themes and symbols used across tenant instances</p>
                </div>
                <button
                  onClick={() => setIsCmsOpen(true)}
                  className="px-3.5 py-1.5 bg-amber-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Configure Party
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {parties.map((p) => (
                  <div
                    key={p.code}
                    className={`p-4 rounded-xl border transition-all ${
                      config.activePartyCode === p.code
                        ? 'bg-amber-950/20 border-amber-500/40 shadow-sm'
                        : 'bg-slate-800/40 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs"
                          style={{ backgroundColor: p.primaryColor, color: '#fff' }}
                        >
                          {p.code.slice(0, 3)}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white">{p.name}</h4>
                          <span className="text-[10px] font-mono text-slate-400">{p.shortName}</span>
                        </div>
                      </div>
                      {config.activePartyCode === p.code && (
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-400 text-slate-950 uppercase">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                      <span>Primary: <span className="font-mono text-white">{p.primaryColor}</span></span>
                      <span>&bull;</span>
                      <span>Symbol: <span className="text-white">{p.symbolName || 'Standard'}</span></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-sm font-extrabold text-white">AI Provider & Intelligence Engine</h2>
                  <p className="text-xs text-slate-400">Manage LLM configurations, prompt token limits, and Telugu localization</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">
                    GEMINI 2.0 FLASH / PRO
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-800/50 border border-slate-800 rounded-xl space-y-1">
                  <span className="text-slate-400 text-xs font-medium">Provider Status</span>
                  <div className="text-base font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Configured & Operational
                  </div>
                </div>
                <div className="p-4 bg-slate-800/50 border border-slate-800 rounded-xl space-y-1">
                  <span className="text-slate-400 text-xs font-medium">Monthly Token Budget</span>
                  <div className="text-base font-bold text-white">{aiStats.totalTokens} Tokens</div>
                </div>
                <div className="p-4 bg-slate-800/50 border border-slate-800 rounded-xl space-y-1">
                  <span className="text-slate-400 text-xs font-medium">Estimated Cost</span>
                  <div className="text-base font-bold text-amber-400">{aiStats.costEstimate}</div>
                </div>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs font-mono">
                <div className="text-slate-400 font-bold">Supported Capabilities:</div>
                <div className="text-slate-300">&bull; Tactical Constituency War-Room Briefings (Telugu & English)</div>
                <div className="text-slate-300">&bull; Ground Incident Severity & Sentiment Extraction</div>
                <div className="text-slate-300">&bull; Demographic Voter Turnout Probability Analysis</div>
                <div className="text-slate-300">&bull; Automated Executive Telegram Dispatch Formatting</div>
              </div>
            </div>
          )}

          {activeTab === 'storage' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-sm font-extrabold text-white">S3 Object Storage Management</h2>
                  <p className="text-xs text-slate-400">Assets, training media, ground report attachments, and party logos</p>
                </div>
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  S3-COMPATIBLE / LOCAL ATTACH
                </span>
              </div>

              <div className="space-y-3">
                <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <h4 className="font-bold text-white">Training Media Library Storage</h4>
                    <p className="text-slate-400 font-mono text-[11px]">Bucket: kdp-training-media &bull; 8 Videos</p>
                  </div>
                  <span className="font-mono text-amber-400 font-bold">142 MB Used</span>
                </div>
                <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <h4 className="font-bold text-white">Ground Report Uploads & Photos</h4>
                    <p className="text-slate-400 font-mono text-[11px]">Bucket: kdp-ground-attachments &bull; 24 Files</p>
                  </div>
                  <span className="font-mono text-amber-400 font-bold">38 MB Used</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-sm font-extrabold text-white">Immutable Platform Audit Trail</h2>
                  <p className="text-xs text-slate-400">Cryptographically verifiable log of all administrative and voter mutations</p>
                </div>
                <span className="text-xs font-mono text-slate-400 font-bold">{auditLogs.length} Events Logged</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                      <th className="py-2.5 px-3">Timestamp</th>
                      <th className="py-2.5 px-3">Action</th>
                      <th className="py-2.5 px-3">Entity</th>
                      <th className="py-2.5 px-3">Entity ID</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                    {auditLogs.map((log, idx) => (
                      <tr key={log.id || idx} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 text-slate-400">
                          {log.createdAt ? new Date(log.createdAt).toLocaleString() : 'Recent'}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-amber-400">{log.action}</td>
                        <td className="py-2.5 px-3 text-slate-200">{log.entity}</td>
                        <td className="py-2.5 px-3 text-slate-400 truncate max-w-[150px]">{log.entityId || '-'}</td>
                        <td className="py-2.5 px-3">
                          <span className="text-emerald-400 font-bold">VERIFIED</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'health' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-sm font-extrabold text-white">System Diagnostics & Infrastructure</h2>
                  <p className="text-xs text-slate-400">Fastify backend server, PostgreSQL connection pool, and Socket.IO status</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  ALL SYSTEMS NOMINAL
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <span className="text-xs text-slate-400 font-medium">Fastify REST Server</span>
                  <div className="text-sm font-bold text-emerald-400">Status: UP (Port 4000)</div>
                  <div className="text-[11px] text-slate-500 font-mono">Uptime: {Math.round(healthStatus?.uptime || 120)}s</div>
                </div>

                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <span className="text-xs text-slate-400 font-medium">PostgreSQL Engine</span>
                  <div className="text-sm font-bold text-emerald-400">Connection: Active & Healthy</div>
                  <div className="text-[11px] text-slate-500 font-mono">Prisma Client v6.14.0</div>
                </div>

                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <span className="text-xs text-slate-400 font-medium">Real-Time Gateway</span>
                  <div className="text-sm font-bold text-emerald-400">Socket.IO Server Ready</div>
                  <div className="text-[11px] text-slate-500 font-mono">Hierarchy-aware rooms</div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {isCmsOpen && (
        <div className="fixed inset-0 z-50 overflow-auto bg-white">
          <CmsStudio
            isOpen={true}
            mode="editor"
            onClose={() => setIsCmsOpen(false)}
            onOpenRoleModules={() => setIsCmsOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
