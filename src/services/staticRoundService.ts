import { decodePool } from '../lib/poolCodec';
import { cryptoRng, randomId, type Rng } from '../lib/random';
import { buildSession } from '../lib/session';
import { getSeenImages } from '../lib/storage';
import { PoolSchema, type Pool } from '../types/dataset';
import type { AnswerVerdict, GameMode, RevealedImage, Session } from '../types/game';
import { ServiceError, type RoundService } from './types';

export interface StaticServiceOptions {
  /** Returns the raw pool (already decoded). Defaults to the bundled, encoded pool. */
  loadPool?: () => Promise<unknown>;
  rng?: () => Rng;
  seen?: () => ReadonlyMap<string, number>;
}

/**
 * Static mode: the curated pool ships with the app and answers are checked in the
 * browser. Sessions are generated fresh each time and prefer images this device
 * has not seen yet.
 */
export function createStaticRoundService(options: StaticServiceOptions = {}): RoundService {
  const loadPool = options.loadPool ?? (() => import('../data/pool.generated').then((m) => decodePool(m.POOL)));
  const makeRng = options.rng ?? cryptoRng;
  const readSeen = options.seen ?? getSeenImages;

  let pool: Promise<Pool> | null = null;
  const sessions = new Map<string, Map<string, { aiImageId: string; imageIds: string[]; answered: boolean }>>();

  const getPool = () =>
    (pool ??= loadPool().then((raw) => {
      const parsed = PoolSchema.safeParse(raw);
      if (!parsed.success) throw new ServiceError('The image data is invalid.', parsed.error);
      return parsed.data;
    })).catch((err: unknown) => {
      pool = null;
      throw err instanceof ServiceError ? err : new ServiceError('Could not load the images for this game.', err);
    });

  return {
    kind: 'static',

    async createSession(mode: GameMode): Promise<Session> {
      const data = await getPool();
      const { rounds, answers } = buildSession({ mode, pool: data, rng: makeRng(), seen: readSeen() });
      const id = randomId();
      sessions.set(id, new Map([...answers].map(([roundId, a]) => [roundId, { ...a, answered: false }])));
      return { id, mode, rounds, source: 'static' };
    },

    async submitAnswer(sessionId: string, roundId: string, imageId: string): Promise<AnswerVerdict> {
      const round = sessions.get(sessionId)?.get(roundId);
      if (!round) throw new ServiceError('This round is not part of the current game.');
      if (round.answered) throw new ServiceError('This round has already been answered.');
      if (!round.imageIds.includes(imageId)) throw new ServiceError('That image is not part of this round.');
      round.answered = true;

      const data = await getPool();
      const byId = new Map(data.images.map((img) => [img.id, img]));
      const images: RevealedImage[] = round.imageIds.map((id) => {
        const img = byId.get(id)!;
        return { imageId: id, origin: img.origin, note: img.note, clues: img.clues, source: img.source };
      });
      return {
        roundId,
        aiImageId: round.aiImageId,
        noReliableTell: byId.get(round.aiImageId)?.noReliableTell ?? false,
        images,
      };
    },
  };
}
