import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, KeyRound, LoaderCircle, RefreshCw, ShieldCheck, Smartphone, Sparkles, UserCheck, X, Zap } from 'lucide-react';
import { CommandRole, UserSession } from '../types';
import { getMockSessionForRole, requestOtp, verifyOtp } from '../lib/api';

interface OtpLoginModalProps {
  role: CommandRole;
  onClose: () => void;
  onSuccess: (session: UserSession, token: string) => void;
}

export const ROLE_DEMO_CREDENTIALS: Record<string, { mobile: string; name: string; title: string }> = {
  SUPER_ADMIN: { mobile: '9848099999', name: 'Super Administrator', title: 'State IT / Multi-Tenant Command' },
  STATE_ADMIN: { mobile: '9848088888', name: 'AP State Central Command', title: 'Statewide War Room' },
  ZONE_INCHARGE: { mobile: '9848099999', name: 'Zone Incharge Officer', title: 'Zone Command' },
  PARLIAMENT_INCHARGE: { mobile: '9848088888', name: 'Parliament Incharge Officer', title: 'Parliament Command' },
  CONSTITUENCY_INCHARGE: { mobile: '9848012345', name: 'Dr. Dola Bala Veeranjaneya Swamy', title: 'MLA Incharge (Kondapi)' },
  MANDAL_INCHARGE: { mobile: '9848077777', name: 'Kondapi Mandal Incharge', title: 'Mandal Level Command' },
  VILLAGE_INCHARGE: { mobile: '9848010001', name: 'Village President', title: 'Village Level Command' },
  BOOTH_PRESIDENT: { mobile: '9848010002', name: 'Booth 101 President', title: 'Polling Booth Command' },
  POLLING_AGENT: { mobile: '9848010002', name: 'Polling Agent', title: 'Polling Station Agent' },
  VOTER_100_INCHARGE: { mobile: '9848010003', name: 'Marella Venkateswarlu', title: '100-Voter Cluster Incharge' },
  VIEWER: { mobile: '9848012345', name: 'Observer / Viewer', title: 'Read-Only View' },
};

