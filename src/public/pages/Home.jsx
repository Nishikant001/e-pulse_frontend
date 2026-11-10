import { Link } from "react-router-dom";
import { Container, SectionHeading, ButtonLink, StatusBadge, Backdrop } from "../components/ui";
import Reveal, { Stage } from "../components/Reveal";
import Icon from "../components/Icon";
import DashboardPreview from "../components/DashboardPreview";
import { FEATURES, MODULES, WORKFLOW, FAQS } from "../content.js";

const MARQUEE = MODULES.filter((m) => m.status !== "planned");
const TILE_KEYS = ["led", "exp", "flo", "gst", "por", "iso", "erp", "saf"];

/* The marquee separator is a capsule, the one shape the whole site is built around. */
const Capsule = () => <svg className="pub-cap" viewBox="0 0 40 20" aria-hidden="true" focusable="false"><rect x="1" y="1" width="38" height="18" rx="9" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M20 1h-11a9 9 0 0 0 0 18h11z" fill="currentColor" /></svg>;

function Marquee() {
  const row = (hidden) => (
    <ul className="pub-marquee-row" aria-hidden={hidden || undefined}>
      {MARQUEE.map((m) => <li key={m.id}><Icon name={m.icon} className="size-6" />{m.name}<Capsule /></li>)}
    </ul>
  );
  return (
    <section className="pub-marquee" aria-label="Modules in e-Pulse">
      <div className="pub-marquee-track">{row(false)}{row(true)}</div>
    </section>
  );
}

/* Small illustrations inside the bento tiles. They are decorative (aria-hidden); the tile text carries the meaning. */
function TileArt({ k }) {
  if (k === "led") return (
    <div className="pub-art pub-art-led" aria-hidden="true">
      {[["Goods receipt", "B-24117", "+240", "240"], ["Delivery, FEFO", "B-24117", "−120", "120"], ["Count correction", "B-24117", "−6", "114"]].map(([a, b, c, d], i) => (
        <div key={a} className="pub-led-row" style={{ "--i": i }}><span>{a}</span><code>{b}</code><b>{c}</b><i>{d}</i></div>
      ))}
    </div>
  );
  if (k === "exp") return (
    <div className="pub-art pub-art-exp" aria-hidden="true">
      {[["B-24117", "21 d", 14, "hot"], ["B-24093", "58 d", 34, "warm"], ["B-24201", "146 d", 66, "ok"]].map(([c, d, w, t], i) => (
        <div key={c} className="pub-exp-row" style={{ "--i": i }}><em>{i + 1}</em><code>{c}</code><span className="pub-bar"><span className={`pub-fill pub-${t}`} style={{ width: `${w}%` }} /></span><b>{d}</b></div>
      ))}
    </div>
  );
  if (k === "flo") return (
    <div className="pub-art pub-art-flo" aria-hidden="true">
      {["Purchase order", "Receipt", "Stock", "Sales order", "Invoice", "Payment"].map((c, i) => <span key={c} style={{ "--i": i }}>{c}</span>)}
    </div>
  );
  if (k === "gst") return (
    <div className="pub-art pub-art-gst" aria-hidden="true">
      <p>Same state</p><div><span>CGST</span><span>SGST</span></div>
      <p>Other state</p><div><span className="wide">IGST</span></div>
    </div>
  );
  if (k === "por") return (
    <div className="pub-art pub-art-por" aria-hidden="true"><span>Distributor</span><Icon name="Lock" className="size-4" /><span>Admin</span></div>
  );
  if (k === "iso") return (
    <div className="pub-art pub-art-iso" aria-hidden="true">{["A", "B", "C"].map((c, i) => <span key={c} style={{ "--i": i }}><Icon name="Lock" className="size-3.5" />Distributor {c}</span>)}</div>
  );
  if (k === "erp") return (
    <div className="pub-art pub-art-erp" aria-hidden="true">
      <span>e-Pulse</span><svg viewBox="0 0 120 12" focusable="false"><line x1="2" y1="6" x2="118" y2="6" /></svg><span>ERP</span>
      <p>Tested with simulated ERP responses. Live ERP not verified.</p>
    </div>
  );
  return (
    <div className="pub-art pub-art-saf" aria-hidden="true">{["Rate limits", "Size limits", "Correlation IDs", "Health endpoint"].map((c) => <span key={c}>{c}</span>)}</div>
  );
}

