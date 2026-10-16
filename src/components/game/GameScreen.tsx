import { useEffect, useMemo, useRef, useState } from 'react';
import { useGame } from '../../hooks/useGame';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { isLastRound } from '../../lib/gameReducer';
import { markImagesSeen } from '../../lib/storage';
import type { RoundService } from '../../services/types';
import type { GameMode } from '../../types/game';
import { ResultsSummary } from '../results/ResultsSummary';
import { Button } from '../ui/Button';
import { StatusMessage } from '../ui/StatusMessage';
import { FeedbackPanel } from './FeedbackPanel';
import { GameHeader } from './GameHeader';
import { ImageGrid } from './ImageGrid';
import { ImageInspector } from './ImageInspector';
import { RoundSkeleton } from './RoundSkeleton';
import { SubmitBar } from './SubmitBar';

interface GameScreenProps {
  service: RoundService;
  mode: GameMode;
  onExit: () => void;
}

export function GameScreen({ service, mode, onExit }: GameScreenProps) {
  const { state, round, actions } = useGame({ service, mode });
  const [inspecting, setInspecting] = useState<number | null>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const { phase, session, selection, verdict } = state;

  const result = verdict ? state.results.find((r) => r.roundId === verdict.roundId) : undefined;
  const aiPosition = verdict && round ? round.images.findIndex((img) => img.id === verdict.aiImageId) : -1;
  const roundVisible = round != null && (phase === 'ready' || phase === 'selected' || phase === 'submitting' || phase === 'feedback' || (phase === 'error' && state.error?.scope === 'answer'));

  // Remember which images this device has seen, so future sessions avoid them.
  useEffect(() => {
    if (phase === 'ready' && round) markImagesSeen(round.images.map((i) => i.id));
  }, [phase, round]);

  // Move to the top of the game when a new round or the results appear.
  useEffect(() => {
    if (phase === 'ready' || phase === 'complete') topRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, [phase, state.index]);

  useKeyboardShortcuts({
    enabled: inspecting == null,
    onSelect: phase === 'ready' || phase === 'selected' ? actions.select : undefined,
    onEnter: phase === 'selected' ? actions.submit : phase === 'feedback' ? actions.next : undefined,
  });

  const announcement = useMemo(() => {
    if (phase === 'ready' && session) return `Round ${state.index + 1} of ${session.rounds.length}. Choose the AI-generated image.`;
    if (phase === 'feedback' && result) return result.correct ? `Correct. ${result.points} points.` : `Incorrect. Image ${'ABC'[aiPosition]} was AI-generated.`;
    if (phase === 'complete') return 'Game complete.';
    return '';
  }, [phase, session, state.index, result, aiPosition]);

  if (phase === 'complete') {
    return (
      <div ref={topRef} className="scroll-mt-20 py-10 sm:py-14">
        <ResultsSummary mode={mode} results={state.results} onPlayAgain={() => actions.restart()} />
      </div>
    );
  }

  if (phase === 'error' && state.error && state.error.scope !== 'answer') {
    return (
      <div className="py-16">
        <StatusMessage
          title={state.error.scope === 'session' ? 'The game could not start' : 'This round could not load'}
          actions={
            <>
              <Button onClick={actions.retry}>Try again</Button>
              <Button variant="secondary" onClick={onExit}>
                Back to modes
              </Button>
            </>
          }
        >
          {state.error.message}
        </StatusMessage>
      </div>
    );
  }

  const total = session?.rounds.length ?? 0;

  return (
    <div ref={topRef} className="scroll-mt-20 py-5 sm:py-8">
      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
      <div className="mb-5 sm:mb-6">
        {session ? (
          <GameHeader round={state.index + 1} total={total} score={state.score} streak={state.streak} difficulty={round?.round.difficulty ?? null} results={state.results} />
        ) : (
          <div className="h-[52px]" aria-hidden />
        )}
      </div>

      <h1 className="mb-4 text-[clamp(1.25rem,2.6vw,1.6rem)] leading-tight font-semibold tracking-[-0.02em]">
        Which image is AI-generated?
      </h1>

      {roundVisible && round ? (
        <ImageGrid
          round={round}
          selection={selection}
          locked={phase === 'submitting' || phase === 'feedback' || phase === 'error'}
          aiImageId={phase === 'feedback' ? (verdict?.aiImageId ?? null) : null}
          onSelect={actions.select}
          onInspect={setInspecting}
        />
      ) : (
        <RoundSkeleton label={phase === 'loading' ? 'Preparing a new game' : 'Loading images'} />
      )}

      <div className="mt-5">
        {phase === 'feedback' && verdict && result ? (
          <FeedbackPanel verdict={verdict} result={result} aiPosition={aiPosition} isLast={isLastRound(state)} onNext={actions.next} />
        ) : phase === 'error' && state.error?.scope === 'answer' ? (
          <StatusMessage title="Your answer was not checked" actions={<Button onClick={actions.retry}>Send answer again</Button>}>
            {state.error.message}
          </StatusMessage>
        ) : (
          <SubmitBar canSubmit={phase === 'selected'} submitting={phase === 'submitting'} onSubmit={actions.submit} />
        )}
      </div>

      {round ? (
        <ImageInspector
          images={round.images}
          index={inspecting}
          canSelect={phase === 'ready' || phase === 'selected'}
          selected={selection}
          onSelect={actions.select}
          onNavigate={setInspecting}
          onClose={() => setInspecting(null)}
        />
      ) : null}
    </div>
  );
}
