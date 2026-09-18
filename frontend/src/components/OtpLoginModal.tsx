import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, KeyRound, LoaderCircle, RefreshCw, Smartphone, X } from 'lucide-react';
import { CommandRole, UserSession } from '../types';
import { requestOtp, verifyOtp } from '../lib/api';

interface OtpLoginModalProps {
  role: CommandRole;
  onClose: () => void;
  onSuccess: (session: UserSession, token: string) => void;
}

export default function OtpLoginModal({ role, onClose, onSuccess }: OtpLoginModalProps) {
  const [mobileNumber, setMobileNumber] = useState('');
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

  const handleRequestOtp = async (event?: React.FormEvent) => {
    if (event) event.preventDefault();
    if (cooldown > 0) return;

    setError('');
    setIsSubmitting(true);

    try {
      const response = await requestOtp(mobileNumber, role.id);
      setRequestId(response.requestId);
      setDevOtp(response.devOtp);
      setCooldown(response.cooldownSeconds || 60);
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
    setError('');
    setIsSubmitting(true);

    try {
      const result = await verifyOtp(requestId!, otpCode);
      onSuccess(result.session, result.token);
    } catch (verifyError: any) {
      setError(verifyError?.message || 'Invalid or expired OTP verification code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-100 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-yellow-500" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Secure Command Authentication</h3>
              <p className="text-[11px] text-slate-500 font-semibold">{role.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 font-medium leading-relaxed">
            Enter your registered 10-digit mobile number. A 6-digit OTP will be securely sent via SMS to verify your cadre hierarchy assignment.
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
                  <label className="block text-xs font-bold text-slate-600">Registered Mobile Number</label>
                  <button
                    type="button"
                    onClick={() => setMobileNumber('9848012345')}
                    className="text-[11px] font-bold text-amber-600 hover:text-amber-700 underline cursor-pointer"
                  >
                    Use Demo (9848012345)
                  </button>
                </div>
                <div className="relative">
                  <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={mobileNumber}
                    onChange={(event) => setMobileNumber(event.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="Enter 10-digit mobile number"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:bg-white focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200 focus:outline-none transition-all font-mono"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || mobileNumber.length < 10}
                className="w-full py-2.5 bg-yellow-400 hover:bg-yellow-500 disabled:bg-slate-200 disabled:text-slate-400 text-gray-950 font-bold rounded-lg text-sm shadow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {isSubmitting ? <LoaderCircle className="w-4 h-4 animate-spin" /> : null}
                Request Verification Code
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800 font-semibold flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />
                <div>
                  OTP dispatched to <span className="font-mono font-bold">+91 {mobileNumber}</span>.
                  {devOtp ? (
                    <div className="mt-1 text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded font-mono text-[11px] inline-block">
                      Development OTP: {devOtp}
                    </div>
                  ) : null}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-600">Enter 6-Digit OTP</label>
                  <button
                    type="button"
                    disabled={cooldown > 0 || isSubmitting}
                    onClick={() => handleRequestOtp()}
                    className="text-[11px] font-bold text-yellow-600 hover:text-yellow-700 disabled:text-slate-400 flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
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
                  className="w-full text-center tracking-[0.4em] font-mono py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-lg text-slate-900 font-bold focus:bg-white focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200 focus:outline-none transition-all"
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
                  className="flex-1 py-2.5 bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold rounded-lg text-sm transition-colors cursor-pointer"
                >
                  Change Number
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || otpCode.length < 6}
                  className="flex-1 py-2.5 bg-yellow-400 hover:bg-yellow-500 disabled:bg-slate-200 disabled:text-slate-400 text-gray-950 font-bold rounded-lg text-sm shadow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
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