function Bento() {
  const spot = (e) => {
    const t = e.currentTarget; const r = t.getBoundingClientRect();
    t.style.setProperty("--mx", `${e.clientX - r.left}px`); t.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
  return (
    <div className="pub-bento">
      {FEATURES.map((f, i) => {
        const k = TILE_KEYS[i];
        return (
          <Reveal key={f.title} as="article" delay={(i % 4) * 70} className={`pub-tile pub-t-${k}`} onPointerMove={spot}>
            <div className="pub-tile-head"><span className="pub-icontile"><Icon name={f.icon} className="size-5" /></span></div>
            <h3>{f.title}</h3>
            <p>{f.text}</p>
            <TileArt k={k} />
            <Link to={f.to} className="pub-tile-link">Learn more<span className="sr-only"> about {f.title}</span><Icon name="ArrowRight" className="size-4" /></Link>
          </Reveal>
        );
      })}
    </div>
  );
}

function PlatformHub() {
  const nodes = [["Purchasing", 84, 58], ["Sales", 336, 58], ["Returns", 56, 218], ["Accounts", 364, 218], ["Head office", 210, 304]];
  return (
    <svg className="pub-hub" viewBox="0 0 420 350" role="img" aria-label="Diagram: purchasing, sales, returns, accounts and the head-office view all connect to one stock ledger.">
      {nodes.map(([n, x, y], i) => <line key={n} x1={x} y1={y} x2="210" y2="168" className="pub-hub-line" style={{ "--i": i }} />)}
      <circle cx="210" cy="168" r="62" className="pub-hub-halo" />
      <circle cx="210" cy="168" r="50" className="pub-hub-core" />
      <text x="210" y="165" textAnchor="middle" className="pub-hub-t1">Stock</text>
      <text x="210" y="184" textAnchor="middle" className="pub-hub-t1">ledger</text>
      {nodes.map(([n, x, y], i) => (
        <g key={n} className="pub-hub-node" style={{ "--i": i }}>
          <rect x={x - 54} y={y - 19} width="108" height="38" rx="19" />
          <text x={x} y={y + 5} textAnchor="middle">{n}</text>
        </g>
      ))}
    </svg>
  );
}

export default function Home() {
  return (
    <>
      <section className="pub-hero pub-hero-home" aria-labelledby="hero-title" data-hero>
        <Backdrop />
        <Container className="pub-hero-grid">
          <div className="pub-hero-copy">
            <p className="pub-pill pub-rise"><Icon name="Pill" className="size-4" />For pharmaceutical distributors</p>
            <h1 id="hero-title" className="pub-display pub-hero-title pub-rise pub-rise-2">
              Every batch accounted for,<span className="pub-grad"> from purchase to payment.</span>
            </h1>
            <p className="pub-lead pub-rise pub-rise-3">e-Pulse keeps stock at batch level with expiry dates, links each purchase and sales document to the ledger, and gives head office one view across distributors.</p>
            <div className="pub-hero-cta pub-rise pub-rise-4">
              <ButtonLink to="/contact" arrow>Request a demo</ButtonLink>
              <ButtonLink to="/login" variant="secondary" tone="dark">Sign in</ButtonLink>
            </div>
            <ul className="pub-checks pub-rise pub-rise-5">
              <li><Icon name="Check" className="size-4" />Batch and expiry recorded on every receipt</li>
              <li><Icon name="Check" className="size-4" />FEFO allocation when stock is delivered</li>
              <li><Icon name="Check" className="size-4" />Separate Distributor and Admin portals</li>
            </ul>
            <p className="pub-hero-signin pub-rise pub-rise-5">Already have an account? <Link to="/login">Distributor sign in</Link> or <Link to="/admin/login">Admin sign in</Link></p>
          </div>
          <DashboardPreview />
        </Container>
      </section>

      <Marquee />

      <section className="pub-section" aria-labelledby="workflow-title">
        <Container>
          <Reveal><SectionHeading id="workflow-title" title="From onboarding to the ledger, one connected flow" intro="The same sequence your team already runs, with each step feeding the next so stock and accounts stay in step." /></Reveal>
          <Stage as="ol" className="pub-flow" margin="0px 0px -18% 0px">
            <span className="pub-flow-line" aria-hidden="true"><i /></span>
            {WORKFLOW.map((w, i) => (
              <li key={w.title} className="pub-step" style={{ "--i": i }}>
                <span className="pub-step-node" aria-hidden="true"><Icon name={w.icon} className="size-6" /></span>
                <div className="pub-step-body">
                  <p className="pub-step-who">{w.who}</p>
                  <h3><span className="sr-only">Step {i + 1}: </span>{w.title}</h3>
                  <p>{w.text}</p>
                </div>
              </li>
            ))}
          </Stage>
        </Container>
      </section>

      <section className="pub-section pub-section-tint" aria-labelledby="bento-title">
        <Container>
          <Reveal><SectionHeading id="bento-title" title="Control stock, expiry and accounts in one place" intro="Every figure traces back to a recorded document or stock movement, so teams act on what is really on the shelf." /></Reveal>
          <Bento />
        </Container>
      </section>

      <section className="pub-section pub-dark" aria-labelledby="platform-title">
        <Backdrop variant="calm" />
        <Container className="pub-platform">
          <Reveal><SectionHeading tone="dark" id="platform-title" title="One ledger behind every document" intro="Disconnected tools mean every figure is a reconciliation job. Here, deliveries, invoices and returns write to the same place." /></Reveal>
          <div className="pub-platform-grid">
            <Reveal className="pub-before">
              <h3>Separate tools</h3>
              <div className="pub-scatter" aria-hidden="true">{["Stock sheet", "Billing software", "Expiry notes", "Accounts file", "Retailer list"].map((c, i) => <span key={c} style={{ "--i": i }}>{c}</span>)}</div>
              <ul>
                <li><Icon name="Minus" className="size-4" />Stock figures live in several files</li>
                <li><Icon name="Minus" className="size-4" />Expiry is noticed at physical checks</li>
                <li><Icon name="Minus" className="size-4" />Invoices and stock are entered twice</li>
                <li><Icon name="Minus" className="size-4" />Head office waits for each distributor&rsquo;s numbers</li>
              </ul>
            </Reveal>
            <Stage className="pub-after" margin="0px 0px -10% 0px">
              <h3>With e-Pulse</h3>
              <PlatformHub />
              <ul>
                <li><Icon name="Check" className="size-4" />Stock is derived from one movement ledger</li>
                <li><Icon name="Check" className="size-4" />Near-expiry and expired screens show risk early</li>
                <li><Icon name="Check" className="size-4" />Deliveries and invoices post to stock and accounts together</li>
                <li><Icon name="Check" className="size-4" />Admin sees distributors and secondary sales in one portal</li>
              </ul>
            </Stage>
          </div>
        </Container>
      </section>

      <section className="pub-section" aria-labelledby="portals-title">
        <Container>
          <Reveal><SectionHeading id="portals-title" title="Two portals, separate sign-ins" intro="Day-to-day work and head-office oversight live in different places. A Distributor sign-in never grants Admin access." /></Reveal>
          <div className="pub-portals">
            <Reveal as="article" className="pub-portal pub-portal-dist">
              <span className="pub-icontile"><Icon name="UsersRound" className="size-5" /></span>
              <h3>Distributor portal</h3>
              <p>For the team that runs the warehouse, the counter and the books of a single distributor.</p>
              <ul>
                <li><Icon name="Check" className="size-4" />Batch stock, ledger and adjustments</li>
                <li><Icon name="Check" className="size-4" />Sales orders, invoices, returns and credit notes</li>
                <li><Icon name="Check" className="size-4" />Purchase orders and goods receipt</li>
                <li><Icon name="Check" className="size-4" />Retailers, claims, receipts and ledgers</li>
              </ul>
              <ButtonLink to="/login" arrow>Distributor sign in</ButtonLink>
            </Reveal>
            <Reveal as="article" delay={90} className="pub-portal pub-portal-admin">
              <span className="pub-icontile"><Icon name="ShieldCheck" className="size-5" /></span>
              <h3>Admin portal</h3>
              <p>For head office: onboard distributors, set up masters and see across all of them.</p>
              <ul>
                <li><Icon name="Check" className="size-4" />Distributor onboarding and detail</li>
                <li><Icon name="Check" className="size-4" />Product, batch and pricing masters</li>
                <li><Icon name="Check" className="size-4" />Secondary sales, schemes and claims review</li>
                <li><Icon name="Check" className="size-4" />Outstanding, ageing and ERP integration</li>
              </ul>
              <ButtonLink to="/admin/login" variant="secondary" tone="dark" arrow>Admin sign in</ButtonLink>
            </Reveal>
          </div>
        </Container>
      </section>

      <section className="pub-section pub-section-tint" aria-labelledby="erp-title">
        <Container className="pub-erp">
          <Reveal>
            <h2 id="erp-title" className="pub-h2">Works standalone. Connects when you need it.</h2>
            <p className="pub-sh-intro">e-Pulse runs fully on its own. For organisations with an ERP, the Admin portal provides connection management, scheduled and manual sync jobs, sync history, an error monitor and an audit log.</p>
            <div className="pub-erp-actions"><StatusBadge status="available-erp" /><Link to="/modules#erp" className="pub-textlink">Read the integration status<Icon name="ArrowRight" className="size-4" /></Link></div>
          </Reveal>
          <Reveal delay={90} className="pub-status-card">
            <h3>Honest status</h3>
            <ul>
              <li><Icon name="CircleCheck" className="size-5 pub-ok" /><span><strong>Implemented:</strong> connections, sync jobs, history, error monitor, audit log.</span></li>
              <li><Icon name="AlertTriangle" className="size-5 pub-warn" /><span><strong>Not yet verified:</strong> behaviour against a live SAP or REST ERP system. Tests use simulated ERP responses.</span></li>
              <li><Icon name="Clock" className="size-5 pub-muted" /><span><strong>Not available:</strong> invoice, return and document sync; Oracle, Dynamics and SOAP.</span></li>
              <li><Icon name="Clock" className="size-5 pub-muted" /><span><strong>Planned:</strong> advanced report packs and in-app notifications.</span></li>
            </ul>
          </Reveal>
        </Container>
      </section>

      <section className="pub-section" aria-labelledby="faq-title">
        <Container className="pub-faq-grid">
          <Reveal className="pub-faq-intro">
            <h2 id="faq-title" className="pub-h2">Common questions</h2>
            <p className="pub-sh-intro">Short answers based on what the application does today.</p>
            <ButtonLink to="/faq" variant="secondary" arrow>See all questions</ButtonLink>
          </Reveal>
          <Reveal delay={90} className="pub-faq">
            {FAQS.slice(0, 4).map((f) => (
              <details key={f.id} className="pub-details">
                <summary>{f.q}<span className="pub-details-i" aria-hidden="true"><Icon name="ChevronDown" className="size-5" /></span></summary>
                <p>{f.a}</p>
              </details>
            ))}
          </Reveal>
        </Container>
      </section>

      <section className="pub-cta" aria-labelledby="cta-title">
        <Backdrop />
        <Container className="pub-cta-inner">
          <Reveal variant="scale">
            <h2 id="cta-title" className="pub-display pub-cta-title">See your distribution business in <span className="pub-grad">e-Pulse.</span></h2>
            <p className="pub-lead">Tell us about your operation and we will get back to you about a demo or a deployment question.</p>
            <div className="pub-hero-cta pub-cta-actions">
              <ButtonLink to="/contact" arrow>Contact us</ButtonLink>
              <ButtonLink to="/login" variant="secondary" tone="dark">Sign in</ButtonLink>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
