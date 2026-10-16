import type { GameAction, GameMode, GameState, RoundResult } from '../types/game';
import { pointsFor } from './scoring';

export function initialGameState(mode: GameMode): GameState {
  return {
    phase: 'loading',
    mode,
    session: null,
    index: 0,
    selection: null,
    verdict: null,
    results: [],
    score: 0,
    streak: 0,
    bestStreak: 0,
    error: null,
  };
}

export function currentRound(state: GameState) {
  return state.session?.rounds[state.index] ?? null;
}

export function isLastRound(state: GameState): boolean {
  return state.session != null && state.index >= state.session.rounds.length - 1;
}

/**
 * The game state machine. Every transition is guarded by the current phase, so
 * impossible combinations (scoring twice, changing a submitted answer, skipping a
 * round without recording it) are rejected by returning the state unchanged.
 */
export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SESSION_LOADED': {
      if (state.phase !== 'loading') return state;
      if (action.session.rounds.length === 0) {
        return { ...state, phase: 'error', error: { scope: 'session', message: 'No rounds are available for this mode yet.' } };
      }
      return { ...state, session: action.session, index: 0, phase: 'round-loading', selection: null, verdict: null, error: null };
    }

    case 'ROUND_READY': {
      if (state.phase !== 'round-loading') return state;
      if (currentRound(state)?.round.id !== action.roundId) return state;
      return { ...state, phase: 'ready' };
    }

    case 'SELECT': {
      if (state.phase !== 'ready' && state.phase !== 'selected') return state;
      if (!Number.isInteger(action.position) || action.position < 0 || action.position > 2) return state;
      return { ...state, selection: action.position, phase: 'selected' };
    }

    case 'SUBMIT': {
      if (state.phase !== 'selected' || state.selection == null) return state;
      return { ...state, phase: 'submitting' };
    }

    case 'ANSWER_RESOLVED': {
      if (state.phase !== 'submitting' || state.selection == null) return state;
      const round = currentRound(state);
      if (!round || round.round.id !== action.verdict.roundId) return state;
      if (state.results.some((r) => r.roundId === round.round.id)) return state; // already scored

      const selected = round.images[state.selection]!;
      const correct = selected.id === action.verdict.aiImageId;
      const points = action.verdict.serverPoints ?? pointsFor({ correct, difficulty: round.round.difficulty, streakBefore: state.streak });
      const streak = correct ? state.streak + 1 : 0;
      const result: RoundResult = {
        roundId: round.round.id,
        difficulty: round.round.difficulty,
        selectedImageId: selected.id,
        aiImageId: action.verdict.aiImageId,
        correct,
        points: Math.max(0, points),
        streakAfter: streak,
      };
      return {
        ...state,
        phase: 'feedback',
        verdict: action.verdict,
        results: [...state.results, result],
        score: state.score + result.points,
        streak,
        bestStreak: Math.max(state.bestStreak, streak),
      };
    }

    case 'NEXT': {
      if (state.phase !== 'feedback') return state;
      if (isLastRound(state)) return { ...state, phase: 'complete' };
      return { ...state, index: state.index + 1, phase: 'round-loading', selection: null, verdict: null };
    }

    case 'FAIL': {
      if (state.phase === 'complete') return state;
      // An answer failure keeps the selection so the player can resend it.
      return { ...state, phase: 'error', error: action.error };
    }

    case 'RETRY': {
      if (state.phase !== 'error' || !state.error) return state;
      const next = { session: 'loading', round: 'round-loading', answer: 'submitting' } as const;
      return { ...state, phase: next[state.error.scope], error: null };
    }

    case 'RESTART':
      return initialGameState(action.mode ?? state.mode);

    default:
      return state;
  }
}
