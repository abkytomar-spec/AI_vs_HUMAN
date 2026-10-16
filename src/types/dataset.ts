import { z } from 'zod';

import { CATEGORIES, DIFFICULTIES } from './constants';

export { CATEGORIES, DIFFICULTIES } from './constants';
export type { Category, Difficulty } from './constants';

export const OriginSchema = z.enum(['ai', 'human']);
export type Origin = z.infer<typeof OriginSchema>;

const imageId = z.string().regex(/^[a-f0-9]{16}$/, 'image ids are opaque 16-character hex hashes');

/** Source, license and provenance for one image. Shown after the round and on the credits page. */
export const ImageSourceSchema = z.object({
  /** Wikimedia Commons file title, e.g. "File:Example.jpg". */
  title: z.string().min(6),
  pageUrl: z.url(),
  author: z.string().min(1),
  license: z.string().min(2),
  licenseUrl: z.url().optional(),
  /** AI images: the generator named on the file page. */
  generator: z.string().optional(),
  /** Photographs: camera model recorded in the file's metadata, when present. */
  camera: z.string().optional(),
  /** Capture or creation date as recorded on the file page. */
  date: z.string().optional(),
  /** How the origin label was established, in plain language. */
  provenance: z.string().min(10),
});
export type ImageSource = z.infer<typeof ImageSourceSchema>;

/**
 * One curated image. Rounds are not stored: each session draws one AI image and
 * two photographs from the same matching group, so the same images do not keep
 * appearing together.
 */
export const PoolImageSchema = z
  .object({
    id: imageId,
    alt: z.string().min(8),
    category: z.enum(CATEGORIES),
    /** Images are only ever compared within the same group (similar subject and look). */
    group: z.string().regex(/^[a-z0-9-]+$/),
    origin: OriginSchema,
    /** AI images only: how hard this generation is to spot, judged by the curator. */
    difficulty: z.enum(DIFFICULTIES).optional(),
    /** Curated notes about this exact image. For AI images: what can give it away. */
    note: z.string().min(20),
    clues: z.array(z.string().min(2)).max(4).default([]),
    /** AI images only: true when the curator found no reliable visual tell. */
    noReliableTell: z.boolean().default(false),
    source: ImageSourceSchema,
  })
  .superRefine((img, ctx) => {
    if (img.origin === 'ai' && !img.difficulty) ctx.addIssue({ code: 'custom', message: `${img.id}: AI images need a difficulty` });
    if (img.origin === 'human' && img.difficulty) ctx.addIssue({ code: 'custom', message: `${img.id}: only AI images have a difficulty` });
  });
export type PoolImage = z.infer<typeof PoolImageSchema>;

export const PoolSchema = z.object({
  version: z.string(),
  images: z.array(PoolImageSchema).min(3),
});
export type Pool = z.infer<typeof PoolSchema>;

/** What the UI is allowed to know about an image before the answer is revealed. */
export interface PublicImage {
  id: string;
  alt: string;
}

export function toPublicImage(img: Pick<PoolImage, 'id' | 'alt'>): PublicImage {
  return { id: img.id, alt: img.alt };
}

/**
 * Invariants the schema alone cannot express. Returns human-readable problems;
 * an empty list means the pool can produce valid rounds.
 */
export function validatePool(pool: Pool): string[] {
  const problems: string[] = [];
  const ids = new Set<string>();
  const titles = new Set<string>();
  const byGroup = new Map<string, { ai: number; human: number; categories: Set<string> }>();

  for (const img of pool.images) {
    if (ids.has(img.id)) problems.push(`duplicate image id ${img.id}`);
    ids.add(img.id);
    if (titles.has(img.source.title)) problems.push(`source used twice: ${img.source.title}`);
    titles.add(img.source.title);
    const g = byGroup.get(img.group) ?? { ai: 0, human: 0, categories: new Set<string>() };
    g[img.origin === 'ai' ? 'ai' : 'human'] += 1;
    g.categories.add(img.category);
    byGroup.set(img.group, g);
  }
  for (const [group, g] of byGroup) {
    if (g.ai > 0 && g.human < 2) problems.push(`group "${group}" has ${g.human} photograph(s); at least 2 are needed per round`);
    if (g.categories.size > 1) problems.push(`group "${group}" mixes categories`);
  }
  for (const d of DIFFICULTIES) {
    if (!pool.images.some((i) => i.origin === 'ai' && i.difficulty === d)) problems.push(`no AI images at difficulty "${d}"`);
  }
  return problems;
}
