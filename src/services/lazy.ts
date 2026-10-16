import type { AnswerVerdict, GameMode, Session } from '../types/game';
import type { RoundService } from './types';

/**
 * Defers loading the service implementation (and its validation code) until a
 * game actually starts, keeping it out of the home page bundle.
 */
export function createLazyRoundService(): RoundService {
  let real: Promise<RoundService> | null = null;
  const get = () => (real ??= import('./index').then((m) => m.createRoundService()));
  const source: 'static' | 'supabase' = import.meta.env.VITE_DATA_SOURCE === 'supabase' ? 'supabase' : 'static';
  return {
    kind: source,
    createSession: async (mode: GameMode): Promise<Session> => (await get()).createSession(mode),
    submitAnswer: async (sessionId: string, roundId: string, imageId: string): Promise<AnswerVerdict> =>
      (await get()).submitAnswer(sessionId, roundId, imageId),
  };
}
