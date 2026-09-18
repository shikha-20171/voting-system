/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full py-3 mt-auto select-none" id="app-footer">
      <div className="w-full max-w-5xl mx-auto border-t border-gray-200 pt-3 text-center px-4">
        <p className="text-[10px] text-gray-400 font-medium tracking-wide uppercase">
          &copy; 2026 KONDAPI TDP CONNECT. AUTHORIZED ACCESS ONLY. SECURED BY TDP INFRASTRUCTURE.
        </p>
      </div>
    </footer>
  );
}
