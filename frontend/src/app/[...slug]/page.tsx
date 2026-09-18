'use client';

import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';

const App = dynamic(() => import('../../App'), { ssr: false });

export default function CatchAllPage() {
  const params = useParams();
  const slug = params?.slug;
  const path = Array.isArray(slug) ? `/${slug.join('/')}` : '/';

  return <App initialPath={path} />;
}
