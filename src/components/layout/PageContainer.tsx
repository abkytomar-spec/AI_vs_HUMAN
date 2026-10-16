import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export function PageContainer({ children, className, as: Tag = 'main' }: { children: ReactNode; className?: string; as?: 'main' | 'div' | 'section' }) {
  return <Tag className={cn('mx-auto w-full max-w-6xl px-4 sm:px-6', className)}>{children}</Tag>;
}
