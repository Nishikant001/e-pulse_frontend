import { Container, PageHero } from "../components/ui";

/* EDITABLE TEMPLATES. These are structural placeholders only — NOT legal advice and NOT reviewed by a lawyer. Replace before launch. */
const DOCS = {
  privacy: { title: "Privacy Policy", sections: [
    ["Who we are", "[Insert legal entity name, registered address and contact email.]"],
    ["Information we collect", "[List the categories of personal data collected: contact-form details; account details for signed-in users; technical logs. Confirm against what is actually collected.]"],
    ["How we use information", "[Describe purposes and the legal basis that applies in your jurisdiction.]"],
    ["Sharing and retention", "[Describe processors, transfers and retention periods.]"],
    ["Your rights", "[Describe access, correction and deletion rights and how to exercise them.]"],
    ["Cookies", "[The application uses httpOnly session cookies for sign-in. List any other cookies or analytics, if any are added.]"],
    ["Contact", "[Insert privacy contact.]"] ] },
  terms: { title: "Terms of Use", sections: [
    ["Acceptance", "[Describe who the terms apply to and how they are accepted.]"],
    ["Accounts and access", "[Describe account responsibilities for Distributor and Admin users.]"],
    ["Acceptable use", "[Describe prohibited use.]"],
    ["Intellectual property", "[State ownership of the software and of customer data.]"],
    ["Availability and liability", "[Describe service availability, warranty disclaimers and limitation of liability as advised by counsel.]"],
    ["Governing law", "[Insert governing law and jurisdiction.]"] ] },
};

export default function Legal({ doc }) {
  const d = DOCS[doc];
  return (
    <>
      <PageHero id="legal-title" title={d.title} />
      <section className="pub-section"><Container className="pub-narrow">
        <div role="note" className="pub-note"><strong>Draft template — not legal advice.</strong> This text has not been reviewed by a lawyer and must be replaced with approved wording before publication. Edit <code>src/public/pages/Legal.jsx</code>.</div>
        {d.sections.map(([h, t]) => <div key={h} className="pub-legal-sec"><h2>{h}</h2><p>{t}</p></div>)}
      </Container></section>
    </>
  );
}
