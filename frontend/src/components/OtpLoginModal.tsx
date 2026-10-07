import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  KeyRound,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  UserCheck,
  X,
  Zap,
} from 'lucide-react';
import { CommandRole, UserSession } from '../types';
import { requestOtp, verifyOtp } from '../lib/api';
import { DEMO_ACCOUNTS, DemoAccount, getDemoAccountsForRole } from '../lib/demoAccounts';

interface OtpLoginModalProps {
  role: CommandRole;
  onClose: () => void;
  onSuccess: (session: UserSession, token: string) => void;
}

export default function OtpLoginModal({ role, onClose, onSuccess }: OtpLoginModalProps) {
  const [mobileInput, setMobileInput] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [requestId, setRequestId] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingLabel, setSubmittingLabel] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [showAllDemoRoles, setShowAllDemoRoles] = useState(false);
  const [activeAllRoleFilter, setActiveAllRoleFilter] = useState<string>('ALL');

  const roleDemoAccounts = useMemo(() => {
    return getDemoAccountsForRole(role.id);
  }, [role.id]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => setCooldown((v) => Math.max(0, v - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const sendOtp = async (event?: React.FormEvent, overrideMobile?: string) => {
    event?.preventDefault();
    if (cooldown > 0) return;
    const target = overrideMobile || mobileInput;
    const mobile = target.replace(/\D/g, '').slice(-10);
    if (!/^\d{10}$/.test(mobile)) {
      setError('Please enter a valid 10-digit registered mobile number.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    setSubmittingLabel('Dispatching OTP via Fast2SMS...');
    try {
      const response = await requestOtp(mobile, role.id, 'WHATSAPP', true);
      setRequestId(response.requestId);
      setMobileNumber(mobile);
      if (response.devOtp) {
        setDevOtpHint(response.devOtp);
        setOtpCode(response.devOtp);
      } else {
        setDevOtpHint(null);
        setOtpCode('');
      }
      setCooldown(response.cooldownSeconds || 60);
    } catch (err: any) {
      setError(err?.message || 'Unable to send OTP. Please verify the registered mobile number and try again.');
    } finally {
      setIsSubmitting(false);
      setSubmittingLabel(null);
    }
  };

  const handleInstantDemoLogin = async (account: DemoAccount) => {
    setError('');
    setIsSubmitting(true);
    setSubmittingLabel(`Logging in as ${account.name}...`);
    try {
      // 1. Request OTP with devMode enabled
      const req = await requestOtp(account.mobile, account.roleId || role.id, 'WHATSAPP', true);
      const code = req.devOtp || '123456';
      // 2. Authoritative verification & JWT issuance
      const result = await verifyOtp(req.requestId, code);
      onSuccess(result.session, result.token);
    } catch (err: any) {
      setError(err?.message || `Failed to log in as ${account.name}. Please try regular OTP.`);
      setIsSubmitting(false);
      setSubmittingLabel(null);
    }
  };

  const submitOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!requestId || !/^\d{6}$/.test(otpCode)) {
      setError('Please enter the complete 6-digit OTP.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    setSubmittingLabel('Verifying OTP code...');
    try {
      const result = await verifyOtp(requestId, otpCode);
      onSuccess(result.session, result.token);
    } catch (err: any) {
      setError(err?.message || 'Invalid or expired OTP. Please try again.');
    } finally {
      setIsSubmitting(false);
      setSubmittingLabel(null);
    }
  };

  const filteredAllRolesAccounts = useMemo(() => {
    if (activeAllRoleFilter === 'ALL') return DEMO_ACCOUNTS;
    return DEMO_ACCOUNTS.filter((acc) => acc.roleId === activeAllRoleFilter);
  }, [activeAllRoleFilter]);

  const uniqueRoleFilters = useMemo(() => {
    const map = new Map<string, string>();
    DEMO_ACCOUNTS.forEach((acc) => {
      if (!map.has(acc.roleId)) {
        map.set(acc.roleId, acc.roleName);
      }
    });
    return Array.from(map.entries());
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-lg my-auto overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl transition-all">
        {/* Header */}
        <div className="relative bg-slate-950 px-6 py-5 text-white">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-xl p-2 text-slate-300 hover:bg-white/10 hover:text-white transition"
            aria-label="Close"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/15">
              <ShieldCheck className="text-emerald-400" size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black">{role.name}</h2>
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-300">
                  Login
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-300">
                Fast2SMS OTP Verification • 1-Click Demo Accounts Available
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="flex gap-2 rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs font-semibold text-red-700 animate-shake">
              <AlertTriangle size={17} className="shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {!requestId ? (
            <>
              {/* Demo Accounts for Selected Role */}
              <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-900 uppercase tracking-wider">
                    <Zap size={14} className="text-amber-600 fill-amber-500" />
                    <span>Demo Accounts for {role.name}</span>
                  </div>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100/90 px-2 py-0.5 rounded-full">
                    Instant Access
                  </span>
                </div>

                <div className="space-y-2">
                  {roleDemoAccounts.map((account) => (
                    <div
                      key={account.id}
                      className="group flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl border border-amber-200/90 bg-white p-3 shadow-xs hover:border-amber-400 hover:shadow-sm transition"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-slate-900 truncate">
                            {account.name}
                          </span>
                          <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700">
                            {account.badge}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                          <span className="font-mono font-bold text-slate-700">+91 {account.mobile}</span>
                          <span>•</span>
                          <span className="truncate">{account.jurisdiction}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => handleInstantDemoLogin(account)}
                          className="flex items-center gap-1 rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-black text-slate-950 hover:bg-amber-400 active:scale-95 transition shadow-xs disabled:opacity-50"
                        >
                          <Zap size={13} className="fill-slate-950" />
                          <span>1-Click Login</span>
                        </button>
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => setMobileInput(account.mobile)}
                          className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                          title="Fill this mobile number"
                        >
                          Fill
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Standard Mobile Number Input Form */}
              <form onSubmit={(e) => sendOtp(e)} className="space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wide text-slate-600">
                      Or enter mobile number
                    </label>
                    <span className="text-[11px] text-slate-400">10-digit Indian Mobile</span>
                  </div>
                  <div className="flex overflow-hidden rounded-2xl border border-slate-200 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 transition">
                    <span className="flex items-center bg-slate-50 px-4 text-sm font-bold text-slate-600">
                      +91
                    </span>
                    <input
                      value={mobileInput}
                      onChange={(e) => setMobileInput(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      inputMode="numeric"
                      autoComplete="tel"
                      placeholder="10-digit registered mobile"
                      className="min-w-0 flex-1 px-4 py-3.5 text-base font-semibold outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl bg-emerald-50/80 p-3.5 text-xs text-emerald-950 border border-emerald-100">
                  <Smartphone size={18} className="mt-0.5 shrink-0 text-emerald-600" />
                  <div>
                    <p className="font-bold">Fast2SMS Smart Dispatch</p>
                    <p className="mt-0.5 text-emerald-700">
                      OTP is delivered via WhatsApp or regular text SMS. Codes are also printed directly to the backend terminal console.
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || mobileInput.length !== 10}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3.5 font-bold text-white transition hover:bg-slate-800 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <LoaderCircle className="animate-spin" size={18} />
                      <span>{submittingLabel || 'Processing...'}</span>
                    </>
                  ) : (
                    <>
                      <span>Send OTP Code</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>

              {/* All Roles Demo Directory Toggle */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAllDemoRoles((prev) => !prev)}
                  className="flex w-full items-center justify-between rounded-xl px-2 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-1.5">
                    <UserCheck size={14} className="text-emerald-600" />
                    <span>Browse Demo Accounts Across All 8+ Roles</span>
                  </div>
                  {showAllDemoRoles ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </button>

                {showAllDemoRoles && (
                  <div className="mt-3 space-y-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-3 max-h-64 overflow-y-auto animate-fade-in">
                    {/* Role Filter Tabs */}
                    <div className="flex flex-wrap gap-1 pb-1">
                      <button
                        type="button"
                        onClick={() => setActiveAllRoleFilter('ALL')}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase transition ${
                          activeAllRoleFilter === 'ALL'
                            ? 'bg-slate-900 text-white'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        All Roles
                      </button>
                      {uniqueRoleFilters.map(([rId, rName]) => (
                        <button
                          key={rId}
                          type="button"
                          onClick={() => setActiveAllRoleFilter(rId)}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase transition ${
                            activeAllRoleFilter === rId
                              ? 'bg-slate-900 text-white'
                              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {rName}
                        </button>
                      ))}
                    </div>

                    {/* Filtered List */}
                    <div className="space-y-1.5">
                      {filteredAllRolesAccounts.map((account) => (
                        <div
                          key={account.id}
                          className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-2.5 text-xs shadow-2xs hover:border-slate-300 transition"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-black text-slate-900 truncate">
                                {account.name}
                              </span>
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200">
                                {account.roleName}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                              +91 {account.mobile} • {account.jurisdiction}
                            </div>
                          </div>
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => handleInstantDemoLogin(account)}
                            className="shrink-0 flex items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1 text-[11px] font-black text-white hover:bg-slate-800 disabled:opacity-50"
                          >
                            <Zap size={11} className="text-amber-400 fill-amber-400" />
                            <span>Login</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* OTP Verification Screen */
            <form onSubmit={submitOtp} className="space-y-4">
              <div className="rounded-2xl bg-slate-50 p-4 text-xs text-slate-600 space-y-1 border border-slate-100">
                <div className="font-bold text-slate-900">
                  OTP dispatched to +91 {mobileNumber}
                </div>
                <p>
                  Please check both your <strong>WhatsApp messages</strong> and <strong>regular SMS inbox</strong>.
                </p>
              </div>

              {devOtpHint && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-950 flex items-center justify-between">
                  <div>
                    <span className="font-bold">Test OTP Code: </span>
                    <span className="font-mono font-black text-sm tracking-widest text-emerald-800 ml-1">
                      {devOtpHint}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOtpCode(devOtpHint)}
                    className="rounded-xl bg-emerald-600 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-700 transition"
                  >
                    Auto-Fill
                  </button>
                </div>
              )}

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600">
                  Enter 6-digit OTP
                </label>
                <div className="relative">
                  <KeyRound
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    size={19}
                  />
                  <input
                    autoFocus
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="••••••"
                    className="w-full rounded-2xl border border-slate-200 py-3.5 pl-12 pr-4 text-center text-xl font-black tracking-[0.35em] outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || otpCode.length !== 6}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3.5 font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <LoaderCircle className="animate-spin" size={18} />
                    <span>{submittingLabel || 'Verifying...'}</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={18} />
                    <span>Verify & Login</span>
                  </>
                )}
              </button>

              <div className="pt-1 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setRequestId(null);
                    setOtpCode('');
                    setError('');
                    setDevOtpHint(null);
                  }}
                  className="font-semibold text-slate-600 hover:text-slate-900"
                >
                  Change number
                </button>
                <button
                  type="button"
                  disabled={cooldown > 0 || isSubmitting}
                  onClick={() => {
                    sendOtp(undefined, mobileNumber);
                  }}
                  className="flex items-center gap-1 font-bold text-emerald-700 hover:text-emerald-800 disabled:text-slate-400"
                >
                  <RefreshCw size={13} />
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
                </button>
              </div>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setOtpCode('123456')}
                  className="text-[11px] text-slate-400 hover:text-slate-600 hover:underline"
                >
                  Use fallback code (123456)
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
