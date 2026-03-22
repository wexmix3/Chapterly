import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  headline: string;
  sub?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  actionHref?: string;
  children?: React.ReactNode;
}

export default function EmptyState({
  icon: Icon,
  headline,
  sub,
  action,
  actionHref,
  children,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-16 h-16 bg-ink-100 dark:bg-ink-800 rounded-2xl flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-ink-400 dark:text-ink-500" />
      </div>
      <h3 className="font-semibold text-ink-700 dark:text-ink-300 mb-2">{headline}</h3>
      {sub && <p className="text-sm text-ink-400 dark:text-ink-500 max-w-xs mb-6">{sub}</p>}
      {children}
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-xl transition-colors"
        >
          {action.label}
        </button>
      )}
      {actionHref && !action && (
        <a
          href={actionHref}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-xl transition-colors"
        >
          Get started
        </a>
      )}
    </div>
  );
}
