import { Link } from "react-router-dom";
import { Container, PageHero, ButtonLink, IconTile, cardCls } from "../components/ui";
import Reveal from "../components/Reveal";
import Icon from "../components/Icon";
import { FEATURES } from "../content.js";

export default function Features() {
  return (
    <>
      <PageHero id="features-title" title={<>What e-Pulse <span className="pub-grad">does</span></>} intro="Capabilities that exist in the application today. Anything planned is labelled as planned on the Modules page." />
      <section className="pub-section">
        <Container>
          <div className="pub-cards pub-cards-3">
            {FEATURES.map((f, i) => (
              <Reveal as="article" key={f.title} delay={(i % 3) * 60} className={cardCls}>
                <IconTile name={f.icon} />
                <h2 className="pub-card-title">{f.title}</h2>
                <p className="pub-card-text">{f.text}</p>
                <Link to={f.to} className="pub-tile-link">Details<span className="sr-only"> for {f.title}</span><Icon name="ArrowRight" className="size-4" /></Link>
              </Reveal>
            ))}
          </div>
          <div className="pub-cta-row"><ButtonLink to="/modules" arrow>Explore modules</ButtonLink><ButtonLink to="/contact" variant="secondary">Request a demo</ButtonLink></div>
        </Container>
      </section>
    </>
  );
}
