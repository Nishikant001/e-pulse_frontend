import { forwardRef, useId } from "react";
import { CalendarDays } from "lucide-react";
import { cn } from "../../utils/cn";
import Field from "./Field";
import { controlBase, controlBorder, describedBy } from "./fieldUtils";

/**
 * DatePicker — native date input (accessible, works with the on-screen keyboard on mobile).
 * Controlled: value / onChange use ISO strings (YYYY-MM-DD); onChange receives the string.
 * Uncontrolled: omit `value` and use defaultValue.
 */
const DatePicker = forwardRef(function DatePicker({ label, hint, error, required, value, onChange, min, max, id: idProp, className, wrapperClassName, labelClassName, ...rest }, ref) {
  const autoId = useId();
  const id = idProp || autoId;
  return (
    <Field id={id} label={label} hint={hint} error={error} required={required} className={wrapperClassName} labelClassName={labelClassName}>
      <div className="relative">
        <input
          ref={ref}
          id={id}
          type="date"
          {...(value !== undefined ? { value: value || "" } : {})}
          min={min}
          max={max}
          required={required}
          onChange={(e) => onChange?.(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, { error, hint })}
          className={cn(controlBase, controlBorder(error), "h-9 px-3 pr-9 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer", className)}
          {...rest}
        />
        <CalendarDays className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-subtle" aria-hidden="true" />
      </div>
    </Field>
  );
});

export default DatePicker;
