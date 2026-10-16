import type { Difficulty } from '../types/constants';
import type { RoundResult } from '../types/game';

/**
 * Scoring rules. Kept in one module so they can be tuned without touching UI
 * code, and mirrored exactly by the server-side function in supabase/migrations.
 */
export const SCORING = {
  basePoints: 100,
  incorrectPoints: 0,
  difficultyMultiplier: {
    warmup: 1,
    intermediate: 1.25,
    expert: 1.5,
    blind: 2,
  } satisfies Record<Difficulty, number>,
  /** Bonus per consecutive correct answer before this one. */
  streakBonusStep: 10,
  maxStreakBonus: 50,
} as const;

export interface PointsInput {
  correct: boolean;
  difficulty: Difficulty;
  /** Consecutive correct answers immediately before this one. */
  streakBefore: number;
}

export function streakBonus(streakBefore: number): number {
  if (!Number.isFinite(streakBefore) || streakBefore <= 0) return 0;
  return Math.min(Math.floor(streakBefore) * SCORING.streakBonusStep, SCORING.maxStreakBonus);
}

export function basePointsFor(difficulty: Difficulty): number {
  return Math.round(SCORING.basePoints * SCORING.difficultyMultiplier[difficulty]);
}

/** Points for a single answer. Never negative. */
export function pointsFor({ correct, difficulty, streakBefore }: PointsInput): number {
  if (!correct) return SCORING.incorrectPoints;
  return basePointsFor(difficulty) + streakBonus(streakBefore);
}

export interface DifficultyStat {
  difficulty: Difficulty;
  correct: number;
  total: number;
}

export interface SessionSummary {
  score: number;
  correct: number;
  total: number;
  accuracy: number; // 0..1
  bestStreak: number;
  byDifficulty: DifficultyStat[];
}

/** Recomputes every statistic from the recorded results (single source of truth). */
export function summarize(results: RoundResult[]): SessionSummary {
  let best = 0;
  let run = 0;
  const stats = new Map<Difficulty, DifficultyStat>();
  for (const r of results) {
    run = r.correct ? run + 1 : 0;
    best = Math.max(best, run);
    const s = stats.get(r.difficulty) ?? { difficulty: r.difficulty, correct: 0, total: 0 };
    s.total += 1;
    if (r.correct) s.correct += 1;
    stats.set(r.difficulty, s);
  }
  const correct = results.filter((r) => r.correct).length;
  const order: Difficulty[] = ['warmup', 'intermediate', 'expert', 'blind'];
  return {
    score: results.reduce((sum, r) => sum + r.points, 0),
    correct,
    total: results.length,
    accuracy: results.length === 0 ? 0 : correct / results.length,
    bestStreak: best,
    byDifficulty: order.flatMap((d) => (stats.has(d) ? [stats.get(d)!] : [])),
  };
}
