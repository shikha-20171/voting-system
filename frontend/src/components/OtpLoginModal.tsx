import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  KeyRound,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  X,
  Zap,
} from 'lucide-react';
import { CommandRole, UserSession } from '../types';
import { requestOtp, verifyOtp } from '../lib/api';
import { DemoAccount, getDemoAccountsForRole } from '../lib/demoAccounts';

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
    setSubmittingLabel('Sending OTP...');
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
      const req = await requestOtp(account.mobile, account.roleId || role.id, 'WHATSAPP', true);
      const code = req.devOtp || '123456';
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
    setSubmittingLabel('Verifying...');
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl animate-fade-in">
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
              <h2 className="text-lg font-black">{role.name}</h2>
              <p className="text-xs text-slate-300">Authorized Officer Login</p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="flex gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
              <AlertTriangle size={16} className="shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {!requestId ? (
            <>
              {/* Option 1: Testing Accounts for this role */}
              {roleDemoAccounts.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Testing Accounts
                  </span>
                  <div className="space-y-2">
                    {roleDemoAccounts.map((account) => (
                      <div
                        key={account.id}
                        className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-slate-200/90 bg-slate-50/70 hover:bg-slate-100/70 transition"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {account.name}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded-md">
                              {account.badge}
                            </span>
                          </div>
                          <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                            +91 {account.mobile}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => handleInstantDemoLogin(account)}
                            className="flex items-center gap-1 rounded-xl bg-slate-950 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800 active:scale-95 transition shadow-xs disabled:opacity-50"
                          >
                            <Zap size={13} className="fill-amber-400 text-amber-400" />
                            <span>Instant Login</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Clean Divider */}
              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <span className="bg-white px-3">or enter phone number</span>
                </div>
              </div>

              {/* Option 2: Mobile Number Form */}
              <form onSubmit={(e) => sendOtp(e)} className="space-y-3">
                <div className="flex overflow-hidden rounded-2xl border border-slate-200 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 transition">
                  <span className="flex items-center bg-slate-50 px-4 text-sm font-bold text-slate-600">
                    +91
                  </span>
                  <input
                    value={mobileInput}
                    onChange={(e) => setMobileInput(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    inputMode="numeric"
                    autoComplete="tel"
                    placeholder="10-digit mobile number"
                    className="min-w-0 flex-1 px-4 py-3 text-sm font-semibold outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || mobileInput.length !== 10}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <LoaderCircle className="animate-spin" size={17} />
                      <span>{submittingLabel || 'Processing...'}</span>
                    </>
                  ) : (
                    <>
                      <span>Send OTP</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            /* OTP Verification Screen */
            <form onSubmit={submitOtp} className="space-y-4">
              <div className="rounded-2xl bg-slate-50 p-3.5 text-xs text-slate-600 space-y-1 border border-slate-100">
                <div className="font-bold text-slate-800">
                  OTP sent to +91 {mobileNumber}
                </div>
                <p>Please check your WhatsApp or SMS messages for the code.</p>
              </div>

              {devOtpHint && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-950 flex items-center justify-between">
                  <div>
                    <span className="font-bold">Test OTP: </span>
                    <span className="font-mono font-black text-sm tracking-widest text-emerald-800 ml-1">
                      {devOtpHint}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOtpCode(devOtpHint)}
                    className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-emerald-700 transition"
                  >
                    Auto-Fill
                  </button>
                </div>
              )}

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Enter 6-digit OTP
                </label>
                <div className="relative">
                  <KeyRound
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    size={18}
                  />
                  <input
                    autoFocus
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="••••••"
                    className="w-full rounded-2xl border border-slate-200 py-3 pl-11 pr-4 text-center text-xl font-black tracking-[0.35em] outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || otpCode.length !== 6}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <LoaderCircle className="animate-spin" size={17} />
                    <span>{submittingLabel || 'Verifying...'}</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={17} />
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
                  className="font-semibold text-slate-500 hover:text-slate-800"
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
                  <RefreshCw size={12} />
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
