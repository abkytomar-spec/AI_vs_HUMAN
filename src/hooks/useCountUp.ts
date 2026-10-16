import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';

/** Animates a number towards `value`. Jumps immediately when reduced motion is on. */
export function useCountUp(value: number, durationMs = 450): number {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(value);
  const from = useRef(value);

  useEffect(() => {
    if (reduce || typeof requestAnimationFrame === 'undefined') {
      from.current = value;
      setDisplay(value);
      return;
    }
    const start = performance.now();
    const origin = from.current;
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(origin + (value - origin) * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
      else from.current = value;
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      from.current = value;
    };
  }, [value, durationMs, reduce]);

  return display;
}
