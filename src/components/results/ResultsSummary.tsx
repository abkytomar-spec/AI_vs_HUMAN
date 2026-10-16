import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Check, Copy, RotateCcw, Share2, X } from 'lucide-react';
import { DIFFICULTY_LABEL, MODES } from '../../lib/modes';
import { summarize } from '../../lib/scoring';
import { shareResult, shareText, type ShareOutcome } from '../../lib/share';
import { recordResult, type PersonalBest } from '../../lib/storage';
import { cn } from '../../lib/cn';
import type { GameMode, RoundResult } from '../../types/game';
import { Button, ButtonLink } from '../ui/Button';

interface ResultsSummaryProps {
  mode: GameMode;
  results: RoundResult[];
  onPlayAgain: () => void;
}

function closingLine(accuracy: number): string {
  if (accuracy === 1) return 'A clean sweep. Try a harder mode next.';
  if (accuracy >= 0.8) return 'A sharp eye. The blind rounds are where it gets difficult.';
  if (accuracy >= 0.5) return 'Better than chance. Read the notes after each round to see what you missed.';
  if (accuracy > 0.33) return 'Close to a coin toss, which is how hard this has become. Keep going.';
  return 'Modern generators fool most people. Read the notes after each round to see what you missed.';
}

export function ResultsSummary({ mode, results, onPlayAgain }: ResultsSummaryProps) {
  const summary = useMemo(() => summarize(results), [results]);
  const [best, setBest] = useState<{ previous: PersonalBest | null; isNewBest: boolean } | null>(null);
  const [share, setShare] = useState<ShareOutcome | null>(null);

  useEffect(() => {
    setBest(recordResult(mode, { score: summary.score, correct: summary.correct, total: summary.total, date: new Date().toISOString() }));
  }, [mode, summary]);

  const onShare = async () => {
    const url = new URL(import.meta.env.BASE_URL, window.location.origin).toString();
    setShare(await shareResult(shareText(mode, summary, results, url)));
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.26, ease: [0.25, 1, 0.5, 1] }}
      aria-labelledby="results-title"
      className="mx-auto w-full max-w-3xl"
    >
      <p className="text-[15px] text-ink-2">{MODES[mode].label} complete</p>
      <h1 id="results-title" className="mt-1 text-[clamp(2rem,5vw,3rem)] leading-[1.05] font-semibold tracking-[-0.03em]">
        You spotted {summary.correct} of {summary.total}.
      </h1>
      <p className="mt-3 max-w-xl text-[17px] leading-relaxed text-ink-2">{closingLine(summary.accuracy)}</p>

      <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-4">
        <Stat label="Final score" value={summary.score.toString()} />
        <Stat label="Accuracy" value={`${Math.round(summary.accuracy * 100)}%`} />
        <Stat label="Best streak" value={summary.bestStreak.toString()} />
        <Stat
          label="Personal best"
          value={best ? (best.isNewBest ? 'New best' : best.previous?.score.toString() ?? '—') : '—'}
          hint={best?.isNewBest && best.previous ? `previous ${best.previous.score}` : best?.isNewBest ? 'first game in this mode' : 'saved on this device'}
        />
      </dl>

      {summary.byDifficulty.length > 1 ? (
        <div className="mt-8">
          <h2 className="text-[15px] font-semibold">By difficulty</h2>
          <ul className="mt-3 grid gap-2">
            {summary.byDifficulty.map((d) => (
              <li key={d.difficulty} className="grid grid-cols-[7.5rem_1fr_3rem] items-center gap-3 text-[15px]">
                <span className="text-ink-2">{DIFFICULTY_LABEL[d.difficulty]}</span>
                <span className="flex h-2 overflow-hidden rounded-full bg-line" aria-hidden>
                  <span className="bg-ink" style={{ width: `${(d.correct / d.total) * 100}%` }} />
                </span>
                <span className="text-right tabular">
                  {d.correct}/{d.total}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-8">
        <h2 className="text-[15px] font-semibold">Round by round</h2>
        <ol className="mt-3 flex flex-wrap gap-1.5">
          {results.map((r, i) => (
            <li
              key={r.roundId}
              className={cn(
                'inline-flex h-8 items-center gap-1 rounded-md px-2 text-[13px] tabular ring-1',
                r.correct ? 'bg-surface text-ink ring-line' : 'bg-danger-wash text-danger ring-danger/20',
              )}
            >
              {r.correct ? <Check className="size-3.5" aria-hidden /> : <X className="size-3.5" aria-hidden />}
              {i + 1}
              <span className="sr-only">{r.correct ? 'correct' : 'missed'}, {r.points} points</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-10 flex flex-col gap-2 sm:flex-row">
        <Button size="lg" onClick={onPlayAgain}>
          <RotateCcw className="size-4" aria-hidden />
          Play again
        </Button>
        <Button size="lg" variant="secondary" onClick={onShare}>
          {share === 'copied' ? <Copy className="size-4" aria-hidden /> : <Share2 className="size-4" aria-hidden />}
          Share results
        </Button>
        <ButtonLink to="/play" size="lg" variant="ghost">
          Change mode
        </ButtonLink>
      </div>
      <p role="status" aria-live="polite" className="mt-3 min-h-5 text-[13px] text-ink-2">
        {share === 'copied' && 'Result copied to your clipboard.'}
        {share === 'shared' && 'Shared.'}
        {share === 'failed' && 'Sharing is not available here. Take a screenshot instead.'}
      </p>
      <p className="mt-6 text-[13px] text-ink-3">Scores stay on this device. Nothing is uploaded and there is no public leaderboard.</p>
    </motion.section>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="bg-surface p-4">
      <dt className="text-[13px] text-ink-2">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold tracking-tight tabular">{value}</dd>
      {hint ? <dd className="mt-0.5 text-[12px] text-ink-3">{hint}</dd> : null}
    </div>
  );
}
