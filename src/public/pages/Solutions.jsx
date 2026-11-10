import { Link } from "react-router-dom";
import { Container, PageHero, ButtonLink, IconTile, cardCls } from "../components/ui";
import Reveal from "../components/Reveal";
import Icon from "../components/Icon";
import { SOLUTIONS } from "../content.js";

export default function Solutions() {
  return (
    <>
      <PageHero id="solutions-title" title={<>Use cases for <span className="pub-grad">pharmaceutical distribution</span></>} intro="Workflows supported by the application today. No customer deployments or regulatory certifications are implied." />
      <section className="pub-section">
        <Container>
          <div className="pub-cards pub-cards-2">
            {SOLUTIONS.map((s, i) => (
              <Reveal as="article" key={s.id} id={s.id} delay={(i % 2) * 60} className={cardCls}>
                <IconTile name={s.icon} />
                <h2 className="pub-card-title">{s.title}</h2>
                <p className="pub-card-meta">For: {s.who}</p>
                <p className="pub-card-text">{s.text}</p>
                <ol className="pub-numlist">{s.steps.map((t, k) => <li key={t}><span aria-hidden="true">{k + 1}</span><span><span className="sr-only">Step {k + 1}: </span>{t}</span></li>)}</ol>
                <Link to={s.to} className="pub-tile-link">Related module<span className="sr-only"> for {s.title}</span><Icon name="ArrowRight" className="size-4" /></Link>
              </Reveal>
            ))}
          </div>
          <div className="pub-cta-row"><ButtonLink to="/contact" arrow>Discuss your workflow</ButtonLink></div>
        </Container>
      </section>
    </>
  );
}
