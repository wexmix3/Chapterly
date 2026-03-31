'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { trackPage } from '@/lib/analytics';

export default function PageTracker() {
  const pathname = usePathname();

  useEffect(() => {
    trackPage(pathname);
  }, [pathname]);

  return null;
}
