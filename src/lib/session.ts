import type { Difficulty, Pool, PoolImage, PublicImage } from '../types/dataset';
import { toPublicImage } from '../types/dataset';
import type { GameMode, SessionRound } from '../types/game';
import { MODES } from './modes';
import { balancedPositions, shuffle, type Rng } from './random';

export interface SessionRecord {
  rounds: SessionRound[];
  /** Server-side (or service-side) view: which image is the AI image in each round. */
  answers: Map<string, { aiImageId: string; imageIds: string[] }>;
}

export interface BuildSessionOptions {
  mode: GameMode;
  pool: Pool;
  rng?: Rng;
  /**
   * Images this player has already seen, mapped to when they were last seen.
   * Unseen images are always preferred; when a difficulty runs out of unseen
   * images, the ones seen longest ago are reused first.
   */
  seen?: ReadonlyMap<string, number>;
}

/**
 * Builds a fresh session from the image pool. Each round pairs one AI image with
 * two photographs from the same matching group. No image appears twice in a
 * session, the AI image's position follows a balanced random sequence, and the
 * photographs fill the other slots in random order.
 */
export function buildSession({ mode, pool, rng = Math.random, seen = new Map() }: BuildSessionOptions): SessionRecord {
  const used = new Set<string>();
  const humansByGroup = new Map<string, PoolImage[]>();
  for (const img of pool.images) {
    if (img.origin !== 'human') continue;
    const list = humansByGroup.get(img.group) ?? [];
    list.push(img);
    humansByGroup.set(img.group, list);
  }

  // Order candidates: unseen first (random order), then seen, oldest first.
  const freshness = (items: PoolImage[]) => {
    const unseen = shuffle(items.filter((i) => !seen.has(i.id)), rng);
    const seenItems = items.filter((i) => seen.has(i.id)).sort((a, b) => seen.get(a.id)! - seen.get(b.id)!);
    return [...unseen, ...seenItems];
  };

  const picked: Array<{ ai: PoolImage; humans: [PoolImage, PoolImage]; difficulty: Difficulty }> = [];
  for (const { difficulty, count } of MODES[mode].plan) {
    const candidates = freshness(pool.images.filter((i) => i.origin === 'ai' && i.difficulty === difficulty));
    let taken = 0;
    for (const ai of candidates) {
      if (taken >= count) break;
      if (used.has(ai.id)) continue;
      const humans = freshness((humansByGroup.get(ai.group) ?? []).filter((h) => !used.has(h.id)));
      if (humans.length < 2) continue;
      const pair: [PoolImage, PoolImage] = [humans[0]!, humans[1]!];
      picked.push({ ai, humans: pair, difficulty });
      used.add(ai.id).add(pair[0].id).add(pair[1].id);
      taken++;
    }
  }

  // Avoid two consecutive rounds from the same group where possible (stable within difficulty).
  for (let i = 1; i < picked.length; i++) {
    if (picked[i]!.ai.group !== picked[i - 1]!.ai.group) continue;
    const j = picked.findIndex((p, k) => k > i && p.difficulty === picked[i]!.difficulty && p.ai.group !== picked[i - 1]!.ai.group);
    if (j > i) [picked[i], picked[j]] = [picked[j]!, picked[i]!];
  }

  const positions = balancedPositions(picked.length, rng);
  const answers = new Map<string, { aiImageId: string; imageIds: string[] }>();
  const rounds = picked.map(({ ai, humans, difficulty }, i): SessionRound => {
    const order: PoolImage[] = shuffle(humans, rng);
    order.splice(positions[i]!, 0, ai);
    const id = `r${i + 1}-${ai.id.slice(0, 6)}`;
    answers.set(id, { aiImageId: ai.id, imageIds: order.map((o) => o.id) });
    return {
      round: { id, difficulty, category: ai.category },
      images: order.map(toPublicImage) as [PublicImage, PublicImage, PublicImage],
    };
  });

  return { rounds, answers };
}

/** How many rounds of each difficulty the pool can supply at most (ignoring freshness). */
export function poolCapacity(pool: Pool): Record<Difficulty, number> {
  const capacity: Record<Difficulty, number> = { warmup: 0, intermediate: 0, expert: 0, blind: 0 };
  const humans = new Map<string, number>();
  for (const img of pool.images) if (img.origin === 'human') humans.set(img.group, (humans.get(img.group) ?? 0) + 1);
  for (const img of pool.images) {
    if (img.origin === 'ai' && img.difficulty && (humans.get(img.group) ?? 0) >= 2) capacity[img.difficulty] += 1;
  }
  return capacity;
}
