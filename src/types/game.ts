import type { Category, Difficulty, Origin } from './constants';
import type { ImageSource, PublicImage } from './dataset';

export const GAME_MODES = ['classic', 'warmup', 'intermediate', 'expert', 'blind'] as const;
export type GameMode = (typeof GAME_MODES)[number];

export interface RoundInfo {
  id: string;
  difficulty: Difficulty;
  category: Category;
}

/** A round as presented: three images in display order (index 0 is "A"). */
export interface SessionRound {
  round: RoundInfo;
  images: [PublicImage, PublicImage, PublicImage];
}

export interface Session {
  id: string;
  mode: GameMode;
  rounds: SessionRound[];
  /** Where answers are checked. */
  source: 'static' | 'supabase';
}

export interface RevealedImage {
  imageId: string;
  origin: Origin;
  note: string;
  clues: string[];
  source: ImageSource;
}

/** Returned by a round service once an answer has been recorded. */
export interface AnswerVerdict {
  roundId: string;
  aiImageId: string;
  noReliableTell: boolean;
  images: RevealedImage[];
  /** Points awarded by the server, when the server is authoritative. */
  serverPoints?: number;
}

export interface RoundResult {
  roundId: string;
  difficulty: Difficulty;
  selectedImageId: string;
  aiImageId: string;
  correct: boolean;
  points: number;
  streakAfter: number;
}

export type GamePhase =
  | 'loading' // creating the session
  | 'round-loading' // loading the current round's images
  | 'ready' // round visible, nothing selected
  | 'selected' // an image is selected, not yet submitted
  | 'submitting' // waiting for the verdict
  | 'feedback' // verdict shown
  | 'complete' // all rounds answered
  | 'error'; // recoverable error

export type ErrorScope = 'session' | 'round' | 'answer';

export interface GameError {
  scope: ErrorScope;
  message: string;
}

export interface GameState {
  phase: GamePhase;
  mode: GameMode;
  session: Session | null;
  index: number;
  /** Position (0-2) of the selected image in the current round. */
  selection: number | null;
  verdict: AnswerVerdict | null;
  results: RoundResult[];
  score: number;
  streak: number;
  bestStreak: number;
  error: GameError | null;
}

export type GameAction =
  | { type: 'SESSION_LOADED'; session: Session }
  | { type: 'ROUND_READY'; roundId: string }
  | { type: 'SELECT'; position: number }
  | { type: 'SUBMIT' }
  | { type: 'ANSWER_RESOLVED'; verdict: AnswerVerdict }
  | { type: 'NEXT' }
  | { type: 'FAIL'; error: GameError }
  | { type: 'RETRY' }
  | { type: 'RESTART'; mode?: GameMode };
