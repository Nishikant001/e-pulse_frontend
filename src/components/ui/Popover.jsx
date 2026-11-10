import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "../../utils/cn";

/**
 * Popover — floating panel anchored to an element. Portalled + position:fixed so
 * table/scroll containers never clip it; flips above the anchor when there is no room below.
 * Base for Dropdown, DateRangePicker, notification and user menus.
 */
export default function Popover({ open, onClose, anchorRef, placement = "bottom-start", offset = 6, matchWidth = false, className, children, role, id, ariaLabel, onKeyDown }) {
  const panelRef = useRef(null);
  const [pos, setPos] = useState(null);

  const update = useCallback(() => {
    const anchor = anchorRef.current;
    const panel = panelRef.current;
    if (!anchor || !panel) return;
    const a = anchor.getBoundingClientRect();
    const p = panel.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const wantTop = placement.startsWith("top");
    let top = wantTop ? a.top - p.height - offset : a.bottom + offset;
    if (!wantTop && top + p.height > vh - 8 && a.top - p.height - offset > 8) top = a.top - p.height - offset;
    if (wantTop && top < 8) top = a.bottom + offset;
    top = Math.max(8, Math.min(top, vh - p.height - 8));

    let left = placement.endsWith("end") ? a.right - p.width : a.left;
    left = Math.max(8, Math.min(left, vw - p.width - 8));

    setPos({ top, left, minWidth: matchWidth ? a.width : undefined });
  }, [anchorRef, placement, offset, matchWidth]);

  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return undefined;
    }
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, update]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (e) => {
      const t = e.target;
      if (panelRef.current?.contains(t) || anchorRef.current?.contains(t)) return;
      onClose?.();
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        onClose?.();
        anchorRef.current?.querySelector("button, [tabindex], input")?.focus?.();
      }
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  return createPortal(
    <div
      ref={panelRef}
      id={id}
      role={role}
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
      style={{ position: "fixed", top: pos ? pos.top : 0, left: pos ? pos.left : 0, minWidth: pos?.minWidth, visibility: pos ? "visible" : "hidden" }}
      className={cn("dms-pop-in z-[70] rounded-overlay border border-line bg-surface shadow-popover", className)}
    >
      {children}
    </div>,
    document.body,
  );
}
