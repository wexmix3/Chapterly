import Link from 'next/link';

/**
 * Chapterly SVG logo mark.
 * The icon is a stylised open book whose spine becomes a vertical rule,
 * with a small arc above the left page to suggest a turned page / chapter
 * starting point. Paired with the wordmark in the brand font.
 *
 * Usage:
 *   <Logo />               — full lockup (icon + wordmark), links to /dashboard
 *   <Logo iconOnly />      — icon mark only (square, for favicons / tight spaces)
 *   <Logo href="/" />      — override link destination
 *   <Logo size="sm|md|lg" />
 */

interface LogoProps {
  iconOnly?: boolean;
  href?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = {
  sm: { icon: 22, textClass: 'text-base',  gap: 'gap-1.5' },
  md: { icon: 28, textClass: 'text-lg',    gap: 'gap-2'   },
  lg: { icon: 36, textClass: 'text-2xl',   gap: 'gap-2.5' },
};

export function LogoMark({ size = 28, className = '' }: { size?: number; className?: string }) {
  const s = size;
  // Grid is 20×20 units; scaled to `size` pixels via viewBox
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      {/* Left page */}
      <path
        d="M10 16.5 C10 16.5 4 15.5 4 10 L4 4.5 C4 4.5 7.5 5 10 6.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Right page */}
      <path
        d="M10 16.5 C10 16.5 16 15.5 16 10 L16 4.5 C16 4.5 12.5 5 10 6.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Spine — vertical rule connecting top & bottom of book */}
      <line
        x1="10" y1="6.5"
        x2="10" y2="16.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Page-turn arc on the upper-left page — the "chapter" mark */}
      <path
        d="M6.5 6.8 Q7.5 5.2 9.2 5.6"
        stroke="#ee7a1e"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Dot at arc origin — chapter marker */}
      <circle cx="6.5" cy="6.8" r="0.9" fill="#ee7a1e" />
    </svg>
  );
}

export default function Logo({ iconOnly = false, href = '/dashboard', size = 'md', className = '' }: LogoProps) {
  const { icon, textClass, gap } = SIZES[size];

  const inner = iconOnly ? (
    <LogoMark size={icon} />
  ) : (
    <span className={`flex items-center ${gap}`}>
      <LogoMark size={icon} className="text-ink-900 dark:text-ink-100" />
      <span
        className={`font-display font-semibold text-ink-900 dark:text-ink-100 tracking-tight leading-none ${textClass}`}
      >
        Chapter<span className="text-brand-500">ly</span>
      </span>
    </span>
  );

  return (
    <Link href={href} className={`inline-flex items-center flex-shrink-0 ${className}`} aria-label="Chapterly home">
      {inner}
    </Link>
  );
}
