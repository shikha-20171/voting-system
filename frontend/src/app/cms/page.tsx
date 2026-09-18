'use client';

import dynamic from 'next/dynamic';

const App = dynamic(() => import('../../App'), { ssr: false });

export default function CmsPage() {
  return <App initialPath="/cms" />;
}
