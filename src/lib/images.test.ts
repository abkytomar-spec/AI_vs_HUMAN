import { describe, expect, it, vi } from 'vitest';
import { ImageLoadError, imageSrc, preloadRound } from './images';

describe('image loading', () => {
  it('uses opaque, uniform file names', () => {
    expect(imageSrc({ id: '0123456789abcdef' }, 800)).toMatch(/images\/0123456789abcdef-800\.jpg$/);
  });

  it('waits for every image before resolving', async () => {
    const order: string[] = [];
    const load = vi.fn((src: string) => new Promise<void>((r) => setTimeout(() => (order.push(src), r()), src.includes('aaa') ? 20 : 5)));
    await preloadRound([{ id: 'aaa0000000000000' }, { id: 'bbb0000000000000' }, { id: 'ccc0000000000000' }], load);
    expect(load).toHaveBeenCalledTimes(3);
    expect(order).toHaveLength(3);
  });

  it('rejects when an image is missing', async () => {
    const load = (src: string) => (src.includes('bad') ? Promise.reject(new ImageLoadError(src)) : Promise.resolve());
    await expect(preloadRound([{ id: 'good000000000000' }, { id: 'bad0000000000000' }], load)).rejects.toBeInstanceOf(ImageLoadError);
  });
});
