import type { GameMode } from '../types/game';

/**
 * Per-device conveniences only (personal best, images already seen).
 * Every access is wrapped: storage can be unavailable in private windows or
 * embedded contexts, and the game must keep working without it.
 */
const PREFIX = 'ror:v2:';

function read<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* storage unavailable: ignore */
  }
}

export interface PersonalBest {
  score: number;
  correct: number;
  total: number;
  date: string;
}

export function getPersonalBest(mode: GameMode): PersonalBest | null {
  const value = read<PersonalBest>(`best:${mode}`);
  return value && typeof value.score === 'number' ? value : null;
}

/** Saves the result if it beats the stored best. */
export function recordResult(mode: GameMode, result: PersonalBest): { previous: PersonalBest | null; isNewBest: boolean } {
  const previous = getPersonalBest(mode);
  const isNewBest = !previous || result.score > previous.score;
  if (isNewBest) write(`best:${mode}`, result);
  return { previous, isNewBest };
}

const SEEN_KEY = 'seen-images';
const SEEN_LIMIT = 2000;

/** Image id → time it was last shown on this device. */
export function getSeenImages(): Map<string, number> {
  const raw = read<Record<string, number>>(SEEN_KEY);
  const map = new Map<string, number>();
  if (raw && typeof raw === 'object') {
    for (const [id, t] of Object.entries(raw)) if (typeof t === 'number') map.set(id, t);
  }
  return map;
}

export function markImagesSeen(ids: string[], now = Date.now()): void {
  const map = getSeenImages();
  for (const id of ids) map.set(id, now);
  const trimmed = [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, SEEN_LIMIT);
  write(SEEN_KEY, Object.fromEntries(trimmed));
}

export function clearSeenImages(): void {
  write(SEEN_KEY, {});
}
