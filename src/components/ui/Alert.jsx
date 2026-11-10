import { X } from "lucide-react";
import { cn } from "../../utils/cn";
import { TONE_ICONS, TONE_STYLES } from "./statusConfig";

/** Alert — inline message. tone: info | success | warning | error. Errors/warnings use role="alert". */
export default function Alert({ tone = "info", title, children, onClose, action, className }) {
  const t = TONE_STYLES[tone] || TONE_STYLES.info;
  const Icon = TONE_ICONS[tone] || TONE_ICONS.info;
  return (
    <div role={tone === "error" || tone === "warning" ? "alert" : "status"} className={cn("flex items-start gap-3 rounded-card border p-4", t.surface, t.border, className)}>
      <Icon className={cn("mt-0.5 size-5 shrink-0", t.text)} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        {title ? <p className={cn("text-body font-semibold", t.text)}>{title}</p> : null}
        {children ? <div className={cn("text-body text-ink-muted", title && "mt-0.5")}>{children}</div> : null}
        {action ? <div className="mt-3">{action}</div> : null}
      </div>
      {onClose ? (
        <button type="button" aria-label="Dismiss" onClick={onClose} className="-m-1 rounded p-1 text-ink-subtle hover:bg-black/5 hover:text-ink">
          <X className="size-4" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
