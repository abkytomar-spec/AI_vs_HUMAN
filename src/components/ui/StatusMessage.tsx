import type { ReactNode } from 'react';
import { AlertCircle, ImageOff } from 'lucide-react';
import { cn } from '../../lib/cn';

interface StatusMessageProps {
  tone?: 'error' | 'empty';
  title: string;
  children?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

/** Shared layout for error and empty states: what happened, then what to do. */
export function StatusMessage({ tone = 'error', title, children, actions, className }: StatusMessageProps) {
  const Icon = tone === 'error' ? AlertCircle : ImageOff;
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn('mx-auto flex max-w-md flex-col items-center gap-3 rounded-lg border border-line bg-surface px-6 py-10 text-center', className)}
    >
      <Icon aria-hidden className={cn('size-6', tone === 'error' ? 'text-danger' : 'text-ink-3')} strokeWidth={1.75} />
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {children ? <div className="text-[15px] leading-relaxed text-ink-2">{children}</div> : null}
      {actions ? <div className="mt-2 flex flex-wrap justify-center gap-2">{actions}</div> : null}
    </div>
  );
}
