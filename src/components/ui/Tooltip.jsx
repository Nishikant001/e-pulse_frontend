import { cloneElement, isValidElement, useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "../../utils/cn";

const OFFSET = 8;

function computePosition(rect, placement) {
  switch (placement) {
    case "bottom":
      return { top: rect.bottom + OFFSET, left: rect.left + rect.width / 2, transform: "translate(-50%, 0)" };
    case "left":
      return { top: rect.top + rect.height / 2, left: rect.left - OFFSET, transform: "translate(-100%, -50%)" };
    case "right":
      return { top: rect.top + rect.height / 2, left: rect.right + OFFSET, transform: "translate(0, -50%)" };
    default:
      return { top: rect.top - OFFSET, left: rect.left + rect.width / 2, transform: "translate(-50%, -100%)" };
  }
}

/**
 * Tooltip — shows on hover AND keyboard focus, is announced via aria-describedby,
 * dismisses with Escape, and is portalled so scroll containers never clip it.
 * Use it for icon-only actions and truncated text.
 */
export default function Tooltip({ content, placement = "top", children, disabled = false, className }) {
  const id = useId();
  const wrapperRef = useRef(null);
  const timer = useRef(null);
  const [state, setState] = useState({ open: false, style: null });

  const show = useCallback(() => {
    if (disabled || !content) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (!wrapperRef.current) return;
      const rect = wrapperRef.current.getBoundingClientRect();
      const place = placement === "top" && rect.top < 48 ? "bottom" : placement;
      setState({ open: true, style: computePosition(rect, place) });
    }, 120);
  }, [content, disabled, placement]);

  const hide = useCallback(() => {
    clearTimeout(timer.current);
    setState((s) => (s.open ? { open: false, style: null } : s));
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  useEffect(() => {
    if (!state.open) return undefined;
    const onKey = (e) => e.key === "Escape" && hide();
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", hide, true);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", hide, true);
    };
  }, [state.open, hide]);

  const child = isValidElement(children) ? cloneElement(children, { "aria-describedby": state.open ? id : undefined }) : children;

  return (
    <span ref={wrapperRef} className={cn("inline-flex", className)} onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide}>
      {child}
      {state.open &&
        createPortal(
          <div
            id={id}
            role="tooltip"
            style={{ position: "fixed", ...state.style }}
            className="dms-fade-in pointer-events-none z-[90] w-max max-w-[min(20rem,calc(100vw-1.5rem))] rounded-md bg-slate-900 px-3 py-2 text-caption font-medium leading-snug text-white shadow-popover"
          >
            {content}
          </div>,
          document.body,
        )}
    </span>
  );
}
