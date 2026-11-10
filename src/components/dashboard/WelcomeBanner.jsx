import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { cn } from "../../utils/cn";

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
};

/**
 * WelcomeBanner — gradient hero at the top of the Admin / Super Admin dashboards: greeting, one-line context, quick actions.
 * tone "admin" (blue) | "super" (violet). actions: [{ label, to, icon }].
 */
export default function WelcomeBanner({ name, subtitle, tone = "admin", actions = [], className }) {
  const first = String(name || "").trim().split(/\s+/)[0] || "there";
  const today = new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date());
  return (
    <section
      aria-label="Welcome"
      className={cn(
        "relative mb-6 overflow-hidden rounded-card p-6 text-white shadow-card sm:p-7",
        tone === "super" ? "bg-gradient-to-br from-super-950 via-super-700 to-brand-600" : "bg-gradient-to-br from-console-900 via-brand-800 to-brand-500",
        className,
      )}
    >
      <div className="pointer-events-none absolute -right-16 -top-20 size-72 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-24 right-1/4 size-64 rounded-full bg-white/5" aria-hidden="true" />
      <div className="relative flex flex-wrap items-end justify-between gap-5">
        <div className="min-w-0">
          <p className="text-caption font-medium uppercase tracking-wider text-white/70">{today}</p>
          <h1 className="mt-1 text-page font-semibold tracking-tight">{greeting()}, {first}</h1>
          {subtitle ? <p className="mt-1 max-w-xl text-body text-white/80">{subtitle}</p> : null}
        </div>
        {actions.length ? (
          <div className="flex flex-wrap gap-2">
            {actions.map(({ label, to, icon: Icon }) => (
              <Link key={to} to={to} className="group inline-flex items-center gap-2 rounded-control bg-white/12 px-3.5 py-2 text-body font-medium ring-1 ring-inset ring-white/25 backdrop-blur transition-colors hover:bg-white/22 focus-visible:outline-white">
                {Icon ? <Icon className="size-4" aria-hidden="true" /> : null}
                {label}
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
