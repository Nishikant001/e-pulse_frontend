import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import "../public.css";
import BrandMark from "./BrandMark";
import Icon from "./Icon";
import Seo from "./Seo";
import { btnPrimary } from "./ui";
import { NOT_FOUND_ROUTE, SITE, routeFor } from "../siteConfig.js";
import { NAV_LINKS } from "../content.js";
import "../public-theme.css";

const label = (p) => routeFor(p)?.nav || p;
const navCls = ({ isActive }) => `pub-navlink ${isActive ? "is-active" : ""}`;

function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) { const el = document.getElementById(decodeURIComponent(hash.slice(1))); if (el) { el.scrollIntoView(); return; } }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

export default function PublicLayout({ notFound = false }) {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const btnRef = useRef(null);
  const route = notFound ? NOT_FOUND_ROUTE : routeFor(pathname) || NOT_FOUND_ROUTE;

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    let raf = 0;
    const read = () => { raf = 0; setScrolled(window.scrollY > 24); };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(read); };
    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, []);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === "Escape") { setOpen(false); btnRef.current?.focus(); } };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [open]);

  return (
    <div className="pub-root">
      <Seo route={route} />
      <ScrollManager />
      <a href="#main" className="pub-skip">Skip to main content</a>
      <header className="pub-header" data-scrolled={scrolled} data-open={open}>
        <div className="pub-header-inner">
          <BrandMark invert />
          <nav aria-label="Primary" className="pub-nav">
            {NAV_LINKS.map((p) => <NavLink key={p} to={p} className={navCls}>{label(p)}</NavLink>)}
          </nav>
          <div className="pub-header-cta">
            <Link to="/login" className="pub-signin">Sign in</Link>
            <Link to="/contact" className={`${btnPrimary} pub-btn-sm`}>Request a demo</Link>
          </div>
          <button ref={btnRef} type="button" className="pub-burger" aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen((v) => !v)}>
            <span /><span /><span />
          </button>
        </div>
        <div id="mobile-menu" className="pub-mmenu" data-open={open} inert={!open}>
          <nav aria-label="Mobile" className="pub-mmenu-nav">
            {NAV_LINKS.map((p, i) => <NavLink key={p} to={p} style={{ "--i": i }} className={({ isActive }) => `pub-mlink ${isActive ? "is-active" : ""}`}>{label(p)}<Icon name="ArrowRight" className="size-5" /></NavLink>)}
            <div className="pub-mmenu-cta" style={{ "--i": NAV_LINKS.length }}>
              <Link to="/login" className="pub-btn pub-btn-ghost">Sign in</Link>
              <Link to="/contact" className={btnPrimary}>Request a demo</Link>
            </div>
          </nav>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="pub-main"><Outlet /></main>

      <footer className="pub-footer">
        <div className="pub-footer-glow" aria-hidden="true" />
        <div className="pub-container pub-footer-grid">
          <div className="pub-footer-brand">
            <BrandMark invert dark />
            <p>{SITE.tagline}.</p>
            {SITE.legalName ? <p className="pub-footer-sub">{SITE.legalName}</p> : null}
            {SITE.address ? <address className="pub-footer-sub">{SITE.address}</address> : null}
            <Link to="/contact" className={`${btnPrimary} pub-btn-sm`}>Request a demo<Icon name="ArrowRight" className="pub-btn-arrow size-4" /></Link>
          </div>
          <nav aria-label="Footer — product">
            <h2>Product</h2>
            <ul>{["/features", "/modules", "/solutions", "/faq"].map((p) => <li key={p}><Link to={p}>{label(p)}</Link></li>)}</ul>
          </nav>
          <nav aria-label="Footer — company">
            <h2>Company &amp; access</h2>
            <ul>
              <li><Link to="/about">About</Link></li>
              <li><Link to="/contact">Contact</Link></li>
              <li><Link to="/login">Distributor sign in</Link></li>
              <li><Link to="/admin/login">Admin sign in</Link></li>
              <li><Link to="/privacy">Privacy Policy</Link></li>
              <li><Link to="/terms">Terms of Use</Link></li>
            </ul>
          </nav>
        </div>
        <div className="pub-footer-word" aria-hidden="true">e-Pulse</div>
        <div className="pub-container pub-footer-base">
          <p>© <span suppressHydrationWarning>{new Date().getFullYear()}</span> {SITE.legalName || SITE.name}. All rights reserved.</p>
          <button type="button" className="pub-totop" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}><Icon name="ArrowUp" className="size-4" />Back to top</button>
        </div>
      </footer>
    </div>
  );
}
