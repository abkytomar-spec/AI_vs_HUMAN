import { cn } from '../../lib/cn';
import { BRAND } from '../../lib/brand';

/**
 * The mark is the game itself: three frames, one filled. It also appears as the
 * round-by-round progress strip and in shared results.
 */
export function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 16" aria-hidden className={cn('h-4 w-6', className)}>
      <rect x="0.75" y="0.75" width="5.5" height="14.5" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <rect x="9.25" y="0.75" width="5.5" height="14.5" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <rect x="17.75" y="0.75" width="5.5" height="14.5" rx="1" className="fill-accent stroke-accent" strokeWidth="1.5" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex shrink-0 items-center gap-2.5 text-[15px] font-semibold tracking-[-0.01em] text-ink', className)}>
      <Mark />
      <span className="max-[360px]:sr-only">{BRAND.name}</span>
    </span>
  );
}
