import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router';
import { cn } from '../../lib/cn';
import { Wordmark } from './Wordmark';

const navClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'rounded-md px-2.5 py-1.5 text-[14px] transition-colors duration-150',
    isActive ? 'text-ink' : 'text-ink-2 hover:text-ink',
  );

/** Compact top bar. Pages can replace the navigation with their own controls. */
export function SiteHeader({ children }: { children?: ReactNode }) {
  return (
    <header className="border-b border-line bg-canvas/95">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="-mx-1 min-w-0 shrink-0 rounded-md px-1 py-1" aria-label="Real or Rendered, home">
          <Wordmark />
        </Link>
        {children ?? (
          <nav aria-label="Main" className="flex items-center gap-1">
            <NavLink to="/" end className={navClass}>
              Home
            </NavLink>
            <NavLink to="/play" className={navClass}>
              Play
            </NavLink>
            <NavLink to="/credits" className={(state) => cn(navClass(state), 'hidden sm:inline-flex')}>
              Image credits
            </NavLink>
          </nav>
        )}
      </div>
    </header>
  );
}
