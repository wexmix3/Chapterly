'use client';

import { useRouter } from 'next/navigation';
import { BookOpen } from 'lucide-react';

export default function FloatingReadingButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push('/dashboard?log=true')}
      aria-label="Log reading session"
      className="md:hidden fixed bottom-6 right-6 z-50 w-14 h-14 bg-brand-500 hover:bg-brand-600 active:scale-95 text-white rounded-full flex items-center justify-center shadow-lg shadow-brand-500/40 transition-all"
    >
      <BookOpen className="w-6 h-6" />
    </button>
  );
}
