import { forwardRef, useId } from "react";
import { cn } from "../../utils/cn";
import Field from "./Field";
import { controlBase, controlBorder, describedBy } from "./fieldUtils";

/**
 * Input — text-like input with label, hint, error, optional leading icon and trailing slot.
 * Always pass a `label` (or aria-label) so the control has an accessible name.
 */
const Input = forwardRef(function Input(
  { label, hint, error, required, leftIcon: LeftIcon, rightSlot, id: idProp, className, wrapperClassName, labelClassName, type = "text", ...rest },
  ref,
) {
  const autoId = useId();
  const id = idProp || autoId;
  return (
    <Field id={id} label={label} hint={hint} error={error} required={required} className={wrapperClassName} labelClassName={labelClassName}>
      <div className="relative">
        {LeftIcon ? <LeftIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-subtle" aria-hidden="true" /> : null}
        <input
          ref={ref}
          id={id}
          type={type}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, { error, hint })}
          className={cn(controlBase, controlBorder(error), "h-9 px-3", LeftIcon && "pl-9", rightSlot && "pr-10", className)}
          {...rest}
        />
        {rightSlot ? <div className="absolute right-2 top-1/2 -translate-y-1/2">{rightSlot}</div> : null}
      </div>
    </Field>
  );
});

export default Input;

export const Textarea = forwardRef(function Textarea({ label, hint, error, required, id: idProp, className, wrapperClassName, labelClassName, rows = 3, ...rest }, ref) {
  const autoId = useId();
  const id = idProp || autoId;
  return (
    <Field id={id} label={label} hint={hint} error={error} required={required} className={wrapperClassName} labelClassName={labelClassName}>
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, { error, hint })}
        className={cn(controlBase, controlBorder(error), "px-3 py-2", className)}
        {...rest}
      />
    </Field>
  );
});
