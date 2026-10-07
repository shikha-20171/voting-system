import React, { useEffect, useState } from 'react';
import { AlertTriangle, ArrowRight, KeyRound, LoaderCircle, RefreshCw, ShieldCheck, Smartphone, X } from 'lucide-react';
import { CommandRole, UserSession } from '../types';
import { requestOtp, verifyOtp } from '../lib/api';

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
  const [cooldown, setCooldown] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => setCooldown((v) => Math.max(0, v - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const sendOtp = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (cooldown > 0) return;
    const mobile = mobileInput.replace(/\D/g, '').slice(-10);
    if (!/^\d{10}$/.test(mobile)) {
      setError('Please enter a valid 10-digit registered mobile number.');
      return;
    }
    setError(''); setIsSubmitting(true);
    try {
      const response = await requestOtp(mobile, role.id, 'WHATSAPP');
      setRequestId(response.requestId);
      setMobileNumber(mobile);
      setOtpCode('');
      setCooldown(response.cooldownSeconds || 60);
    } catch (err: any) {
      setError(err?.message || 'Unable to send OTP. Please verify the registered mobile number and try again.');
    } finally { setIsSubmitting(false); }
  };

  const submitOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!requestId || !/^\d{6}$/.test(otpCode)) {
      setError('Please enter the complete 6-digit OTP.');
      return;
    }
    setError(''); setIsSubmitting(true);
    try {
      const result = await verifyOtp(requestId, otpCode);
      onSuccess(result.session, result.token);
    } catch (err: any) {
      setError(err?.message || 'Invalid or expired OTP. Please try again.');
    } finally { setIsSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="relative bg-slate-950 px-6 py-6 text-white">
          <button onClick={onClose} className="absolute right-4 top-4 rounded-xl p-2 text-slate-300 hover:bg-white/10 hover:text-white" aria-label="Close"><X size={20}/></button>
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15"><ShieldCheck className="text-emerald-400"/></div>
          <h2 className="text-xl font-black">{role.name} Login</h2>
          <p className="mt-1 text-sm text-slate-300">Secure WhatsApp OTP verification for registered users.</p>
        </div>
        <div className="p-6">
          {error && <div className="mb-4 flex gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700"><AlertTriangle size={18} className="shrink-0"/>{error}</div>}
          {!requestId ? (
            <form onSubmit={sendOtp} className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">Registered mobile number</label>
                <div className="flex overflow-hidden rounded-2xl border border-slate-200 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10">
                  <span className="flex items-center bg-slate-50 px-4 text-sm font-bold text-slate-600">+91</span>
                  <input value={mobileInput} onChange={(e)=>setMobileInput(e.target.value.replace(/\D/g,'').slice(0,10))} inputMode="numeric" autoComplete="tel" placeholder="10-digit mobile" className="min-w-0 flex-1 px-4 py-3.5 text-base font-semibold outline-none" />
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-800"><Smartphone size={20}/><span>OTP will be sent through Fast2SMS Smart OTP (WhatsApp-first).</span></div>
              <button disabled={isSubmitting || mobileInput.length !== 10} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3.5 font-bold text-white disabled:opacity-50">{isSubmitting ? <LoaderCircle className="animate-spin" size={19}/> : <><span>Send WhatsApp OTP</span><ArrowRight size={18}/></>}</button>
            </form>
          ) : (
            <form onSubmit={submitOtp} className="space-y-4">
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">OTP sent to <strong>+91 {mobileNumber}</strong>. Enter the 6-digit code received on WhatsApp.</div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">6-digit OTP</label>
                <div className="relative"><KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={19}/><input autoFocus value={otpCode} onChange={(e)=>setOtpCode(e.target.value.replace(/\D/g,'').slice(0,6))} inputMode="numeric" autoComplete="one-time-code" placeholder="••••••" className="w-full rounded-2xl border border-slate-200 py-3.5 pl-12 pr-4 text-center text-xl font-black tracking-[0.35em] outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"/></div>
              </div>
              <button disabled={isSubmitting || otpCode.length !== 6} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3.5 font-bold text-white disabled:opacity-50">{isSubmitting ? <LoaderCircle className="animate-spin" size={19}/> : <><ShieldCheck size={18}/><span>Verify & Login</span></>}</button>
              <div className="flex items-center justify-between text-sm">
                <button type="button" onClick={()=>{setRequestId(null);setOtpCode('');setError('');}} className="font-semibold text-slate-600">Change number</button>
                <button type="button" disabled={cooldown>0 || isSubmitting} onClick={()=>{setRequestId(null); setCooldown(0); setTimeout(()=>{},0);}} className="flex items-center gap-1 font-bold text-emerald-700 disabled:text-slate-400"><RefreshCw size={14}/>{cooldown>0 ? `Resend in ${cooldown}s` : 'Resend OTP'}</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
