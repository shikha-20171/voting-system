/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Lock, KeyRound, ShieldCheck, CheckCircle2, AlertTriangle } from 'lucide-react';

interface PasscodeModalProps {
  mode: 'unlock' | 'change';
  currentPasscode: string;
  onClose: () => void;
  onSuccess: (newPasscode?: string) => void;
}

export default function PasscodeModal({ mode, currentPasscode, onClose, onSuccess }: PasscodeModalProps) {
  const [pin, setPin] = useState('');
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (pin === currentPasscode) {
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 800);
    } else {
      setError('Invalid Administrator Passcode. Please try again.');
    }
  };

  const handleChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (oldPin !== currentPasscode) {
      setError('Original Admin Passcode is incorrect.');
      return;
    }

    if (newPin.length < 4) {
      setError('New passcode must be at least 4 digits/characters.');
      return;
    }

    if (newPin !== confirmNewPin) {
      setError('Confirm passcode does not match.');
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      onSuccess(newPin);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in" id="passcode-modal-overlay">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-slate-100 overflow-hidden" id="passcode-modal-box">
        
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-100 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-yellow-500" />
            <h3 className="text-sm font-bold text-slate-900">
              {mode === 'unlock' ? 'Unlock Command Workspace' : 'Update Command Passcode'}
            </h3>
          </div>
          {mode === 'change' && (
            <button 
              onClick={onClose}
              className="p-1 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {success ? (
            <div className="text-center py-6 space-y-3 animate-pulse" id="passcode-success-view">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <p className="text-sm font-bold text-slate-800">
                {mode === 'unlock' ? 'Access Granted! Loading...' : 'Passcode Changed Successfully!'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              
              {mode === 'unlock' && (
                <p className="text-xs text-slate-500 text-center font-medium leading-relaxed">
                  The Kondapi Constituency Command Workspace is currently locked. Enter the master administrator passcode to restore access.
                </p>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              {mode === 'unlock' ? (
                <form onSubmit={handleUnlockSubmit} className="space-y-4" id="unlock-form">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 text-center">Admin Passcode</label>
                    <input
                      type="password"
                      autoFocus
                      maxLength={12}
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      placeholder="••••"
                      className="w-full text-center text-xl tracking-widest font-mono py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200 focus:outline-none transition-all"
                    />
                    <div className="text-center mt-1.5">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Default Passcode: 2026</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-yellow-400 hover:bg-yellow-500 text-gray-950 font-bold rounded-lg text-sm shadow transition-all active:scale-95 cursor-pointer"
                    id="unlock-submit"
                  >
                    Unlock Workspace
                  </button>
                </form>
              ) : (
                <form onSubmit={handleChangeSubmit} className="space-y-3" id="change-passcode-form">
                  
                  {/* Current */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Current Passcode</label>
                    <input
                      type="password"
                      autoFocus
                      value={oldPin}
                      onChange={(e) => setOldPin(e.target.value)}
                      placeholder="••••"
                      className="w-full text-center tracking-widest font-mono py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:bg-white focus:border-yellow-400 focus:outline-none"
                    />
                  </div>

                  {/* New */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">New Passcode</label>
                    <input
                      type="password"
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value)}
                      placeholder="••••"
                      className="w-full text-center tracking-widest font-mono py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:bg-white focus:border-yellow-400 focus:outline-none"
                    />
                  </div>

                  {/* Confirm */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Confirm New Passcode</label>
                    <input
                      type="password"
                      value={confirmNewPin}
                      onChange={(e) => setConfirmNewPin(e.target.value)}
                      placeholder="••••"
                      className="w-full text-center tracking-widest font-mono py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:bg-white focus:border-yellow-400 focus:outline-none"
                    />
                  </div>

                  <div className="pt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 py-2 text-slate-600 hover:text-slate-800 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-950 text-xs font-bold rounded-lg shadow-sm hover:shadow transition-all cursor-pointer"
                      id="save-passcode"
                    >
                      Save Passcode
                    </button>
                  </div>
                </form>
              )}

            </div>
          )}
        </div>

      </div>
    </div>
  );
}
