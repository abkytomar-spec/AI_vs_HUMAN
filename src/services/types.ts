import type { AnswerVerdict, GameMode, Session } from '../types/game';

/**
 * Boundary between the game and wherever rounds and answers live.
 * The static implementation checks answers in the browser; the Supabase
 * implementation asks the server, which keeps the answer key private.
 */
export interface RoundService {
  readonly kind: 'static' | 'supabase';
  createSession(mode: GameMode): Promise<Session>;
  submitAnswer(sessionId: string, roundId: string, imageId: string): Promise<AnswerVerdict>;
}

export class ServiceError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'ServiceError';
  }
}
