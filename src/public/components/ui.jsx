import { Link } from "react-router-dom";
import Icon from "./Icon";
import { STATUS } from "../content";

export const btnPrimary = "pub-btn pub-btn-primary";
export const btnSecondary = "pub-btn pub-btn-secondary";
export const btnOnDark = "pub-btn pub-btn-ghost";

/** tone: "light" (button sits on a light surface) | "dark" (on a dark surface). */
export function ButtonLink({ to, variant = "primary", tone = "light", children, arrow }) {
  const cls = variant === "primary" ? btnPrimary : tone === "dark" ? btnOnDark : btnSecondary;
  return <Link to={to} className={cls}>{children}{arrow ? <Icon name="ArrowRight" className="pub-btn-arrow size-4" /> : null}</Link>;
}

export function Container({ className = "", children }) { return <div className={`pub-container ${className}`}>{children}</div>; }

/** Shared aurora + dot-grid + grain backdrop for dark hero surfaces. Decorative only. */
export function Backdrop({ variant = "full" }) {
  return (
    <>
      <div className={`pub-aurora ${variant === "calm" ? "pub-aurora-calm" : ""}`} aria-hidden="true"><i /><i /><i /></div>
      <div className="pub-dots" aria-hidden="true" />
      <div className="pub-grain" aria-hidden="true" />
    </>
  );
}

/** Banner for every inner page: same dark aurora surface as the home hero, left-aligned display title. */
export function PageHero({ title, intro, id = "page-title", children }) {
  return (
    <section className="pub-hero pub-hero-page" aria-labelledby={id}>
      <Backdrop variant="calm" />
      <Container className="pub-page-hero-inner">
        <h1 id={id} className="pub-display pub-page-title">{title}</h1>
        {intro ? <p className="pub-lead pub-page-intro">{intro}</p> : null}
        {children}
      </Container>
    </section>
  );
}

export function SectionHeading({ eyebrow, title, intro, id, center = false, level = 2, tone = "light" }) {
  const H = `h${level}`;
  return (
    <div className={`pub-sh ${center ? "pub-sh-center" : ""} ${tone === "dark" ? "pub-sh-dark" : ""}`}>
      {eyebrow ? <p className="pub-eyebrow">{eyebrow}</p> : null}
      <H id={id} className="pub-h2">{title}</H>
      {intro ? <p className="pub-sh-intro">{intro}</p> : null}
    </div>
  );
}

/** Status badge: icon + text, so meaning never depends on colour. */
export function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.available;
  const tone = status === "planned" ? "border-neutral-200 bg-neutral-100 text-neutral-700" : status === "available-erp" ? "border-warning-200 bg-warning-50 text-warning-700" : "border-success-200 bg-success-50 text-success-700";
  const icon = status === "planned" ? "Clock" : status === "available-erp" ? "AlertTriangle" : "CircleCheck";
  return <span title={s.hint} className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${tone}`}><Icon name={icon} className="size-3.5" />{s.label}</span>;
}

export function IconTile({ name }) {
  return <span className="pub-icontile"><Icon name={name} className="size-5" /></span>;
}

export const cardCls = "pub-card";
