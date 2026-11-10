import { CircleHelp, TriangleAlert } from "lucide-react";
import { cn } from "../../utils/cn";
import Button from "./Button";
import Modal from "./Modal";

const TONES = {
  danger: { icon: TriangleAlert, chip: "bg-error-50 text-error-600", button: "danger" },
  warning: { icon: TriangleAlert, chip: "bg-warning-50 text-warning-600", button: "primary" },
  primary: { icon: CircleHelp, chip: "bg-brand-50 text-brand-600", button: "primary" },
};

/**
 * ConfirmationModal — replacement for window.confirm(). For imperative use anywhere, see useConfirm().
 * `loading` keeps the dialog open with a busy confirm button while an async action runs.
 */
export default function ConfirmationModal({ open, onConfirm, onCancel, title = "Are you sure?", message, confirmLabel = "Confirm", cancelLabel = "Cancel", tone = "primary", loading = false }) {
  const t = TONES[tone] || TONES.primary;
  const Icon = t.icon;
  return (
    <Modal
      open={open}
      onClose={loading ? undefined : onCancel}
      title={title}
      size="sm"
      hideClose
      closeOnOverlay={!loading}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={t.button} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full", t.chip)}>
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div className="pt-1 text-body text-ink-muted">{message}</div>
      </div>
    </Modal>
  );
}
