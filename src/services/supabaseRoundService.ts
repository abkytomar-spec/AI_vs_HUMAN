import { z } from 'zod';
import { CATEGORIES, DIFFICULTIES, ImageSourceSchema, OriginSchema } from '../types/dataset';
import type { AnswerVerdict, GameMode, Session } from '../types/game';
import { ServiceError, type RoundService } from './types';

/**
 * Talks to the Postgres functions in supabase/migrations through Supabase's REST
 * endpoint. The database builds each session, keeps the answer key private until
 * an answer is recorded, validates round membership, accepts one answer per round
 * and computes points itself. Uses fetch directly to keep supabase-js out of the bundle.
 */
const PublicImage = z.object({ id: z.string(), alt: z.string() });
const SessionResponse = z.object({
  session_id: z.string(),
  rounds: z.array(
    z.object({
      round: z.object({ id: z.string(), difficulty: z.enum(DIFFICULTIES), category: z.enum(CATEGORIES) }),
      images: z.tuple([PublicImage, PublicImage, PublicImage]),
    }),
  ),
});

const VerdictResponse = z.object({
  round_id: z.string(),
  ai_image_id: z.string(),
  no_reliable_tell: z.boolean(),
  points: z.number().int().nonnegative(),
  images: z.array(
    z.object({ image_id: z.string(), origin: OriginSchema, note: z.string(), clues: z.array(z.string()), source: ImageSourceSchema }),
  ),
});

export interface SupabaseServiceOptions {
  fetchImpl?: typeof fetch;
  /** Image ids already seen on this device; the server avoids them when it can. */
  seen?: () => string[];
}

export function createSupabaseRoundService(url: string, anonKey: string, options: SupabaseServiceOptions = {}): RoundService {
  const fetchImpl = options.fetchImpl ?? fetch;
  const endpoint = url.replace(/\/$/, '') + '/rest/v1/rpc/';

  async function rpc(name: string, body: unknown): Promise<unknown> {
    let res: Response;
    try {
      res = await fetchImpl(endpoint + name, {
        method: 'POST',
        headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch (err) {
      throw new ServiceError('Could not reach the game server. Check your connection and try again.', err);
    }
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new ServiceError(res.status === 429 ? 'Too many requests. Wait a moment and try again.' : 'The game server rejected the request.', detail);
    }
    return res.json();
  }

  return {
    kind: 'supabase',

    async createSession(mode: GameMode): Promise<Session> {
      const parsed = SessionResponse.safeParse(await rpc('create_session', { p_mode: mode, p_seen: options.seen?.() ?? [] }));
      if (!parsed.success) throw new ServiceError('Unexpected response from the game server.', parsed.error);
      return { id: parsed.data.session_id, mode, rounds: parsed.data.rounds, source: 'supabase' };
    },

    async submitAnswer(sessionId: string, roundId: string, imageId: string): Promise<AnswerVerdict> {
      const parsed = VerdictResponse.safeParse(
        await rpc('submit_answer', { p_session_id: sessionId, p_round_id: roundId, p_image_id: imageId }),
      );
      if (!parsed.success) throw new ServiceError('Unexpected response from the game server.', parsed.error);
      const v = parsed.data;
      return {
        roundId: v.round_id,
        aiImageId: v.ai_image_id,
        noReliableTell: v.no_reliable_tell,
        images: v.images.map((i) => ({ imageId: i.image_id, origin: i.origin, note: i.note, clues: i.clues, source: i.source })),
        serverPoints: v.points,
      };
    },
  };
}
