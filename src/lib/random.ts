/** Small deterministic PRNG (mulberry32). Used for seeded daily challenges and tests. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Hashes a string to a 32-bit seed (FNV-1a). */
export function seedFrom(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export type Rng = () => number;

/** Fisher–Yates shuffle returning a new array. */
export function shuffle<T>(items: readonly T[], rng: Rng = Math.random): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/**
 * Target positions (0, 1 or 2) for the AI image across a session of `count` rounds.
 * Positions are spread as evenly as possible and the same position never appears
 * three times in a row, so the answer cannot be guessed from placement.
 */
export function balancedPositions(count: number, rng: Rng = Math.random): number[] {
  // Each position gets floor(count / 3) slots; leftover slots go to randomly chosen positions.
  const pool: number[] = [];
  for (let p = 0; p < 3; p++) for (let i = 0; i < Math.floor(count / 3); i++) pool.push(p);
  pool.push(...shuffle([0, 1, 2], rng).slice(0, count % 3));
  for (let attempt = 0; attempt < 50; attempt++) {
    const candidate = shuffle(pool, rng);
    if (!hasTripleRun(candidate)) return candidate;
  }
  // Fallback: interleave positions, which never has a triple run.
  return pool.sort((a, b) => a - b).map((_, i) => pool[(i * 3) % pool.length]!);
}

function hasTripleRun(values: number[]): boolean {
  for (let i = 2; i < values.length; i++) {
    if (values[i] === values[i - 1] && values[i] === values[i - 2]) return true;
  }
  return false;
}

export function randomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/** Unpredictable RNG backed by the Web Crypto API (falls back to Math.random). */
export function cryptoRng(): Rng {
  if (typeof crypto === 'undefined' || typeof crypto.getRandomValues !== 'function') return Math.random;
  const buf = new Uint32Array(64);
  let i = buf.length;
  return () => {
    if (i >= buf.length) {
      crypto.getRandomValues(buf);
      i = 0;
    }
    return buf[i++]! / 4294967296;
  };
}
