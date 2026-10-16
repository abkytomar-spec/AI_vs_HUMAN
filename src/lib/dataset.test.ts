import { describe, expect, it } from 'vitest';
import { PoolSchema, validatePool } from '../types/dataset';
import { decodePool } from './poolCodec';
import { POOL } from '../data/pool.generated';
import { makePool } from '../test/fixtures';

describe('dataset validation', () => {
  it('accepts a consistent pool', () => {
    expect(validatePool(makePool(1))).toEqual([]);
  });

  it('flags groups without enough photographs', () => {
    const pool = makePool(1);
    pool.images = pool.images.filter((img) => !(img.group === 'blind-0' && img.origin === 'human'));
    expect(validatePool(pool).join('\n')).toMatch(/blind-0/);
  });

  it('requires a difficulty on AI images only', () => {
    const pool = makePool(1);
    const human = pool.images.find((i) => i.origin === 'human')!;
    expect(PoolSchema.safeParse({ ...pool, images: [...pool.images, { ...human, id: 'abcdefabcdefabcd', difficulty: 'expert' }] }).success).toBe(false);
  });

  it('ships a bundled pool that is valid', () => {
    const parsed = PoolSchema.parse(decodePool(POOL));
    expect(validatePool(parsed)).toEqual([]);
  });
});
