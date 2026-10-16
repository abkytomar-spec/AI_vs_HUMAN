import { Flame } from 'lucide-react';
import { cn } from '../../lib/cn';
import { DIFFICULTY_LABEL } from '../../lib/modes';
import { useCountUp } from '../../hooks/useCountUp';
import type { Difficulty } from '../../types/constants';
import type { RoundResult } from '../../types/game';

interface GameHeaderProps {
  round: number; // 1-based
  total: number;
  score: number;
  streak: number;
  difficulty: Difficulty | null;
  results: RoundResult[];
}

export function GameHeader({ round, total, score, streak, difficulty, results }: GameHeaderProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1.5">
        <div className="flex min-w-0 shrink-0 flex-wrap items-baseline gap-x-3 gap-y-1">
          <p className="text-[15px] whitespace-nowrap text-ink-2">
            Round <span className="font-semibold text-ink tabular">{round}</span>
            <span className="tabular"> of {total}</span>
          </p>
          {difficulty ? <DifficultyBadge difficulty={difficulty} /> : null}
        </div>
        <div className="flex shrink-0 items-center gap-4 sm:gap-5">
          <StreakIndicator streak={streak} />
          <ScoreDisplay score={score} />
        </div>
      </div>
      <ProgressStrip total={total} current={round - 1} results={results} />
    </div>
  );
}

export function ScoreDisplay({ score }: { score: number }) {
  const shown = useCountUp(score);
  return (
    <p className="flex items-baseline gap-1.5">
      <span className="text-[13px] text-ink-2">Score</span>
      <span className="text-xl font-semibold tracking-tight tabular" aria-hidden>
        {shown}
      </span>
      <span className="sr-only">{score}</span>
    </p>
  );
}

export function StreakIndicator({ streak }: { streak: number }) {
  const hot = streak >= 2;
  return (
    <p className={cn('flex items-baseline gap-1.5', hot ? 'text-ink' : 'text-ink-2')} title="Correct answers in a row">
      <Flame aria-hidden className={cn('size-4 self-center transition-colors duration-200', hot ? 'text-accent' : 'text-ink-3')} strokeWidth={2} />
      <span className="text-[13px] text-ink-2">Streak</span>
      <span className="text-[15px] font-semibold tabular">{streak}</span>
    </p>
  );
}

const DIFFICULTY_DOTS: Record<Difficulty, number> = { warmup: 1, intermediate: 2, expert: 3, blind: 4 };

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const level = DIFFICULTY_DOTS[difficulty];
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] whitespace-nowrap text-ink-2">
      <span aria-hidden className="flex gap-0.5">
        {[1, 2, 3, 4].map((n) => (
          <span key={n} className={cn('h-2.5 w-1 rounded-full', n <= level ? 'bg-ink' : 'bg-line-strong')} />
        ))}
      </span>
      {DIFFICULTY_LABEL[difficulty]}
    </span>
  );
}

/** One segment per round: filled as rounds are answered, marked for correct and missed. */
export function ProgressStrip({ total, current, results }: { total: number; current: number; results: RoundResult[] }) {
  return (
    <ol className="grid gap-1" style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }} aria-label="Progress">
      {Array.from({ length: total }, (_, i) => {
        const r = results[i];
        const state = r ? (r.correct ? 'correct' : 'wrong') : i === current ? 'current' : 'todo';
        return (
          <li
            key={i}
            className={cn(
              'h-1.5 rounded-full transition-colors duration-300',
              state === 'correct' && 'bg-ink',
              state === 'wrong' && 'bg-danger/70',
              state === 'current' && 'bg-accent',
              state === 'todo' && 'bg-line-strong/70',
            )}
          >
            <span className="sr-only">
              Round {i + 1}: {state === 'correct' ? 'correct' : state === 'wrong' ? 'missed' : state === 'current' ? 'current' : 'not played'}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
