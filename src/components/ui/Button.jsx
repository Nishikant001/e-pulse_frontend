import { forwardRef } from "react";
import { LoaderCircle } from "lucide-react";
import { cn } from "../../utils/cn";

const VARIANTS = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 disabled:bg-brand-300",
  secondary: "bg-surface text-ink border border-line-strong hover:bg-neutral-50 active:bg-neutral-100 disabled:text-ink-subtle",
  subtle: "bg-brand-50 text-brand-700 hover:bg-brand-100 active:bg-brand-200 disabled:text-brand-300",
  ghost: "text-ink-muted hover:bg-neutral-100 hover:text-ink active:bg-neutral-200 disabled:text-ink-subtle",
  danger: "bg-error-600 text-white hover:bg-error-700 active:bg-error-700 disabled:bg-error-200",
  "danger-outline": "bg-surface text-error-700 border border-error-200 hover:bg-error-50 active:bg-error-100 disabled:text-error-200",
};

const SIZES = {
  sm: "h-8 px-3 text-caption gap-1.5",
  md: "h-9 px-4 text-body gap-2",
  lg: "h-11 px-5 text-body gap-2",
};

/**
 * Button — the only way to render a clickable action.
 * Variants: primary | secondary | subtle | ghost | danger | danger-outline.
 * `loading` disables the button, shows a spinner and sets aria-busy.
 */
const Button = forwardRef(function Button(
  { variant = "primary", size = "md", loading = false, leftIcon: LeftIcon, rightIcon: RightIcon, fullWidth = false, disabled = false, type = "button", as: Component = "button", className, children, ...rest },
  ref,
) {
  const isButton = Component === "button";
  return (
    <Component
      ref={ref}
      {...(isButton ? { type, disabled: disabled || loading } : { "aria-disabled": disabled || loading || undefined })}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-control font-medium transition-colors duration-150 select-none",
        "disabled:cursor-not-allowed",
        VARIANTS[variant],
        SIZES[size],
        fullWidth && "w-full",
        className,
      )}
      {...rest}
    >
      {loading ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : LeftIcon ? <LeftIcon className="size-4 shrink-0" aria-hidden="true" /> : null}
      {children}
      {!loading && RightIcon ? <RightIcon className="size-4 shrink-0" aria-hidden="true" /> : null}
    </Component>
  );
});

export default Button;
