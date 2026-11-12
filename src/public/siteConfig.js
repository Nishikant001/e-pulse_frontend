/* global process */
// Public-website configuration — the single source of truth for routes, SEO text and company inputs.
// Imported by React pages, by the build-time prerender / sitemap script (plain Node) and by tests, so it has NO JSX and NO browser globals.
//
// Nothing here is invented: the production domain, contact e-mail, legal entity name and postal address come from environment variables
// (VITE_SITE_URL, VITE_CONTACT_EMAIL, VITE_COMPANY_LEGAL_NAME, VITE_COMPANY_ADDRESS). When one is not set the feature that needs it is
// switched off (no canonical URL, no sitemap, no mailto) instead of guessing.
import { API_BASE_URL } from "../config/api.js";
const env = (typeof import.meta !== "undefined" && import.meta.env) || (typeof process !== "undefined" ? process.env : {});

const clean = (v) => (typeof v === "string" && v.trim() ? v.trim() : "");
const origin = clean(env.VITE_SITE_URL).replace(/\/+$/, "");

export const SITE = {
  name: "e-Pulse",
  tagline: "Pharmaceutical distributor management software for inventory, expiry, sales and accounts",
  origin: /^https?:\/\/[^\s/]+$/i.test(origin) ? origin : "", // "" = production domain not configured
  legalName: clean(env.VITE_COMPANY_LEGAL_NAME),
  contactEmail: clean(env.VITE_CONTACT_EMAIL),
  // Phase 24: defaults to the backend endpoint POST <API base>/public/contact. "off" disables it (mailto / not-configured notice instead).
  contactEndpoint: clean(env.VITE_CONTACT_ENDPOINT).toLowerCase() === "off" ? "" : clean(env.VITE_CONTACT_ENDPOINT) || `${API_BASE_URL}/public/contact`,
  address: clean(env.VITE_COMPANY_ADDRESS),
  socialImage: `${origin}/og/e-pulse-social.png`,
};

/** Paths that are part of the private application. Never prerendered, never in the sitemap, always noindex. */
export const PRIVATE_PREFIXES = ["/dashboard", "/admin", "/login", "/signup", "/forgot-password", "/reset-password"];
export const isPrivatePath = (p) => PRIVATE_PREFIXES.some((x) => p === x || p.startsWith(`${x}/`));

// indexable:false → rendered, but noindex and left out of the sitemap (legal drafts until they are reviewed).
export const PUBLIC_ROUTES = [
  { path: "/", id: "home", nav: "Home", title: "Pharmaceutical Distributor Management Software | e-Pulse", description: "Manage pharmaceutical distribution with batch-wise inventory, FEFO expiry control, purchasing, sales, returns and accounts in one connected web application.", indexable: true },
  { path: "/features", id: "features", nav: "Features", title: "Pharma Distribution Software Features | e-Pulse", description: "Explore e-Pulse features for pharmaceutical distributors: batch inventory, FEFO allocation, expiry monitoring, sales, purchasing, returns and financial accounts.", indexable: true },
  { path: "/modules", id: "modules", nav: "Modules", title: "Pharmaceutical Distribution Management Modules | e-Pulse", description: "Review e-Pulse modules for pharmaceutical distribution, including inventory, batch and expiry control, sales, purchasing, accounts, schemes and ERP connectivity.", indexable: true },
  { path: "/solutions", id: "solutions", nav: "Solutions", title: "Pharmaceutical Distribution Workflows & Solutions | e-Pulse", description: "See how e-Pulse supports pharmaceutical stock control, expiry management, order-to-cash, procure-to-pay and multi-distributor head-office oversight.", indexable: true },
  { path: "/about", id: "about", nav: "About", title: "About e-Pulse Pharmaceutical Distribution Software", description: "Learn about e-Pulse, software for pharmaceutical distributors, with separate Distributor and Admin portals and an optional ERP integration layer.", indexable: true },
  { path: "/faq", id: "faq", nav: "FAQ", title: "Pharma Distributor Software FAQs | e-Pulse", description: "Get answers about pharmaceutical batch tracking, FEFO expiry management, distributor portals, ERP and SAP integration, data isolation and e-Pulse demos.", indexable: true },
  { path: "/contact", id: "contact", nav: "Contact", title: "Request a Pharma Software Demo | Contact e-Pulse", description: "Contact the e-Pulse team to discuss pharmaceutical distribution workflows, a product demonstration, deployment questions or ERP integration.", indexable: true },
  { path: "/privacy", id: "privacy", nav: "", title: "Privacy Policy — e-Pulse", description: "Privacy policy template for e-Pulse. Draft text pending legal review.", indexable: false },
  { path: "/terms", id: "terms", nav: "", title: "Terms of Use — e-Pulse", description: "Terms of use template for e-Pulse. Draft text pending legal review.", indexable: false },
];

export const NOT_FOUND_ROUTE = { path: "/404", id: "not-found", nav: "", title: "Page not found — e-Pulse", description: "The page you requested does not exist.", indexable: false };
export const routeFor = (path) => PUBLIC_ROUTES.find((r) => r.path === path) || null;
export const SITEMAP_ROUTES = () => PUBLIC_ROUTES.filter((r) => r.indexable);
