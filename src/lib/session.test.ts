import { describe, expect, it } from 'vitest';
import { buildSession, poolCapacity } from './session';
import { balancedPositions, mulberry32, shuffle } from './random';
import { makePool } from '../test/fixtures';
import { MODES } from './modes';

const pool = makePool(6);
const byId = new Map(pool.images.map((i) => [i.id, i]));

describe('buildSession', () => {
  it('builds rounds of three distinct images with exactly one AI image', () => {
    const { rounds, answers } = buildSession({ mode: 'classic', pool, rng: mulberry32(1) });
    expect(rounds).toHaveLength(10);
    for (const r of rounds) {
      const ids = r.images.map((i) => i.id);
      expect(new Set(ids).size).toBe(3);
      const ai = ids.filter((id) => byId.get(id)!.origin === 'ai');
      expect(ai).toHaveLength(1);
      expect(answers.get(r.round.id)!.aiImageId).toBe(ai[0]);
    }
  });

  it('pairs each AI image with photographs from its own group', () => {
    const { rounds } = buildSession({ mode: 'classic', pool, rng: mulberry32(2) });
    for (const r of rounds) {
      const groups = new Set(r.images.map((i) => byId.get(i.id)!.group));
      expect(groups.size).toBe(1);
    }
  });

  it('never repeats an image within a session', () => {
    const { rounds } = buildSession({ mode: 'classic', pool, rng: mulberry32(3) });
    const all = rounds.flatMap((r) => r.images.map((i) => i.id));
    expect(new Set(all).size).toBe(all.length);
  });

  it('follows the difficulty plan of the mode', () => {
    const { rounds } = buildSession({ mode: 'classic', pool, rng: mulberry32(4) });
    const expected = MODES.classic.plan.flatMap((p) => Array(p.count).fill(p.difficulty));
    expect(rounds.map((r) => r.round.difficulty)).toEqual(expected);
  });

  it('keeps ground truth when positions are shuffled', () => {
    for (let seed = 0; seed < 50; seed++) {
      const { rounds, answers } = buildSession({ mode: 'expert', pool, rng: mulberry32(seed) });
      for (const r of rounds) {
        const aiId = answers.get(r.round.id)!.aiImageId;
        expect(byId.get(aiId)!.origin).toBe('ai');
        expect(r.images.some((i) => i.id === aiId)).toBe(true);
      }
    }
  });

  it('places the AI image in every position across many sessions, never three times in a row', () => {
    const counts = [0, 0, 0];
    for (let seed = 0; seed < 200; seed++) {
      const { rounds, answers } = buildSession({ mode: 'classic', pool, rng: mulberry32(seed) });
      const positions = rounds.map((r) => r.images.findIndex((i) => i.id === answers.get(r.round.id)!.aiImageId));
      positions.forEach((p) => counts[p]!++);
      for (let i = 2; i < positions.length; i++) {
        expect(positions[i] === positions[i - 1] && positions[i] === positions[i - 2]).toBe(false);
      }
    }
    const total = counts.reduce((a, b) => a + b, 0);
    for (const c of counts) expect(c / total).toBeGreaterThan(0.28);
  });

  it('prefers images the player has not seen', () => {
    const first = buildSession({ mode: 'warmup', pool, rng: mulberry32(7) });
    const seen = new Map<string, number>();
    first.rounds.forEach((r, i) => r.images.forEach((img) => seen.set(img.id, i)));
    const second = buildSession({ mode: 'warmup', pool, rng: mulberry32(8), seen });
    const firstAi = new Set(first.rounds.map((r) => first.answers.get(r.round.id)!.aiImageId));
    const secondAi = second.rounds.map((r) => second.answers.get(r.round.id)!.aiImageId);
    // 6 warm-up AI images, 5 per session: the one unseen image must be used first.
    const unseen = pool.images.find((i) => i.origin === 'ai' && i.difficulty === 'warmup' && !firstAi.has(i.id))!;
    expect(secondAi[0] === unseen.id || secondAi.includes(unseen.id)).toBe(true);
    // The repeats are the ones seen longest ago (the earliest rounds of the first game).
    const lastSeenFirstGame = first.answers.get(first.rounds.at(-1)!.round.id)!.aiImageId;
    expect(secondAi.includes(lastSeenFirstGame)).toBe(false);
  });

  it('produces different sessions from different random sources', () => {
    const a = buildSession({ mode: 'classic', pool, rng: mulberry32(10) }).rounds.map((r) => r.images.map((i) => i.id).join());
    const b = buildSession({ mode: 'classic', pool, rng: mulberry32(11) }).rounds.map((r) => r.images.map((i) => i.id).join());
    expect(a).not.toEqual(b);
  });

  it('shrinks a session instead of failing when a group runs out of photographs', () => {
    const thin = makePool(1);
    thin.images = thin.images.filter((img, i) => !(img.origin === 'human' && img.group === 'expert-0' && i % 2 === 0));
    const { rounds } = buildSession({ mode: 'classic', pool: thin, rng: mulberry32(1) });
    expect(rounds.every((r) => r.round.difficulty !== 'expert')).toBe(true);
    expect(poolCapacity(thin).expert).toBe(0);
  });
});

describe('random helpers', () => {
  it('balancedPositions spreads positions evenly', () => {
    const p = balancedPositions(9, mulberry32(5));
    expect([0, 1, 2].map((v) => p.filter((x) => x === v).length)).toEqual([3, 3, 3]);
  });

  it('shuffle keeps every element', () => {
    const items = [1, 2, 3, 4, 5, 6];
    expect(shuffle(items, mulberry32(9)).sort()).toEqual(items);
  });
});
