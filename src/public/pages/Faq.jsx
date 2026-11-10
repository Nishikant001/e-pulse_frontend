import { Container, PageHero, ButtonLink } from "../components/ui";
import Icon from "../components/Icon";
import { FAQS } from "../content.js";

export default function Faq() {
  return (
    <>
      <PageHero id="faq-title" title={<>Frequently <span className="pub-grad">asked questions</span></>} intro="Answers based on what the application does today." />
      <section className="pub-section">
        <Container className="pub-narrow">
          <div className="pub-faq pub-faq-page">
            {FAQS.map((f) => (
              <details key={f.id} id={f.id} className="pub-details">
                <summary><h2>{f.q}</h2><span className="pub-details-i" aria-hidden="true"><Icon name="ChevronDown" className="size-5" /></span></summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
          <div className="pub-faq-end"><p>Still have a question?</p><ButtonLink to="/contact" arrow>Contact us</ButtonLink></div>
        </Container>
      </section>
    </>
  );
}
