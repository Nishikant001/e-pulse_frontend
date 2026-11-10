import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Container, PageHero, btnPrimary, cardCls } from "../components/ui";
import Icon from "../components/Icon";
import { SITE } from "../siteConfig.js";
import { validateContact, mailtoHref, LIMITS } from "../contactValidation.js";

const EMPTY = { name: "", email: "", organisation: "", phone: "", message: "", consent: false, website: "" };

/* Delivery (Phase 24): POST <API base>/public/contact. Success is shown ONLY for a 2xx answer. 503 CONTACT_NOT_CONFIGURED (server has no SMTP) → falls back to the
   visitor's mail app if VITE_CONTACT_EMAIL is set (worded "not sent yet"), else a plain "nothing was sent" notice. 429 → rate-limit message. Anything else → failure. */
export default function Contact() {
  const [v, setV] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [state, setState] = useState({ kind: "idle" }); // idle | sending | sent | failed | unconfigured | mail
  const summaryRef = useRef(null);
  const set = (k) => (e) => setV((p) => ({ ...p, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
  const field = (k) => ({ id: `c-${k}`, name: k, "aria-invalid": errors[k] ? "true" : undefined, "aria-describedby": errors[k] ? `c-${k}-err` : undefined });
  const inputCls = (k) => `pub-input ${errors[k] ? "is-invalid" : ""}`;

  async function submit(e) {
    e.preventDefault();
    if (v.website) return; // honeypot: silently ignore bots
    const r = validateContact(v);
    setErrors(r.errors);
    if (!r.valid) { setState({ kind: "idle" }); setTimeout(() => summaryRef.current?.focus(), 0); return; }
    if (SITE.contactEndpoint) {
      setState({ kind: "sending" });
      const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 15000);
      try {
        const res = await fetch(SITE.contactEndpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: v.name.trim(), email: v.email.trim(), organisation: v.organisation.trim(), phone: v.phone.trim(), message: v.message.trim() }), signal: ctl.signal });
        if (res.ok && /json/i.test(res.headers.get("content-type") || "")) { setState({ kind: "sent" }); setV(EMPTY); } // a 2xx that is not a JSON API answer (e.g. an HTML fallback page) is NOT proof of delivery
        else if (res.status === 429) setState({ kind: "limited" });
        else if (res.status === 503) setState(SITE.contactEmail ? { kind: "mail", href: mailtoHref(SITE.contactEmail, v) } : { kind: "unconfigured" });
        else setState({ kind: "failed" });
      } catch { setState({ kind: "failed" }); } finally { clearTimeout(t); }
    } else if (SITE.contactEmail) {
      setState({ kind: "mail", href: mailtoHref(SITE.contactEmail, v) });
    } else setState({ kind: "unconfigured" });
  }

  const errList = Object.entries(errors);
  return (
    <>
      <PageHero id="contact-title" title={<>Talk to us about <span className="pub-grad">e-Pulse</span></>} intro="Send an enquiry about a demo, a deployment or an integration question." />
      <section className="pub-section">
        <Container className="pub-split pub-split-form">
          <div className={`${cardCls} pub-formcard`}>
            {state.kind === "sent" ? (
              <div role="status" className="pub-alert pub-alert-ok"><p className="pub-alert-h"><Icon name="CircleCheck" className="size-5" />Thank you — your message was received.</p><p>We will reply to the email address you provided.</p></div>
            ) : (
              <form onSubmit={submit} noValidate aria-describedby="contact-note">
                {!SITE.contactEndpoint && !SITE.contactEmail ? <p id="contact-note" role="note" className="pub-alert pub-alert-warn"><Icon name="Info" className="size-4" /><span>This deployment has no contact delivery configured yet, so messages cannot be sent from this form. Use the Sign in page if you already have an account.</span></p> : <span id="contact-note" className="sr-only">All fields marked required must be completed.</span>}
                {errList.length ? (
                  <div ref={summaryRef} tabIndex={-1} role="alert" className="pub-alert pub-alert-err">
                    <p className="pub-alert-h">Please fix {errList.length === 1 ? "1 problem" : `${errList.length} problems`}:</p>
                    <ul className="pub-alert-list">{errList.map(([k, m]) => <li key={k}><a href={`#c-${k}`}>{m}</a></li>)}</ul>
                  </div>
                ) : null}
                <div className="pub-fields">
                  <div><label htmlFor="c-name" className="pub-label">Name <span aria-hidden="true">*</span><span className="sr-only">(required)</span></label><input {...field("name")} type="text" autoComplete="name" required maxLength={LIMITS.name[1]} value={v.name} onChange={set("name")} className={inputCls("name")} />{errors.name ? <p id="c-name-err" className="pub-err">{errors.name}</p> : null}</div>
                  <div><label htmlFor="c-email" className="pub-label">Work email <span aria-hidden="true">*</span><span className="sr-only">(required)</span></label><input {...field("email")} type="email" autoComplete="email" required value={v.email} onChange={set("email")} className={inputCls("email")} />{errors.email ? <p id="c-email-err" className="pub-err">{errors.email}</p> : null}</div>
                  <div><label htmlFor="c-organisation" className="pub-label">Organisation</label><input {...field("organisation")} type="text" autoComplete="organization" maxLength={LIMITS.organisation[1]} value={v.organisation} onChange={set("organisation")} className={inputCls("organisation")} />{errors.organisation ? <p id="c-organisation-err" className="pub-err">{errors.organisation}</p> : null}</div>
                  <div><label htmlFor="c-phone" className="pub-label">Phone</label><input {...field("phone")} type="tel" autoComplete="tel" value={v.phone} onChange={set("phone")} className={inputCls("phone")} />{errors.phone ? <p id="c-phone-err" className="pub-err">{errors.phone}</p> : null}</div>
                </div>
                <div className="pub-field-wide"><label htmlFor="c-message" className="pub-label">Message <span aria-hidden="true">*</span><span className="sr-only">(required)</span></label><textarea {...field("message")} rows={6} required maxLength={LIMITS.message[1]} value={v.message} onChange={set("message")} className={inputCls("message")} /><div className="pub-field-foot"><span>{errors.message ? <span id="c-message-err" className="pub-err">{errors.message}</span> : null}</span><span className="pub-count">{v.message.length}/{LIMITS.message[1]}</span></div></div>
                {/* honeypot — hidden from people and assistive tech */}
                <div aria-hidden="true" className="pub-hp"><label>Website<input type="text" tabIndex={-1} autoComplete="off" value={v.website} onChange={set("website")} /></label></div>
                <div className="pub-field-wide"><label className="pub-check"><input {...field("consent")} type="checkbox" checked={v.consent} onChange={set("consent")} /><span>I have read the <Link to="/privacy" className="pub-inline">Privacy Policy</Link>.</span></label>{errors.consent ? <p id="c-consent-err" className="pub-err">{errors.consent}</p> : null}</div>

                {state.kind === "failed" ? <p role="alert" className="pub-alert pub-alert-err"><Icon name="AlertTriangle" className="size-4" />Your message could not be sent. Please try again in a moment.</p> : null}
                {state.kind === "limited" ? <p role="alert" className="pub-alert pub-alert-warn"><Icon name="AlertTriangle" className="size-4" />Too many messages from your connection. Please wait a few minutes and try again.</p> : null}
                {state.kind === "unconfigured" ? <p role="alert" className="pub-alert pub-alert-warn"><Icon name="AlertTriangle" className="size-4" />Your details look fine, but this site has no way to deliver messages yet, so nothing was sent.</p> : null}
                {state.kind === "mail" ? <p role="status" className="pub-alert pub-alert-info">Your message is ready, but it has <strong>not</strong> been sent. <a className="font-semibold underline" href={state.href}>Open it in your email app</a> and press send.</p> : null}
                <div className="pub-field-wide"><button type="submit" disabled={state.kind === "sending"} aria-busy={state.kind === "sending"} className={btnPrimary}>{state.kind === "sending" ? "Sending…" : "Send message"}</button></div>
              </form>
            )}
          </div>
          <aside className="pub-stack" aria-label="Other ways to reach us">
            <div className={cardCls}><h2 className="pub-card-title">Contact details</h2>
              {SITE.contactEmail || SITE.address || SITE.legalName ? <ul className="pub-contact-list">{SITE.legalName ? <li>{SITE.legalName}</li> : null}{SITE.contactEmail ? <li><a className="pub-inline" href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a></li> : null}{SITE.address ? <li>{SITE.address}</li> : null}</ul> : <p className="pub-card-text">Company contact details have not been configured for this deployment.</p>}
            </div>
            <div className={cardCls}><h2 className="pub-card-title">Already a user?</h2><p className="pub-card-text">Sign in to your portal.</p><div className="pub-linkrow"><Link className="pub-inline" to="/login">Distributor sign in</Link><Link className="pub-inline" to="/admin/login">Admin sign in</Link></div></div>
          </aside>
        </Container>
      </section>
    </>
  );
}
