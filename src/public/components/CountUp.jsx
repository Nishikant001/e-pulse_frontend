import { useLayoutEffect, useRef } from "react";
import { reducedMotion } from "./motion.js";

const fmt = (n, decimals, prefix, suffix) => `${prefix}${n.toFixed(decimals)}${suffix}`;

/** ILLUSTRATIVE number count-up. Server render / no JS / reduced motion show the final value; the client animates from 0 with requestAnimationFrame. */
export default function CountUp({ to, decimals = 0, prefix = "", suffix = "", duration = 1700, delay = 0 }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion()) return undefined;
    el.textContent = fmt(0, decimals, prefix, suffix);
    let raf = 0; let t0 = 0;
    const tick = (now) => {
      if (!t0) t0 = now;
      const p = Math.min(1, (now - t0) / duration);
      el.textContent = fmt(to * (1 - Math.pow(1 - p, 3)), decimals, prefix, suffix);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    const start = setTimeout(() => { raf = requestAnimationFrame(tick); }, delay);
    return () => { clearTimeout(start); cancelAnimationFrame(raf); el.textContent = fmt(to, decimals, prefix, suffix); };
  }, [to, decimals, prefix, suffix, duration, delay]);
  return <span ref={ref} suppressHydrationWarning>{fmt(to, decimals, prefix, suffix)}</span>;
}
