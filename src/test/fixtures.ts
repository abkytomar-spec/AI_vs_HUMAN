import type { Pool, PoolImage } from '../types/dataset';
import type { Difficulty } from '../types/constants';

let counter = 0;
const hex = () => (++counter).toString(16).padStart(16, '0');

function image(origin: 'ai' | 'human', group: string, difficulty?: Difficulty): PoolImage {
  const id = hex();
  return {
    id,
    alt: `Test image ${id}`,
    category: 'animals',
    group,
    origin,
    ...(origin === 'ai' ? { difficulty: difficulty ?? 'warmup' } : {}),
    note: 'A curated test note that is long enough.',
    clues: origin === 'ai' ? ['test clue'] : [],
    noReliableTell: false,
    source: {
      title: `File:Test ${id}.jpg`,
      pageUrl: `https://commons.wikimedia.org/wiki/File:Test_${id}.jpg`,
      author: 'Tester',
      license: 'CC0',
      provenance: 'Fixture data for automated tests.',
    },
  };
}

/** A pool with `perDifficulty` AI images per level, each in its own group with 2 photographs. */
export function makePool(perDifficulty = 6): Pool {
  counter = 0;
  const images: PoolImage[] = [];
  const levels: Difficulty[] = ['warmup', 'intermediate', 'expert', 'blind'];
  for (const d of levels) {
    for (let i = 0; i < perDifficulty; i++) {
      const group = `${d}-${i}`;
      images.push(image('ai', group, d), image('human', group), image('human', group));
    }
  }
  return { version: 'test', images };
}
