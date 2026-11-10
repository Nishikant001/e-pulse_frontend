import { useId } from "react";
import { X } from "lucide-react";
import { cn } from "../../utils/cn";
import DialogShell from "./DialogShell";
import IconButton from "./IconButton";

const SIZES = { sm: "sm:max-w-md", md: "sm:max-w-lg", lg: "sm:max-w-2xl", xl: "sm:max-w-4xl" };

/**
 * Modal — centred dialog (bottom sheet on phones). Use for create / edit / view details / short forms.
 *   <Modal open={open} onClose={close} title="Batch details" footer={<Button>Save</Button>}>…</Modal>
 */
export default function Modal({ open, onClose, title, description, size = "md", footer, closeOnOverlay = true, hideClose = false, children, bodyClassName }) {
  const titleId = useId();
  const descId = useId();
  return (
    <DialogShell
      open={open}
      onClose={onClose}
      align="center"
      labelledBy={titleId}
      describedBy={description ? descId : undefined}
      closeOnOverlay={closeOnOverlay}
      panelClassName={cn("w-full rounded-t-overlay sm:rounded-overlay max-h-[92vh]", SIZES[size])}
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
        {hideClose ? null : <IconButton icon={X} label="Close dialog" size="sm" onClick={onClose} />}
      </div>
      <div className={cn("dms-scroll min-h-0 flex-1 overflow-y-auto px-5 py-4", bodyClassName)}>{children}</div>
      {footer ? <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-surface-muted px-5 py-3 sm:rounded-b-overlay">{footer}</div> : null}
    </DialogShell>
  );
}
