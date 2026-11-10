import { createElement, useEffect, useState } from "react";
import { useStage } from "./motion.js";

/**
 * Reveal-on-scroll. Content is visible by default (server render, no-JS, first paint, reduced motion);
 * only blocks that start below the fold are armed (hidden) after mount and revealed when they scroll into view.
 * variant: "up" (default) | "scale" | "fade".
 */
export default function Reveal({ as: Tag = "div", delay = 0, variant = "up", className = "", children, ...rest }) {
  const [ref, state] = useStage();
  const [done, setDone] = useState(false);
  // once the entrance has played, drop the reveal classes so the element's own hover transitions are not slowed by them
  useEffect(() => { if (state !== "in") return undefined; const t = setTimeout(() => setDone(true), 1200 + delay); return () => clearTimeout(t); }, [state, delay]);
  const cls = done ? "" : state === "armed" ? `pub-reveal pub-reveal-${variant}` : state === "in" ? `pub-reveal pub-reveal-${variant} pub-reveal-in` : "";
  return createElement(Tag, { ref, className: `${className} ${cls}`.trim(), style: delay && !done ? { transitionDelay: `${delay}ms` } : undefined, ...rest }, children);
}

/** Wrapper that exposes the stage as data-io="shown|armed|in" so CSS can choreograph a whole section (connected steps, diagrams). */
export function Stage({ as: Tag = "div", className = "", margin, children, ...rest }) {
  const [ref, state] = useStage(margin ? { margin } : undefined);
  return createElement(Tag, { ref, className, "data-io": state, ...rest }, children);
}
