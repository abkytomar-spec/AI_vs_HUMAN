import { Link } from 'react-router';
import { BRAND } from '../../lib/brand';

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-[13px] leading-relaxed text-ink-2 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <p className="max-w-xl">
          Images come from Wikimedia Commons under open licenses. Looking closely is a skill, not proof: some AI images have no visible tell.
        </p>
        <div className="flex gap-4">
          <Link to="/credits" className="underline decoration-line-strong underline-offset-4 hover:text-ink">
            Image credits
          </Link>
          <a href={BRAND.repoUrl} className="underline decoration-line-strong underline-offset-4 hover:text-ink">
            Source code
          </a>
        </div>
      </div>
    </footer>
  );
}
