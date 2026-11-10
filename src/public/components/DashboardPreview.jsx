import { useEffect, useRef } from "react";
import Icon from "./Icon";
import CountUp from "./CountUp";
import { reducedMotion } from "./motion.js";

// ILLUSTRATION ONLY. Drawn with HTML/CSS/SVG. Every figure, batch code and product name below is sample data made up for the picture —
// they are not company metrics, customers or real stock. The figure is captioned accordingly.
const NAV = ["Dashboard", "Sales orders", "Inventory", "FEFO monitor", "Purchasing", "Accounts"];
const SALES = [78, 70, 74, 58, 62, 48, 54, 40, 45, 31, 36, 20];
const W = 320; const H = 112;
const pts = SALES.map((y, i) => [(i / (SALES.length - 1)) * W, y]);
const curve = pts.reduce((d, [x, y], i, a) => {
  if (!i) return `M${x.toFixed(1)},${y}`;
  const [px, py] = a[i - 1]; const cx = ((px + x) / 2).toFixed(1);
  return `${d} C${cx},${py} ${cx},${y} ${x.toFixed(1)},${y}`;
}, "");
const AREA = `${curve} L${W},${H} L0,${H} Z`;
const LAST = pts[pts.length - 1];

const BATCHES = [
  { code: "B-24117", name: "Paracetamol 500 mg", left: "21 d", pct: 12, band: "hot", order: "1st out" },
  { code: "B-24093", name: "Amoxicillin 250 mg", left: "58 d", pct: 30, band: "warm", order: "2nd" },
  { code: "B-24201", name: "Cetirizine 10 mg", left: "146 d", pct: 62, band: "ok", order: "3rd" },
  { code: "B-24266", name: "Metformin 500 mg", left: "9 mo", pct: 88, band: "ok", order: "4th" },
];
const TOASTS = [
  { icon: "Check", t: "FEFO picked batch B-24117", s: "Earliest expiry first, 120 strips to SO-1042" },
  { icon: "CalendarClock", t: "3 batches near expiry", s: "Open the FEFO monitor to review" },
  { icon: "ReceiptText", t: "Invoice INV-2081 posted", s: "Stock and ledger updated together" },
];

export default function DashboardPreview() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion() || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return undefined;
    const host = el.closest("[data-hero]") || el;
    let raf = 0; let nx = 0; let ny = 0;
    const apply = () => { raf = 0; el.style.setProperty("--px", nx.toFixed(3)); el.style.setProperty("--py", ny.toFixed(3)); };
    const move = (e) => {
      const r = host.getBoundingClientRect();
      nx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - 0.5) * 2));
      ny = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height - 0.5) * 2));
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const leave = () => { nx = 0; ny = 0; if (!raf) raf = requestAnimationFrame(apply); };
    host.addEventListener("pointermove", move, { passive: true });
    host.addEventListener("pointerleave", leave);
    return () => { host.removeEventListener("pointermove", move); host.removeEventListener("pointerleave", leave); cancelAnimationFrame(raf); };
  }, []);

  return (
    <figure ref={ref} className="pub-show" aria-label="Illustration of the e-Pulse dashboard, drawn with sample data">
      <div className="pub-show-stage" aria-hidden="true">
        <div className="pub-win-tilt">
          <div className="pub-win">
            <div className="pub-win-bar"><i /><i /><i /><span>Dashboard</span><b>Illustration — sample data</b></div>
            <div className="pub-win-body">
              <aside className="pub-win-side">
                <div className="pub-win-brand"><span /> e-Pulse</div>
                {NAV.map((n, i) => <div key={n} className={`pub-win-nav ${i === 0 ? "is-on" : ""}`} style={{ "--i": i }}>{n}</div>)}
              </aside>
              <div className="pub-win-main">
                <div className="pub-kpis">
                  <div className="pub-kpi" style={{ "--i": 0 }}><small>Stock value</small><strong><CountUp to={4.82} decimals={2} prefix="₹" suffix=" Cr" delay={500} /></strong></div>
                  <div className="pub-kpi" style={{ "--i": 1 }}><small>Near expiry</small><strong><CountUp to={12} suffix=" batches" delay={650} /></strong></div>
                  <div className="pub-kpi" style={{ "--i": 2 }}><small>Open orders</small><strong><CountUp to={38} delay={800} /></strong></div>
                </div>
                <div className="pub-panel pub-chart">
                  <div className="pub-panel-h"><span>Sales, last 12 weeks</span><em>sample</em></div>
                  <div className="pub-chart-plot">
                  <svg viewBox={`0 0 ${W} ${H + 6}`} preserveAspectRatio="none" focusable="false">
                    <defs>
                      <linearGradient id="pub-ln" x1="0" x2="1"><stop offset="0" stopColor="#0c83eb" /><stop offset="1" stopColor="#0fb5a0" /></linearGradient>
                      <linearGradient id="pub-ar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0c83eb" stopOpacity=".28" /><stop offset="1" stopColor="#0c83eb" stopOpacity="0" /></linearGradient>
                    </defs>
                    {[28, 56, 84].map((y) => <line key={y} x1="0" x2={W} y1={y} y2={y} className="pub-grid" />)}
                    <path d={AREA} fill="url(#pub-ar)" className="pub-area" />
                    <path d={curve} pathLength="1" fill="none" stroke="url(#pub-ln)" strokeWidth="2.6" strokeLinecap="round" vectorEffect="non-scaling-stroke" className="pub-line" />
                  </svg>
                  <span className="pub-dot" style={{ left: `${(LAST[0] / W) * 100}%`, top: `${(LAST[1] / (H + 6)) * 100}%` }} />
                  </div>
                </div>
                <div className="pub-panel pub-batches">
                  <div className="pub-panel-h"><span>Batch expiry, earliest first</span><em>sample</em></div>
                  {BATCHES.map((b, i) => (
                    <div key={b.code} className="pub-batch" style={{ "--i": i }}>
                      <code>{b.code}</code><span className="pub-batch-n">{b.name}</span>
                      <span className="pub-bar"><span className={`pub-fill pub-${b.band}`} style={{ width: `${b.pct}%` }} /></span>
                      <span className="pub-batch-l">{b.left}<small>{b.order}</small></span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="pub-par pub-float-a" style={{ "--d": 26 }}>
            <div className="pub-toasts">
              {TOASTS.map((t, i) => (
                <div key={t.t} className="pub-toast" style={{ "--k": i }}>
                  <span className="pub-toast-i"><Icon name={t.icon} className="size-4" /></span>
                  <span><strong>{t.t}</strong><small>{t.s}</small></span>
                </div>
              ))}
            </div>
          </div>
          <div className="pub-par pub-float-b" style={{ "--d": -20 }}>
            <div className="pub-glass pub-ring-card">
              <svg viewBox="0 0 44 44" focusable="false"><circle cx="22" cy="22" r="18" className="pub-ring-bg" /><circle cx="22" cy="22" r="18" pathLength="100" className="pub-ring" /></svg>
              <span><strong>88%</strong><small>B-24266 shelf life left (sample)</small></span>
            </div>
          </div>
        </div>
      </div>
      <figcaption className="pub-show-cap">Illustration with sample data. Not a screenshot, and not company figures.</figcaption>
    </figure>
  );
}
