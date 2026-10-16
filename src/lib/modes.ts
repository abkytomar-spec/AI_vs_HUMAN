import type { Difficulty } from '../types/constants';
import type { GameMode } from '../types/game';

export interface ModeConfig {
  mode: GameMode;
  label: string;
  description: string;
  /** Rounds per difficulty, in play order. */
  plan: Array<{ difficulty: Difficulty; count: number }>;
}

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  warmup: 'Warm-up',
  intermediate: 'Intermediate',
  expert: 'Expert',
  blind: 'Blind test',
};

export const DIFFICULTY_DESCRIPTION: Record<Difficulty, string> = {
  warmup: 'The AI image has a visible flaw if you look for it. Good for learning what to look for.',
  intermediate: 'All three images are convincing at a glance, with similar subjects and lighting.',
  expert: 'Highly realistic generations next to photographs with a similar look and quality.',
  blind: 'Every option is plausible. Some rounds have no reliable visual tell at all.',
};

export const MODES: Record<GameMode, ModeConfig> = {
  classic: {
    mode: 'classic',
    label: 'Full game',
    description: '10 rounds that get harder as you go.',
    plan: [
      { difficulty: 'warmup', count: 2 },
      { difficulty: 'intermediate', count: 3 },
      { difficulty: 'expert', count: 3 },
      { difficulty: 'blind', count: 2 },
    ],
  },
  warmup: { mode: 'warmup', label: 'Warm-up', description: '5 rounds with spottable flaws.', plan: [{ difficulty: 'warmup', count: 5 }] },
  intermediate: { mode: 'intermediate', label: 'Intermediate', description: '5 convincing rounds.', plan: [{ difficulty: 'intermediate', count: 5 }] },
  expert: { mode: 'expert', label: 'Expert', description: '5 rounds of realistic generations.', plan: [{ difficulty: 'expert', count: 5 }] },
  blind: { mode: 'blind', label: 'Blind test', description: '5 rounds with minimal visual differences.', plan: [{ difficulty: 'blind', count: 5 }] },
};

export function isGameMode(value: string | null | undefined): value is GameMode {
  return value != null && value in MODES;
}
