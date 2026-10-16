import { describe, expect, it } from 'vitest';
import { createStaticRoundService } from './staticRoundService';
import { makePool } from '../test/fixtures';
import { mulberry32 } from '../lib/random';
import { decodePool, encodePool } from '../lib/poolCodec';

const pool = makePool(6);
const service = (raw: unknown = pool) =>
  createStaticRoundService({ loadPool: async () => raw, rng: () => mulberry32(42), seen: () => new Map() });

describe('static round service', () => {
  it('creates a session and checks answers against the pool labels', async () => {
    const s = service();
    const session = await s.createSession('classic');
    const round = session.rounds[0]!;
    const verdict = await s.submitAnswer(session.id, round.round.id, round.images[0]!.id);
    const ai = pool.images.find((i) => i.id === verdict.aiImageId)!;
    expect(ai.origin).toBe('ai');
    expect(verdict.images.map((i) => i.imageId)).toEqual(round.images.map((i) => i.id));
  });

  it('accepts only one answer per round', async () => {
    const s = service();
    const session = await s.createSession('warmup');
    const round = session.rounds[0]!;
    await s.submitAnswer(session.id, round.round.id, round.images[1]!.id);
    await expect(s.submitAnswer(session.id, round.round.id, round.images[1]!.id)).rejects.toThrow(/already been answered/);
  });

  it('rejects images and rounds that are not part of the game', async () => {
    const s = service();
    const session = await s.createSession('warmup');
    const round = session.rounds[0]!;
    await expect(s.submitAnswer(session.id, round.round.id, 'ffffffffffffffff')).rejects.toThrow(/not part of this round/);
    await expect(s.submitAnswer('other', round.round.id, round.images[0]!.id)).rejects.toThrow(/not part of the current game/);
  });

  it('reports invalid data as a recoverable error', async () => {
    await expect(service({ version: 'x', images: [] }).createSession('classic')).rejects.toThrow(/invalid/);
  });

  it('reports a failed load and can try again', async () => {
    let attempts = 0;
    const s = createStaticRoundService({
      loadPool: async () => {
        attempts++;
        if (attempts === 1) throw new Error('network');
        return pool;
      },
      rng: () => mulberry32(1),
      seen: () => new Map(),
    });
    await expect(s.createSession('classic')).rejects.toThrow(/Could not load/);
    await expect(s.createSession('classic')).resolves.toMatchObject({ mode: 'classic' });
  });

  it('round-trips the encoded pool', () => {
    const encoded = encodePool(JSON.stringify(pool));
    expect(encoded).not.toContain('"origin"');
    expect(decodePool(encoded)).toEqual(pool);
  });
});
