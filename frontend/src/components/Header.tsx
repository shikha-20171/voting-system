/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useCms } from '../context/CmsContext';
import { Sliders, Sparkles } from 'lucide-react';
import CmsStudio from './cms/CmsStudio';

export default function Header() {
  const { config, activeParty } = useCms();
  const [isCmsOpen, setIsCmsOpen] = useState(false);

  return (
    <>
      <header className="relative w-full flex flex-col items-center pt-4 pb-2 md:pt-5 md:pb-3 select-none animate-fade-in shrink-0" id="app-header">
        {/* Top-Right CMS Studio Trigger */}
        <div className="absolute top-2 right-4 md:top-3 md:right-6">
          <button
            onClick={() => setIsCmsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl shadow-xs border border-slate-200 bg-white/90 hover:bg-slate-50 text-slate-800 transition-all active:scale-95 cursor-pointer backdrop-blur-xs"
            title="Open Political Connect CMS Studio"
          >
            <Sliders className="w-3.5 h-3.5 text-yellow-500" />
            <span className="hidden sm:inline">CMS Studio</span>
          </button>
        </div>

        {/* Dynamic Party Logo Badge */}
        <div 
          className="w-14 h-14 md:w-16 md:h-16 bg-white border-[5px] rounded-full flex items-center justify-center shadow-md mb-2 md:mb-3 hover:scale-105 transition-transform duration-300 overflow-hidden"
          style={{ borderColor: config.primaryColor || '#eab308' }}
          id="logo-container"
        >
          {config.logoUrl ? (
            <img src={config.logoUrl} alt="Party Logo" className="w-full h-full object-cover" />
          ) : (
            <span className="text-xl md:text-2xl font-black tracking-tight text-slate-950">
              {config.activePartyCode || 'TDP'}
            </span>
          )}
        </div>

        {/* Dynamic Title */}
        <h1 
          className="text-2xl md:text-3xl lg:text-[34px] font-black tracking-tight text-slate-950 mb-1 font-sans text-center px-4"
          id="main-title"
        >
          {config.organisationName}
        </h1>

        {/* Dynamic Slogan / Subtitle */}
        <p 
          className="text-[9px] md:text-[10px] font-extrabold text-slate-500 uppercase tracking-[0.2em] mb-2 text-center max-w-xl leading-relaxed px-4"
          id="main-subtitle"
        >
          {config.slogan || `${config.stateName} Integrated Voter Management & Command Center`}
        </p>

        {/* Dynamic Color Divider */}
        <div 
          className="w-16 h-1 rounded-full transition-colors duration-300"
          style={{ backgroundColor: config.primaryColor || '#eab308' }}
          id="header-divider"
        />
      </header>

      <CmsStudio isOpen={isCmsOpen} onClose={() => setIsCmsOpen(false)} />
    </>
  );
}