export default function OtpLoginModal({ role, onClose, onSuccess }: OtpLoginModalProps) {
  const roleDemo = ROLE_DEMO_CREDENTIALS[role.id] || { mobile: '9848012345', name: role.name, title: role.subtitle };
  const [mobileNumber, setMobileNumber] = useState(roleDemo.mobile);
  const [otpCode, setOtpCode] = useState('');
  const [requestId, setRequestId] = useState<string | null>(null);
  const [devOtp, setDevOtp] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const mode = useMemo(() => (requestId ? 'verify' : 'request'), [requestId]);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleDirectDemoLogin = () => {
    setIsSubmitting(true);
    try {
      const demoSession = getMockSessionForRole(role.id, mobileNumber || roleDemo.mobile);
      onSuccess(demoSession, `demo-token-${Date.now()}`);
    } catch {
      setError('Unable to initialize demo session.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestOtp = async (event?: React.FormEvent, customMobile?: string) => {
    if (event) event.preventDefault();
    if (cooldown > 0) return;

    const numToUse = (customMobile || mobileNumber).replace(/\D/g, '').slice(-10);
    if (numToUse.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const response = await requestOtp(numToUse, role.id);
      setRequestId(response.requestId);
      setDevOtp(response.devOtp);
      setCooldown(response.cooldownSeconds || 30);
      if (response.devOtp) {
        setOtpCode(response.devOtp);
      }
    } catch (requestError: any) {
      setError(requestError?.message || 'Failed to dispatch OTP. Please check mobile number.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!requestId || otpCode.length < 6) {
      setError('Please enter the complete 6-digit OTP code.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const result = await verifyOtp(requestId, otpCode);
      onSuccess(result.session, result.token);
    } catch (verifyError: any) {
      setError(verifyError?.message || 'Invalid or expired OTP verification code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemoFill = (mobile: string) => {
    setMobileNumber(mobile);
    setError('');
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-100 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 text-amber-700 flex items-center justify-center font-bold">
              <KeyRound className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 leading-tight">Secure Command Authentication</h3>
              <p className="text-[11px] text-amber-700 font-bold mt-0.5">{role.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 font-medium leading-relaxed flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Log in to the <strong>Kondapi 2026 Command Center</strong> using your registered phone number or test directly using the preloaded demo credentials below.
            </span>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-xs font-semibold flex items-center gap-2 animate-shake">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {mode === 'request' ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">Registered Mobile Number</label>
                  <button
                    type="button"
                    onClick={() => handleQuickDemoFill(roleDemo.mobile)}
                    className="text-[11px] font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 rounded cursor-pointer transition-colors flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    Use Demo: {roleDemo.mobile}
                  </button>
                </div>

                <div className="relative">
                  <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={mobileNumber}
                    onChange={(event) => setMobileNumber(event.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="Enter 10-digit mobile number"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 font-bold focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-200 focus:outline-none transition-all font-mono tracking-wider"
                    required
                    autoFocus
                  />
                </div>
              </div>

              {/* Quick Demo Credentials Row */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Quick Demo Numbers</span>
                  <span className="text-[10px] font-semibold text-slate-400">1-Tap to Fill</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => handleQuickDemoFill('9848012345')}
                    className={`p-1.5 rounded-lg border text-left cursor-pointer transition-all ${
                      mobileNumber === '9848012345' ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="block text-[10px] text-slate-500">MLA / Constituency</span>
                    <span className="font-mono font-bold">9848012345</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemoFill('9848077777')}
                    className={`p-1.5 rounded-lg border text-left cursor-pointer transition-all ${
                      mobileNumber === '9848077777' ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="block text-[10px] text-slate-500">Mandal Incharge</span>
                    <span className="font-mono font-bold">9848077777</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemoFill('9848010002')}
                    className={`p-1.5 rounded-lg border text-left cursor-pointer transition-all ${
                      mobileNumber === '9848010002' ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="block text-[10px] text-slate-500">Booth President</span>
                    <span className="font-mono font-bold">9848010002</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemoFill('9848099999')}
                    className={`p-1.5 rounded-lg border text-left cursor-pointer transition-all ${
                      mobileNumber === '9848099999' ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="block text-[10px] text-slate-500">Super Admin</span>
                    <span className="font-mono font-bold">9848099999</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  type="submit"
                  disabled={isSubmitting || mobileNumber.length < 10}
                  className="w-full py-3 bg-amber-400 hover:bg-amber-500 disabled:bg-slate-200 disabled:text-slate-400 text-slate-950 font-black rounded-xl text-sm shadow-md hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed active:scale-[0.99]"
                >
                  {isSubmitting ? <LoaderCircle className="w-4 h-4 animate-spin" /> : null}
                  Request Verification Code
                </button>

                <button
                  type="button"
                  onClick={handleDirectDemoLogin}
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 font-black rounded-xl text-xs shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.99]"
                >
                  <Zap className="w-4 h-4 fill-current text-slate-950" />
                  ⚡ Instant 1-Click Demo Login (Direct Access)
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800 font-semibold flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />
                <div>
                  OTP dispatched to <span className="font-mono font-bold">+91 {mobileNumber}</span>.
                  {devOtp ? (
                    <div className="mt-1 text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded font-mono text-[11px] inline-block font-bold border border-emerald-300">
                      ⚡ Development OTP: {devOtp} (Auto-filled)
                    </div>
                  ) : null}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">Enter 6-Digit OTP</label>
                  <button
                    type="button"
                    disabled={cooldown > 0 || isSubmitting}
                    onClick={() => handleRequestOtp()}
                    className="text-[11px] font-bold text-amber-700 hover:text-amber-800 disabled:text-slate-400 flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <RefreshCw className={`w-3 h-3 ${isSubmitting ? 'animate-spin' : ''}`} />
                    {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
                  </button>
                </div>
                <input
                  type="text"
                  value={otpCode}
                  onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="------"
                  className="w-full text-center tracking-[0.4em] font-mono py-3 bg-slate-50 border border-slate-200 rounded-xl text-xl text-slate-900 font-black focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-200 focus:outline-none transition-all shadow-inner"
                  required
                  autoFocus
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setRequestId(null);
                    setOtpCode('');
                    setDevOtp(undefined);
                    setError('');
                  }}
                  className="flex-1 py-2.5 bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Change Number
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || otpCode.length < 6}
                  className="flex-1 py-2.5 bg-amber-400 hover:bg-amber-500 disabled:bg-slate-200 disabled:text-slate-400 text-slate-950 font-black rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed active:scale-[0.99]"
                >
                  {isSubmitting ? <LoaderCircle className="w-4 h-4 animate-spin" /> : null}
                  Verify & Enter
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

