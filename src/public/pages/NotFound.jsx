import { Container, ButtonLink, Backdrop } from "../components/ui";

export default function NotFound() {
  return (
    <section className="pub-hero pub-hero-page pub-404">
      <Backdrop variant="calm" />
      <Container className="pub-page-hero-inner">
        <p className="pub-404-code" aria-hidden="true">404</p>
        <h1 className="pub-display pub-page-title">Page not found</h1>
        <p className="pub-lead pub-page-intro">The page you requested does not exist or has moved.</p>
        <div className="pub-hero-cta"><ButtonLink to="/">Back to home</ButtonLink><ButtonLink to="/login" variant="secondary" tone="dark">Sign in</ButtonLink></div>
      </Container>
    </section>
  );
}
