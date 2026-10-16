import { describe, expect, it } from 'vitest';
import { gameReducer, initialGameState } from './gameReducer';
import type { AnswerVerdict, GameState, Session } from '../types/game';

function session(rounds = 3): Session {
  return {
    id: 's1',
    mode: 'classic',
    source: 'static',
    rounds: Array.from({ length: rounds }, (_, i) => ({
      round: { id: `r${i}`, difficulty: 'warmup' as const, category: 'animals' as const },
      images: [
        { id: `r${i}-a`, alt: 'a' },
        { id: `r${i}-b`, alt: 'b' },
        { id: `r${i}-c`, alt: 'c' },
      ] as Session['rounds'][number]['images'],
    })),
  };
}

const verdict = (roundIndex: number, aiPosition = 1): AnswerVerdict => ({
  roundId: `r${roundIndex}`,
  aiImageId: `r${roundIndex}-${'abc'[aiPosition]}`,
  noReliableTell: false,
  images: [],
});

function ready(rounds = 3): GameState {
  let s = gameReducer(initialGameState('classic'), { type: 'SESSION_LOADED', session: session(rounds) });
  s = gameReducer(s, { type: 'ROUND_READY', roundId: 'r0' });
  return s;
}

function answer(s: GameState, position: number, aiPosition = 1): GameState {
  s = gameReducer(s, { type: 'SELECT', position });
  s = gameReducer(s, { type: 'SUBMIT' });
  return gameReducer(s, { type: 'ANSWER_RESOLVED', verdict: verdict(s.index, aiPosition) });
}

describe('gameReducer', () => {
  it('moves from loading to a ready round', () => {
    const s = ready();
    expect(s.phase).toBe('ready');
    expect(s.selection).toBeNull();
  });

  it('selects and changes the selection before submitting', () => {
    let s = gameReducer(ready(), { type: 'SELECT', position: 0 });
    expect(s.phase).toBe('selected');
    s = gameReducer(s, { type: 'SELECT', position: 2 });
    expect(s.selection).toBe(2);
  });

  it('ignores invalid positions', () => {
    const s = ready();
    expect(gameReducer(s, { type: 'SELECT', position: 3 })).toBe(s);
    expect(gameReducer(s, { type: 'SELECT', position: -1 })).toBe(s);
  });

  it('prevents submitting without a selection', () => {
    const s = ready();
    expect(gameReducer(s, { type: 'SUBMIT' })).toBe(s);
  });

  it('scores a correct answer and grows the streak', () => {
    const s = answer(ready(), 1);
    expect(s.phase).toBe('feedback');
    expect(s.score).toBe(100);
    expect(s.streak).toBe(1);
    expect(s.results[0]).toMatchObject({ correct: true, points: 100 });
  });

  it('gives no points for a wrong answer and resets the streak', () => {
    let s = answer(ready(), 1);
    s = gameReducer(s, { type: 'NEXT' });
    s = gameReducer(s, { type: 'ROUND_READY', roundId: 'r1' });
    s = answer(s, 0);
    expect(s.results[1]).toMatchObject({ correct: false, points: 0 });
    expect(s.score).toBe(100);
    expect(s.streak).toBe(0);
    expect(s.bestStreak).toBe(1);
  });

  it('adds the streak bonus on consecutive correct answers', () => {
    let s = answer(ready(), 1);
    s = gameReducer(gameReducer(s, { type: 'NEXT' }), { type: 'ROUND_READY', roundId: 'r1' });
    s = answer(s, 1);
    expect(s.results[1]!.points).toBe(110);
    expect(s.score).toBe(210);
  });

  it('prevents duplicate submissions and double scoring', () => {
    let s = gameReducer(ready(), { type: 'SELECT', position: 1 });
    s = gameReducer(s, { type: 'SUBMIT' });
    expect(gameReducer(s, { type: 'SUBMIT' })).toBe(s);
    s = gameReducer(s, { type: 'ANSWER_RESOLVED', verdict: verdict(0) });
    const again = gameReducer(s, { type: 'ANSWER_RESOLVED', verdict: verdict(0) });
    expect(again).toBe(s);
    expect(s.results).toHaveLength(1);
  });

  it('locks the selection after submitting', () => {
    let s = gameReducer(ready(), { type: 'SELECT', position: 1 });
    s = gameReducer(s, { type: 'SUBMIT' });
    expect(gameReducer(s, { type: 'SELECT', position: 0 })).toBe(s);
    s = gameReducer(s, { type: 'ANSWER_RESOLVED', verdict: verdict(0) });
    expect(gameReducer(s, { type: 'SELECT', position: 0 })).toBe(s);
  });

  it('does not allow skipping a round without answering', () => {
    const s = ready();
    expect(gameReducer(s, { type: 'NEXT' })).toBe(s);
    const selected = gameReducer(s, { type: 'SELECT', position: 0 });
    expect(gameReducer(selected, { type: 'NEXT' })).toBe(selected);
  });

  it('ignores a verdict for a different round', () => {
    let s = gameReducer(ready(), { type: 'SELECT', position: 1 });
    s = gameReducer(s, { type: 'SUBMIT' });
    expect(gameReducer(s, { type: 'ANSWER_RESOLVED', verdict: verdict(2) })).toBe(s);
  });

  it('moves to the results after the final round', () => {
    let s = ready(2);
    s = answer(s, 1);
    s = gameReducer(gameReducer(s, { type: 'NEXT' }), { type: 'ROUND_READY', roundId: 'r1' });
    s = answer(s, 2);
    s = gameReducer(s, { type: 'NEXT' });
    expect(s.phase).toBe('complete');
    expect(s.results).toHaveLength(2);
    expect(s.score).toBe(100);
  });

  it('restarts with a clean state', () => {
    let s = answer(ready(), 1);
    s = gameReducer(s, { type: 'RESTART' });
    expect(s).toEqual(initialGameState('classic'));
    expect(gameReducer(s, { type: 'RESTART', mode: 'expert' }).mode).toBe('expert');
  });

  it('recovers from a round loading error', () => {
    let s = gameReducer(initialGameState('classic'), { type: 'SESSION_LOADED', session: session() });
    s = gameReducer(s, { type: 'FAIL', error: { scope: 'round', message: 'Images failed' } });
    expect(s.phase).toBe('error');
    s = gameReducer(s, { type: 'RETRY' });
    expect(s.phase).toBe('round-loading');
    expect(s.error).toBeNull();
  });

  it('keeps the selection when an answer fails, so it can be sent again', () => {
    let s = gameReducer(ready(), { type: 'SELECT', position: 2 });
    s = gameReducer(s, { type: 'SUBMIT' });
    s = gameReducer(s, { type: 'FAIL', error: { scope: 'answer', message: 'Offline' } });
    expect(s.selection).toBe(2);
    s = gameReducer(s, { type: 'RETRY' });
    expect(s.phase).toBe('submitting');
  });

  it('reports an empty session as an error', () => {
    const s = gameReducer(initialGameState('classic'), { type: 'SESSION_LOADED', session: session(0) });
    expect(s.phase).toBe('error');
  });
});
