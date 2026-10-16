import { useEffect, useRef, useState } from 'react';

function motionIsOff(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Reveals an element the first time it scrolls into view, once and never again.
 *
 * Content must never be stuck invisible, so the hook starts in the revealed
 * state whenever it cannot do better: reduced motion is on, or the browser has
 * no IntersectionObserver.
 *
 * The root margin does the real work. The bottom edge is pulled in by 10% so a
 * section reveals just before it is fully on screen, and the top edge is pushed
 * far out so anything scrolled past counts as intersecting. Without that top
 * margin, jumping straight to the bottom of the page moves a section from
 * "below the viewport" to "above the viewport" without its ratio ever leaving
 * zero, the observer never fires, and the content stays invisible for good.
 *
 * A zero threshold is used rather than a ratio because a section taller than
 * the viewport can never reach a ratio threshold at all.
 */
export function useReveal<T extends HTMLElement>(delayMs = 0) {
  const ref = useRef<T>(null);
  const [shown, setShown] = useState(() => motionIsOff() || typeof IntersectionObserver === 'undefined');

  useEffect(() => {
    if (shown) return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting || e.boundingClientRect.top < 0)) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold: 0, rootMargin: '99999px 0px -10% 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [shown]);

  return {
    ref,
    'data-reveal': shown ? 'in' : 'out',
    style: delayMs ? { transitionDelay: `${delayMs}ms` } : undefined,
  } as const;
}
