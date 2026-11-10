import { forwardRef } from "react";
import { cn } from "../../utils/cn";
import Tooltip from "./Tooltip";

const VARIANTS = {
  ghost: "text-ink-muted hover:bg-neutral-100 hover:text-ink active:bg-neutral-200",
  subtle: "bg-brand-50 text-brand-700 hover:bg-brand-100",
  outline: "border border-line-strong bg-surface text-ink-muted hover:bg-neutral-50 hover:text-ink",
  danger: "text-error-700 hover:bg-error-50",
};
const SIZES = { sm: "size-8", md: "size-9", lg: "size-10" };
const ICON_SIZES = { sm: "size-4", md: "size-[1.125rem]", lg: "size-5" };

/**
 * IconButton — icon-only action. `label` is REQUIRED: it becomes the accessible
 * name (aria-label) and the tooltip text.
 */
const IconButton = forwardRef(function IconButton(
  { icon: Icon, label, variant = "ghost", size = "md", tooltip = true, tooltipPlacement = "bottom", className, badge, type = "button", ...rest },
  ref,
) {
  const button = (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      className={cn(
        "relative inline-flex items-center justify-center rounded-control transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    >
      <Icon className={ICON_SIZES[size]} aria-hidden="true" />
      {badge ? (
        <span className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-error-600 px-1 text-[10px] font-semibold leading-4 text-white ring-2 ring-surface">
          {badge}
        </span>
      ) : null}
    </button>
  );
  return tooltip ? (
    <Tooltip content={label} placement={tooltipPlacement}>
      {button}
    </Tooltip>
  ) : (
    button
  );
});

export default IconButton;
