import { CircleAlert } from "lucide-react";
import { cn } from "../../utils/cn";

/**
 * Field — label + control + hint/error wrapper shared by Input, Select, DatePicker.
 * The error is linked to the control through aria-describedby (ids come from the parent).
 */
export default function Field({ id, label, hint, error, required, children, className, labelClassName }) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label ? (
        <label htmlFor={id} className={cn("text-body font-medium text-ink", labelClassName)}>
          {label}
          {required ? (
            <span className="ml-0.5 text-error-600" aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <p id={`${id}-error`} className="flex items-start gap-1.5 text-caption text-error-700">
          <CircleAlert className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-caption text-ink-subtle">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
