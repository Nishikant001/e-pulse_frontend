import { useId } from "react";
import { X } from "lucide-react";
import { cn } from "../../utils/cn";
import DialogShell from "./DialogShell";
import IconButton from "./IconButton";

const SIZES = { sm: "sm:w-96", md: "sm:w-[32rem]", lg: "sm:w-[44rem]" };

/**
 * Drawer — side panel for details that keep the page context (claim details, batch details, SAP retry…).
 * side: "right" (default) | "left". Full-width on phones.
 */
export default function Drawer({ open, onClose, title, description, side = "right", size = "md", footer, closeOnOverlay = true, children, bodyClassName }) {
  const titleId = useId();
  const descId = useId();
  return (
    <DialogShell
      open={open}
      onClose={onClose}
      align={side}
      labelledBy={titleId}
      describedBy={description ? descId : undefined}
      closeOnOverlay={closeOnOverlay}
      panelClassName={cn("h-full w-full", SIZES[size], side === "right" ? "border-l border-line" : "border-r border-line")}
    >
      <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
        <div className="min-w-0">
          <h2 id={titleId} className="text-section font-semibold text-ink">
            {title}
          </h2>
          {description ? (
            <p id={descId} className="mt-0.5 text-body text-ink-muted">
              {description}
            </p>
          ) : null}
        </div>
        <IconButton icon={X} label="Close panel" size="sm" onClick={onClose} />
      </div>
      <div className={cn("dms-scroll min-h-0 flex-1 overflow-y-auto px-5 py-4", bodyClassName)}>{children}</div>
      {footer ? <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-surface-muted px-5 py-3">{footer}</div> : null}
    </DialogShell>
  );
}
