import { describe, expect, it } from 'vitest';
import { basePointsFor, pointsFor, SCORING, streakBonus, summarize } from './scoring';
import type { RoundResult } from '../types/game';

describe('scoring', () => {
  it('gives the base points, scaled by difficulty, for a correct answer', () => {
    expect(pointsFor({ correct: true, difficulty: 'warmup', streakBefore: 0 })).toBe(100);
    expect(pointsFor({ correct: true, difficulty: 'intermediate', streakBefore: 0 })).toBe(125);
    expect(pointsFor({ correct: true, difficulty: 'expert', streakBefore: 0 })).toBe(150);
    expect(pointsFor({ correct: true, difficulty: 'blind', streakBefore: 0 })).toBe(200);
  });

  it('gives no points for an incorrect answer, whatever the streak or difficulty', () => {
    expect(pointsFor({ correct: false, difficulty: 'blind', streakBefore: 9 })).toBe(0);
  });

  it('adds a capped streak bonus', () => {
    expect(streakBonus(0)).toBe(0);
    expect(streakBonus(1)).toBe(SCORING.streakBonusStep);
    expect(streakBonus(100)).toBe(SCORING.maxStreakBonus);
    expect(streakBonus(-3)).toBe(0);
    expect(streakBonus(Number.NaN)).toBe(0);
    expect(pointsFor({ correct: true, difficulty: 'warmup', streakBefore: 2 })).toBe(120);
  });

  it('never produces negative points', () => {
    for (const d of ['warmup', 'intermediate', 'expert', 'blind'] as const) {
      expect(basePointsFor(d)).toBeGreaterThan(0);
      expect(pointsFor({ correct: false, difficulty: d, streakBefore: -10 })).toBeGreaterThanOrEqual(0);
    }
  });

  it('summarizes a session from its recorded results', () => {
    const r = (correct: boolean, points: number, difficulty: RoundResult['difficulty'] = 'warmup'): RoundResult => ({
      roundId: Math.random().toString(),
      difficulty,
      selectedImageId: 'a',
      aiImageId: correct ? 'a' : 'b',
      correct,
      points,
      streakAfter: 0,
    });
    const s = summarize([r(true, 100), r(true, 110), r(false, 0, 'expert'), r(true, 150, 'expert')]);
    expect(s.score).toBe(360);
    expect(s.correct).toBe(3);
    expect(s.total).toBe(4);
    expect(s.accuracy).toBe(0.75);
    expect(s.bestStreak).toBe(2);
    expect(s.byDifficulty).toEqual([
      { difficulty: 'warmup', correct: 2, total: 2 },
      { difficulty: 'expert', correct: 1, total: 2 },
    ]);
    expect(summarize([]).accuracy).toBe(0);
  });
});
