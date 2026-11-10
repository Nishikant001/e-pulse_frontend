import { forwardRef, useId } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../utils/cn";
import Field from "./Field";
import { controlBase, controlBorder, describedBy } from "./fieldUtils";

/**
 * Select — styled native <select> (best keyboard, screen-reader and mobile behaviour).
 * Pass `options=[{value,label,disabled?}]` or <option> children.
 */
const Select = forwardRef(function Select(
  { label, hint, error, required, options, placeholder, id: idProp, className, wrapperClassName, labelClassName, size = "md", children, ...rest },
  ref,
) {
  const autoId = useId();
  const id = idProp || autoId;
  return (
    <Field id={id} label={label} hint={hint} error={error} required={required} className={wrapperClassName} labelClassName={labelClassName}>
      <div className="relative">
        <select
          ref={ref}
          id={id}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, { error, hint })}
          className={cn(controlBase, controlBorder(error), "appearance-none pl-3 pr-9", size === "sm" ? "h-8 text-caption" : "h-9", className)}
          {...rest}
        >
          {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
          {options
            ? options.map((o) => (
                <option key={String(o.value)} value={o.value} disabled={o.disabled}>
                  {o.label}
                </option>
              ))
            : children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-subtle" aria-hidden="true" />
      </div>
    </Field>
  );
});

export default Select;
