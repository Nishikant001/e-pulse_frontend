import { cn } from "../../utils/cn";

/** SectionHeader — heading for a block of content inside a page. */
export default function SectionHeader({ title, description, actions, className, as: Heading = "h2" }) {
  return (
    <div className={cn("mb-4 flex flex-wrap items-end justify-between gap-3", className)}>
      <div className="min-w-0">
        <Heading className="text-section font-semibold text-ink">{title}</Heading>
        {description ? <p className="mt-0.5 text-body text-ink-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
