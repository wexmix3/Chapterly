'use client';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`animate-pulse bg-ink-100 dark:bg-ink-800 rounded-lg ${className}`} />
  );
}

export function BookCardSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 bg-white dark:bg-ink-900 rounded-2xl border border-ink-100 dark:border-ink-800">
      <Skeleton className="w-12 h-16 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-1.5 w-full mt-3" />
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white dark:bg-ink-900 rounded-2xl border border-ink-100 dark:border-ink-800 p-5">
      <Skeleton className="h-3 w-20 mb-3" />
      <Skeleton className="h-8 w-16 mb-1" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

export function FeedEventSkeleton() {
  return (
    <div className="p-4 bg-white dark:bg-ink-900 rounded-2xl border border-ink-100 dark:border-ink-800">
      <div className="flex items-start gap-3">
        <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="w-10 h-14 rounded-lg flex-shrink-0" />
      </div>
    </div>
  );
}

export function LeaderRowSkeleton() {
  return (
    <div className="flex items-center gap-3 p-4 bg-white dark:bg-ink-900 rounded-2xl border border-ink-100 dark:border-ink-800">
      <Skeleton className="w-8 h-5 rounded" />
      <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-5 w-14 rounded-full" />
    </div>
  );
}

export function NotifSkeleton() {
  return (
    <div className="flex items-start gap-3 p-4 bg-white dark:bg-ink-900 rounded-2xl border border-ink-100 dark:border-ink-800">
      <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/4" />
      </div>
    </div>
  );
}
