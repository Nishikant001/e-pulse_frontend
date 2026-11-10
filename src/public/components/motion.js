import { useEffect, useRef, useState } from "react";

/** Effect-only helper (never call during render): does the visitor prefer reduced motion? */
export const reducedMotion = () => typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Scroll-stage state machine shared by <Reveal> and <Stage>.
 * "shown" (server render, no JS, first paint, reduced motion, already on screen) -> "armed" (below the fold, hidden after mount) -> "in" (revealed).
 * A timeout reveals everything regardless, so animation can never keep content hidden.
 */
export function useStage({ margin = "0px 0px -8% 0px", threshold = 0.05, safety = 4500 } = {}) {
  const ref = useRef(null);
  const [state, setState] = useState("shown");
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined" || reducedMotion()) return undefined;
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight * 0.95) return undefined;
    setState("armed");
    const io = new IntersectionObserver((entries) => { if (entries.some((e) => e.isIntersecting || e.boundingClientRect.top < 0)) { setState("in"); io.disconnect(); } }, { rootMargin: margin, threshold });
    io.observe(el);
    const t = setTimeout(() => setState("in"), safety);
    return () => { io.disconnect(); clearTimeout(t); };
  }, [margin, threshold, safety]);
  return [ref, state];
}
