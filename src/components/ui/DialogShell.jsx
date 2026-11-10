import { useRef } from "react";
import { createPortal } from "react-dom";
import { useEscapeKey, useFocusTrap, useLockBodyScroll } from "../../hooks/useDialogBehavior";
import { cn } from "../../utils/cn";

const ALIGN = {
  center: "items-end justify-center sm:items-center p-0 sm:p-4",
  right: "items-stretch justify-end",
  left: "items-stretch justify-start",
};
const MOTION = { center: "dms-pop-in", right: "dms-slide-right", left: "dms-slide-left" };

/**
 * DialogShell — shared behaviour for Modal, Drawer and the mobile navigation drawer:
 * portal, backdrop, focus trap + restore, Escape to close, body-scroll lock, aria-modal.
 * Not used directly by pages — use Modal / Drawer / ConfirmationModal.
 */
export default function DialogShell({ open, onClose, align = "center", labelledBy, describedBy, ariaLabel, closeOnOverlay = true, panelClassName, children }) {
  const panelRef = useRef(null);
  useFocusTrap(panelRef, open);
  useLockBodyScroll(open);
  useEscapeKey(() => onClose?.(), open);

  if (!open) return null;

  return createPortal(
    <div className={cn("fixed inset-0 z-[60] flex", ALIGN[align])}>
      <div aria-hidden="true" className="dms-fade-in absolute inset-0 bg-slate-900/40" onMouseDown={closeOnOverlay ? () => onClose?.() : undefined} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        aria-label={labelledBy ? undefined : ariaLabel}
        tabIndex={-1}
        className={cn("relative flex max-h-full flex-col bg-surface shadow-overlay focus:outline-none", MOTION[align], panelClassName)}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
