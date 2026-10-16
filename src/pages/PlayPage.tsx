import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { MotionConfig } from 'motion/react';
import { LogOut } from 'lucide-react';
import { SiteHeader } from '../components/layout/SiteHeader';
import { PageContainer } from '../components/layout/PageContainer';
import { GameScreen } from '../components/game/GameScreen';
import { ModePicker } from '../components/game/ModePicker';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { isGameMode } from '../lib/modes';
import { useRoundService } from '../app/RoundServiceContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function PlayPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const service = useRoundService();
  const modeParam = params.get('mode');
  const mode = isGameMode(modeParam) ? modeParam : null;
  const [confirmQuit, setConfirmQuit] = useState(false);
  // A fresh key per start guarantees a brand-new game state.
  const gameKey = useMemo(() => `${mode}-${Date.now()}`, [mode]);

  useDocumentTitle(mode ? 'Playing' : 'Choose a mode');

  return (
    <MotionConfig reducedMotion="user">
    <div className="flex min-h-dvh flex-col">
      <SiteHeader>
        {mode ? (
          <Button variant="ghost" onClick={() => setConfirmQuit(true)}>
            <LogOut className="size-4" aria-hidden />
            Quit game
          </Button>
        ) : undefined}
      </SiteHeader>
      <PageContainer className="flex-1">
        {mode ? (
          <GameScreen key={gameKey} service={service} mode={mode} onExit={() => setParams({})} />
        ) : (
          <section className="mx-auto max-w-2xl py-10 sm:py-14" aria-labelledby="modes-title">
            <h1 id="modes-title" className="text-[clamp(1.75rem,4vw,2.25rem)] leading-tight font-semibold tracking-[-0.03em]">
              Choose how to play
            </h1>
            <p className="mt-2 max-w-xl text-[17px] leading-relaxed text-ink-2">
              Every game is drawn fresh from the image pool, and images you have already seen on this device are held back until you have seen the rest.
            </p>
            <div className="mt-8">
              <ModePicker onPick={(m) => setParams({ mode: m })} />
            </div>
          </section>
        )}
      </PageContainer>
      <ConfirmDialog
        open={confirmQuit}
        title="Quit this game?"
        body="Your progress in this game will be lost. Scores are only saved when a game is finished."
        confirmLabel="Quit game"
        onCancel={() => setConfirmQuit(false)}
        onConfirm={() => {
          setConfirmQuit(false);
          navigate('/play');
        }}
      />
    </div>
    </MotionConfig>
  );
}
