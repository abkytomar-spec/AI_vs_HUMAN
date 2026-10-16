import { motion } from 'motion/react';
import { ArrowRight, CircleCheck, CircleX } from 'lucide-react';
import { cn } from '../../lib/cn';
import type { AnswerVerdict, RoundResult } from '../../types/game';
import { Button } from '../ui/Button';
import { Kbd } from '../ui/Kbd';
import { ExplanationPanel } from './ExplanationPanel';

interface FeedbackPanelProps {
  verdict: AnswerVerdict;
  result: RoundResult;
  aiPosition: number;
  isLast: boolean;
  onNext: () => void;
}

const LETTERS = ['A', 'B', 'C'];

export function FeedbackPanel({ verdict, result, aiPosition, isLast, onNext }: FeedbackPanelProps) {
  const correct = result.correct;
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
      aria-labelledby="verdict-title"
      className="rounded-lg border border-line bg-surface"
    >
      <div className="flex flex-col gap-4 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex items-start gap-3">
          {correct ? (
            <CircleCheck className="mt-0.5 size-6 shrink-0 text-success" strokeWidth={2} aria-hidden />
          ) : (
            <CircleX className="mt-0.5 size-6 shrink-0 text-danger" strokeWidth={2} aria-hidden />
          )}
          <div>
            <h2 id="verdict-title" className="text-lg font-semibold tracking-tight">
              {correct ? 'You spotted it.' : `Not this time. Image ${LETTERS[aiPosition]} was AI-generated.`}
            </h2>
            <p className={cn('mt-0.5 text-[15px] tabular', correct ? 'text-ink-2' : 'text-ink-2')}>
              {correct ? `+${result.points} points` : '0 points'}
              <span aria-hidden> · </span>
              {correct ? `streak ${result.streakAfter}` : 'streak reset'}
            </p>
          </div>
        </div>
        <Button size="lg" onClick={onNext} className="w-full sm:w-auto" autoFocus>
          {isLast ? 'See results' : 'Next round'}
          <ArrowRight className="size-4" aria-hidden />
          <Kbd className="ml-1 hidden border-white/25 bg-white/10 text-white/80 sm:inline-flex">Enter</Kbd>
        </Button>
      </div>
      <ExplanationPanel verdict={verdict} />
    </motion.section>
  );
}
