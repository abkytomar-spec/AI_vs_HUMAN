import { cn } from '../../lib/cn';
import { MODES } from '../../lib/modes';
import { getPersonalBest } from '../../lib/storage';
import type { GameMode } from '../../types/game';
import { DifficultyBadge } from './GameHeader';

const ORDER: GameMode[] = ['classic', 'warmup', 'intermediate', 'expert', 'blind'];

export function ModePicker({ onPick }: { onPick: (mode: GameMode) => void }) {
  return (
    <ul className="grid gap-2">
      {ORDER.map((mode) => {
        const config = MODES[mode];
        const best = getPersonalBest(mode);
        const featured = mode === 'classic';
        return (
          <li key={mode}>
            <button
              type="button"
              onClick={() => onPick(mode)}
              className={cn(
                'group flex w-full items-center justify-between gap-4 rounded-lg border px-4 py-4 text-left transition-[border-color,background-color] duration-150',
                featured ? 'border-ink bg-surface' : 'border-line bg-surface hover:border-line-strong',
              )}
            >
              <span>
                <span className="flex items-center gap-3">
                  <span className="text-[17px] font-semibold tracking-tight">{config.label}</span>
                  {mode !== 'classic' ? <DifficultyBadge difficulty={mode} /> : null}
                </span>
                <span className="mt-0.5 block text-[15px] text-ink-2">{config.description}</span>
              </span>
              <span className="shrink-0 text-right text-[13px] text-ink-2">
                {best ? (
                  <>
                    Best <span className="font-semibold text-ink tabular">{best.score}</span>
                  </>
                ) : (
                  <span className={cn('rounded-md px-2.5 py-1.5 text-[14px] font-medium', featured ? 'bg-ink text-white' : 'text-ink group-hover:bg-ink/[0.04]')}>
                    Start
                  </span>
                )}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
