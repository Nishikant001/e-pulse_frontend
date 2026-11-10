import { Container, PageHero, ButtonLink, IconTile, cardCls } from "../components/ui";
import Reveal from "../components/Reveal";
import { SITE } from "../siteConfig.js";

/* Editable: replace the clearly marked blocks with verified company information. Nothing about company history, customers, team size or certifications is stated here. */
export default function About() {
  return (
    <>
      <PageHero id="about-title" title={<>About <span className="pub-grad">e-Pulse</span></>} intro="A distributor management system for pharmaceutical supply chains, covering inventory, sales, purchasing, accounts and head-office oversight." />
      <section className="pub-section">
        <Container className="pub-split">
          <div className="pub-prose">
            <h2>What the product is</h2>
            <p>e-Pulse is a web application for pharmaceutical distributors. It keeps stock at batch level with expiry dates, connects purchase and sales documents to the stock ledger, and posts documents to accounts so inventory and finance stay consistent.</p>
            <p>It is organised as a <strong>Distributor portal</strong> for day-to-day operations, an <strong>Admin portal</strong> for head-office oversight, and an optional <strong>ERP integration layer</strong>. The application also runs fully standalone.</p>
            <h2>Company information</h2>
            <div className="pub-note" role="note">
              <strong>Editable content.</strong> Company history, leadership, certifications and customer information have not been supplied and are intentionally not stated. Edit <code>src/public/pages/About.jsx</code> and the <code>VITE_COMPANY_*</code> settings to add verified details.
            </div>
            {SITE.legalName ? <p>Operated by {SITE.legalName}.</p> : null}
          </div>
          <div id="portals" className="pub-stack">
            {[["UsersRound", "Distributor portal", "Inventory and batches, sales and purchase documents, returns, accounts and claims for a single Distributor."], ["ShieldCheck", "Admin portal", "Dashboard, distributor management, secondary sales, schemes, claims, finance views and ERP integration. Separate sign-in and session."]].map(([i, t, d], k) => (
              <Reveal key={t} delay={k * 70} className={cardCls}><IconTile name={i} /><h3 className="pub-card-title">{t}</h3><p className="pub-card-text">{d}</p></Reveal>
            ))}
            <p className="pub-fine">There is no separate retailer portal; retailers are master-data records managed by Distributors and Admin.</p>
          </div>
        </Container>
        <div className="pub-cta-row"><ButtonLink to="/contact" arrow>Get in touch</ButtonLink></div>
      </section>
    </>
  );
}
