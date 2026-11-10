import { Route } from "react-router-dom";
import PublicLayout from "./components/PublicLayout";
import Home from "./pages/Home";
import Features from "./pages/Features";
import Modules from "./pages/Modules";
import Solutions from "./pages/Solutions";
import About from "./pages/About";
import Faq from "./pages/Faq";
import Contact from "./pages/Contact";
import Legal from "./pages/Legal";
import NotFound from "./pages/NotFound";

/** Public (unauthenticated) routes. Used by the browser app AND by the build-time prerender (entry-server.jsx), so they must stay SSR-safe. */
export function publicRoutes() {
  return (
    <Route element={<PublicLayout />} key="public">
      <Route index element={<Home />} />
      <Route path="features" element={<Features />} />
      <Route path="modules" element={<Modules />} />
      <Route path="solutions" element={<Solutions />} />
      <Route path="about" element={<About />} />
      <Route path="faq" element={<Faq />} />
      <Route path="contact" element={<Contact />} />
      <Route path="privacy" element={<Legal doc="privacy" />} />
      <Route path="terms" element={<Legal doc="terms" />} />
      <Route path="*" element={<NotFound />} />
    </Route>
  );
}
