import { cn } from '../../lib/cn';

export function Spinner({ className, label = 'Loading' }: { className?: string; label?: string }) {
  return (
    <span role="status" className={cn('inline-flex items-center gap-2 text-sm text-ink-2', className)}>
      <span aria-hidden className="size-4 animate-spin rounded-full border-2 border-line-strong border-t-ink motion-reduce:animate-none" />
      <span>{label}</span>
    </span>
  );
}
