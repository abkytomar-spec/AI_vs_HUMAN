// Plain constants (no validation library) so light pages can import them cheaply.
export const DIFFICULTIES = ['warmup', 'intermediate', 'expert', 'blind'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const CATEGORIES = [
  'portraits',
  'food',
  'architecture',
  'nature',
  'animals',
  'products',
  'fashion',
  'everyday',
  'interiors',
  'landscapes',
  'objects',
] as const;
export type Category = (typeof CATEGORIES)[number];

export type Origin = 'ai' | 'human';
