import { cn } from "../../utils/cn";

const PADDING = { none: "", sm: "p-3", md: "p-5", lg: "p-6" };

/** Card — white surface, soft border, restrained shadow. Compose with CardHeader / CardBody / CardFooter. */
export default function Card({ as: Component = "div", padding = "none", hoverable = false, className, children, ...rest }) {
  return (
    <Component
      className={cn("rounded-card border border-line bg-surface shadow-card", PADDING[padding], hoverable && "transition-shadow duration-200 hover:shadow-hover", className)}
      {...rest}
    >
      {children}
    </Component>
  );
}

export function CardHeader({ title, subtitle, actions, icon: Icon, bordered = true, className, titleAs: Title = "h3" }) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-3 px-5 py-4", bordered && "border-b border-line", className)}>
      <div className="flex min-w-0 items-start gap-3">
        {Icon ? (
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-control bg-brand-50 text-brand-700">
            <Icon className="size-4" aria-hidden="true" />
          </span>
        ) : null}
        <div className="min-w-0">
          <Title className="truncate text-card-title font-semibold text-ink">{title}</Title>
          {subtitle ? <p className="mt-0.5 text-caption text-ink-subtle">{subtitle}</p> : null}
        </div>
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function CardBody({ className, children }) {
  return <div className={cn("px-5 py-4", className)}>{children}</div>;
}

export function CardFooter({ className, children }) {
  return <div className={cn("flex items-center justify-between gap-3 border-t border-line px-5 py-3", className)}>{children}</div>;
}
