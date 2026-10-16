import type { PublicImage } from '../types/dataset';

const BASE = import.meta.env.BASE_URL;

export function imageSrc(image: Pick<PublicImage, 'id'>, width: 480 | 800 = 800): string {
  return `${BASE}images/${image.id}-${width}.jpg`;
}

/**
 * One size per device, used both for preloading and for display, so the browser
 * never fetches a second variant after the round is revealed.
 */
export function preferredWidth(): 480 | 800 {
  if (typeof window === 'undefined') return 800;
  return window.innerWidth < 640 && (window.devicePixelRatio ?? 1) < 2 ? 480 : 800;
}

export class ImageLoadError extends Error {
  constructor(public readonly src: string) {
    super(`Image failed to load: ${src}`);
    this.name = 'ImageLoadError';
  }
}

/** Resolves once the image is downloaded and decoded; rejects if it cannot load. */
export function loadImage(src: string, timeoutMs = 20000): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const timer = window.setTimeout(() => reject(new ImageLoadError(src)), timeoutMs);
    img.onload = () => {
      window.clearTimeout(timer);
      const decoded = typeof img.decode === 'function' ? img.decode().catch(() => undefined) : Promise.resolve();
      void decoded.then(() => resolve());
    };
    img.onerror = () => {
      window.clearTimeout(timer);
      reject(new ImageLoadError(src));
    };
    img.src = src;
  });
}

/**
 * Loads all images of a round before any is shown, so the order in which files
 * arrive can never hint at which image is which.
 */
export async function preloadRound(images: readonly Pick<PublicImage, 'id'>[], load: (src: string) => Promise<void> = loadImage): Promise<void> {
  const width = preferredWidth();
  await Promise.all(images.map((img) => load(imageSrc(img, width))));
}
