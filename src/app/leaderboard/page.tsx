import { Suspense } from 'react';
import LeaderboardClient from './LeaderboardClient';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function LeaderboardPage() {
  return (
    <ErrorBoundary>
      <Suspense>
        <LeaderboardClient />
      </Suspense>
    </ErrorBoundary>
  );
}
