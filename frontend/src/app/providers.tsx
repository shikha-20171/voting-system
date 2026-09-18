'use client';

import React from 'react';
import { CmsProvider } from '../context/CmsContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return <CmsProvider>{children}</CmsProvider>;
}
