import { cn } from '../../lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap select-none ' +
  'transition-[background-color,border-color,color,transform] duration-150 ease-out active:translate-y-px ' +
  'disabled:pointer-events-none disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-ink text-white hover:bg-[#2b2b2b]',
  secondary: 'bg-surface text-ink border border-line-strong hover:border-ink/40',
  ghost: 'text-ink-2 hover:text-ink hover:bg-ink/[0.04]',
};

const sizes: Record<ButtonSize, string> = {
  md: 'h-10 px-4 text-[15px]',
  lg: 'h-12 px-5 text-base',
};

export function buttonClass(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

