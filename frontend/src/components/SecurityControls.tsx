/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Lock, KeyRound, ShieldCheck } from 'lucide-react';

interface SecurityControlsProps {
  onLock: () => void;
  onChangePasscode: () => void;
  isPanelLocked: boolean;
}

export default function SecurityControls({ onLock, onChangePasscode, isPanelLocked }: SecurityControlsProps) {
  return (
    <div 
      className="flex gap-3" 
      id="security-controls-container"
    >
      <button
        onClick={onLock}
        id="btn-lock-panel"
        className="px-4 py-2 bg-white border border-amber-200 hover:border-amber-400 hover:bg-amber-50/20 text-xs font-black rounded-lg shadow-sm text-slate-900 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
        title="Lock the roles command panel"
      >
        <Lock className="w-3.5 h-3.5 text-amber-500" />
        {isPanelLocked ? "Unlock Panel" : "Lock Panel"}
      </button>

      <button
        onClick={onChangePasscode}
        id="btn-change-passcode"
        className="px-4 py-2 bg-white border border-blue-200 hover:border-blue-400 hover:bg-blue-50/20 text-xs font-black rounded-lg shadow-sm text-slate-900 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
        title="Update administrator passcode"
      >
        <KeyRound className="w-3.5 h-3.5 text-blue-500" />
        Change Passcode
      </button>
    </div>
  );
}
