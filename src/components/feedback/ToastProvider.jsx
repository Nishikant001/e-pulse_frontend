import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "../../utils/cn";
import { TONE_ICONS, TONE_STYLES } from "../ui/statusConfig";
import { ToastContext } from "./feedbackContext";

const MAX_VISIBLE = 4;
const DEFAULT_DURATION = { success: 4000, info: 5000, warning: 6000, error: 8000 };

function ToastItem({ toast, onDismiss }) {
  const t = TONE_STYLES[toast.tone];
  const Icon = TONE_ICONS[toast.tone];
  const timer = useRef(null);

  const start = useCallback(() => {
    if (toast.duration === 0) return;
    timer.current = setTimeout(() => onDismiss(toast.id), toast.duration);
  }, [toast.duration, toast.id, onDismiss]);
  const stop = () => clearTimeout(timer.current);

  useEffect(() => {
    start();
    return stop;
  }, [start]);

  return (
    <div
      role={toast.tone === "error" || toast.tone === "warning" ? "alert" : "status"}
      onMouseEnter={stop}
      onMouseLeave={start}
      className="dms-toast-in pointer-events-auto flex w-full items-start gap-3 rounded-card border border-line bg-surface p-4 shadow-popover"
    >
      <Icon className={cn("mt-0.5 size-5 shrink-0", t.text)} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        {toast.title ? <p className="text-body font-semibold text-ink">{toast.title}</p> : null}
        <p className={cn("text-body text-ink-muted", !toast.title && "text-ink")}>{toast.message}</p>
      </div>
      <button type="button" aria-label="Dismiss notification" onClick={() => onDismiss(toast.id)} className="-m-1 rounded p-1 text-ink-subtle hover:bg-neutral-100 hover:text-ink">
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}

/** ToastProvider — mounts the toast region (top-right; full width on phones) and exposes the toast API. */
export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  // Phase 23: the portal exists only after mount, so server-rendered public pages hydrate without a mismatch (no toast can exist before mount).
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const counter = useRef(0);

  const dismiss = useCallback((id) => setToasts((list) => list.filter((x) => x.id !== id)), []);

  const push = useCallback((tone, message, options = {}) => {
    counter.current += 1;
    const id = counter.current;
    const toast = { id, tone, message, title: options.title, duration: options.duration ?? DEFAULT_DURATION[tone] };
    setToasts((list) => [...list, toast].slice(-MAX_VISIBLE));
    return id;
  }, []);

  const api = useMemo(
    () => ({
      success: (m, o) => push("success", m, o),
      error: (m, o) => push("error", m, o),
      warning: (m, o) => push("warning", m, o),
      info: (m, o) => push("info", m, o),
      dismiss,
    }),
    [push, dismiss],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {mounted && createPortal(
        <div role="region" aria-label="Notifications" className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex flex-col items-end gap-2 p-4 sm:left-auto sm:w-[26rem]">
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}
