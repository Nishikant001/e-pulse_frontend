import { cn } from "../../utils/cn";
import Breadcrumb from "./Breadcrumb";

/** PageHeader — page title block: optional breadcrumbs, title, description and right-aligned actions. */
export default function PageHeader({ title, description, breadcrumbs, actions, meta, className }) {
  return (
    <header className={cn("mb-6", className)}>
      {breadcrumbs ? <Breadcrumb items={breadcrumbs} className="mb-2" /> : null}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-page font-semibold tracking-tight text-ink">{title}</h1>
          {description ? <p className="mt-1 max-w-2xl text-body text-ink-muted">{description}</p> : null}
          {meta ? <div className="mt-2 flex flex-wrap items-center gap-2">{meta}</div> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
