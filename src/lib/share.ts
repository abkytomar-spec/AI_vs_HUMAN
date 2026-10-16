import type { RoundResult } from '../types/game';
import type { SessionSummary } from './scoring';
import { BRAND } from './brand';
import { MODES } from './modes';
import type { GameMode } from '../types/game';

export function shareText(mode: GameMode, summary: SessionSummary, results: RoundResult[], url: string): string {
  const title = `${BRAND.name} · ${MODES[mode].label}`;
  const strip = results.map((r) => (r.correct ? '■' : '□')).join('');
  return [
    title,
    `${summary.correct}/${summary.total} spotted · ${summary.score} points · best streak ${summary.bestStreak}`,
    strip,
    url,
  ].join('\n');
}

export type ShareOutcome = 'shared' | 'copied' | 'cancelled' | 'failed';

/** Uses the native share sheet when available, otherwise copies to the clipboard. */
export async function shareResult(text: string): Promise<ShareOutcome> {
  try {
    if (typeof navigator.share === 'function' && window.matchMedia?.('(pointer: coarse)').matches) {
      await navigator.share({ text });
      return 'shared';
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') return 'cancelled';
  }
  try {
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch {
    return 'failed';
  }
}
