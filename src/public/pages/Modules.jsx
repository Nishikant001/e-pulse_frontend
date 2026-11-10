import { Container, PageHero, ButtonLink, StatusBadge, IconTile, cardCls } from "../components/ui";
import Reveal from "../components/Reveal";
import Icon from "../components/Icon";
import { MODULES, STATUS } from "../content.js";

export default function Modules() {
  return (
    <>
      <PageHero id="modules-title" title={<>Business modules and <span className="pub-grad">their status</span></>} intro="Status labels reflect the current implementation. “Planned” means not available yet." />
      <section className="pub-section pub-section-first">
        <Container>
          <dl className="pub-legend">
            {Object.entries(STATUS).map(([k, v]) => <div key={k}><dt><StatusBadge status={k} /></dt><dd>{v.hint}</dd></div>)}
          </dl>
          <div className="pub-cards pub-cards-2">
            {MODULES.map((m, i) => (
              <Reveal as="article" key={m.id} id={m.id} delay={(i % 2) * 60} className={`${cardCls} ${m.status === "planned" ? "pub-card-planned" : ""}`}>
                <div className="pub-card-top"><IconTile name={m.icon} /><StatusBadge status={m.status} /></div>
                <h2 className="pub-card-title">{m.name}</h2>
                <p className="pub-card-meta">Available in: {m.portals}</p>
                <p className="pub-card-text">{m.summary}</p>
                <ul className="pub-checklist">{m.points.map((p) => <li key={p}><Icon name="Check" className="size-4" /><span>{p}</span></li>)}</ul>
              </Reveal>
            ))}
          </div>
          <div className="pub-cta-row"><ButtonLink to="/contact" arrow>Ask about a module</ButtonLink></div>
        </Container>
      </section>
    </>
  );
}
