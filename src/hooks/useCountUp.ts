import { useEffect, useState } from 'react';

/**
 * Anime un nombre de 0 → `to` dès que `start` devient true.
 * Utilise easeOutQuart pour un effet premium.
 */
export function useCountUp(
  to: number,
  opts: { duration?: number; start?: boolean } = {},
): number {
  const { duration = 1400, start = true } = opts;
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!start || to === 0) {
      setN(to);
      return;
    }
    let raf = 0;
    const t0 = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - t0) / duration);
      // easeOutQuart
      const eased = 1 - Math.pow(1 - progress, 4);
      setN(Math.round(to * eased));
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, duration, start]);

  return n;
}
