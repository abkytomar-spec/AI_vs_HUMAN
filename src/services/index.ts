import { getSeenImages } from '../lib/storage';
import { createStaticRoundService } from './staticRoundService';
import { createSupabaseRoundService } from './supabaseRoundService';
import type { RoundService } from './types';

export type { RoundService } from './types';

/**
 * Chooses the data source from environment variables. Supabase is used only when
 * explicitly enabled and fully configured; otherwise the app runs in static mode.
 */
export function createRoundService(env: ImportMetaEnv = import.meta.env): RoundService {
  const url = env.VITE_SUPABASE_URL?.trim();
  const key = env.VITE_SUPABASE_ANON_KEY?.trim();
  if (env.VITE_DATA_SOURCE === 'supabase') {
    if (url && key) return createSupabaseRoundService(url, key, { seen: () => [...getSeenImages().keys()] });
    console.warn('[real-or-rendered] VITE_DATA_SOURCE=supabase but URL or anon key is missing; using static mode.');
  }
  return createStaticRoundService();
}
