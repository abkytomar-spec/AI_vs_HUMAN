import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { currentRound, gameReducer, initialGameState } from '../lib/gameReducer';
import { preloadRound } from '../lib/images';
import type { RoundService } from '../services/types';
import type { GameMode } from '../types/game';

export interface UseGameOptions {
  service: RoundService;
  mode: GameMode;
  preload?: typeof preloadRound;
}

/**
 * Wires the pure reducer to side effects: creating the session, loading each
 * round's images, and resolving answers. Each effect is keyed on the phase so it
 * runs exactly once per transition, and stale async results are ignored.
 */
export function useGame({ service, mode, preload = preloadRound }: UseGameOptions) {
  const [state, dispatch] = useReducer(gameReducer, mode, initialGameState);
  const round = currentRound(state);
  const roundId = round?.round.id;
  const generation = useRef(0);

  // Create a session whenever we enter `loading`.
  useEffect(() => {
    if (state.phase !== 'loading') return;
    const gen = ++generation.current;
    service
      .createSession(state.mode)
      .then((session) => gen === generation.current && dispatch({ type: 'SESSION_LOADED', session }))
      .catch((err: unknown) => {
        if (gen !== generation.current) return;
        dispatch({ type: 'FAIL', error: { scope: 'session', message: messageOf(err, 'Could not start a game.') } });
      });
  }, [state.phase, state.mode, service]);

  // Load all three images of the current round before revealing it.
  useEffect(() => {
    if (state.phase !== 'round-loading' || !round) return;
    let cancelled = false;
    preload(round.images)
      .then(() => !cancelled && dispatch({ type: 'ROUND_READY', roundId: round.round.id }))
      .catch(() => {
        if (cancelled) return;
        dispatch({
          type: 'FAIL',
          error: { scope: 'round', message: 'Some images for this round did not load. Check your connection and try again.' },
        });
      });
    return () => {
      cancelled = true;
    };
  }, [state.phase, round, preload]);

  // Resolve the submitted answer.
  useEffect(() => {
    if (state.phase !== 'submitting' || !round || !state.session || state.selection == null) return;
    let cancelled = false;
    const imageId = round.images[state.selection]!.id;
    service
      .submitAnswer(state.session.id, round.round.id, imageId)
      .then((verdict) => !cancelled && dispatch({ type: 'ANSWER_RESOLVED', verdict }))
      .catch((err: unknown) => {
        if (cancelled) return;
        dispatch({ type: 'FAIL', error: { scope: 'answer', message: messageOf(err, 'Could not check your answer.') } });
      });
    return () => {
      cancelled = true;
    };
    // roundId/selection identify the request; the effect must not re-run for other changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, roundId, state.selection]);

  // Warm the cache for the next round while the player reads the feedback.
  useEffect(() => {
    if (state.phase !== 'feedback' || !state.session) return;
    const next = state.session.rounds[state.index + 1];
    if (next) preload(next.images).catch(() => undefined);
  }, [state.phase, state.index, state.session, preload]);

  const select = useCallback((position: number) => dispatch({ type: 'SELECT', position }), []);
  const submit = useCallback(() => dispatch({ type: 'SUBMIT' }), []);
  const next = useCallback(() => dispatch({ type: 'NEXT' }), []);
  const retry = useCallback(() => dispatch({ type: 'RETRY' }), []);
  const restart = useCallback((m?: GameMode) => dispatch({ type: 'RESTART', mode: m }), []);

  const actions = useMemo(() => ({ select, submit, next, retry, restart }), [select, submit, next, retry, restart]);
  return { state, round, actions };
}

function messageOf(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}
