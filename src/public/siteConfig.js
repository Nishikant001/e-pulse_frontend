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
  tagline: "Distributor management for pharmaceutical supply chains",
  origin: /^https?:\/\/[^\s/]+$/i.test(origin) ? origin : "", // "" = production domain not configured
  legalName: clean(env.VITE_COMPANY_LEGAL_NAME),
  contactEmail: clean(env.VITE_CONTACT_EMAIL),
  // Phase 24: defaults to the backend endpoint POST <API base>/public/contact. "off" disables it (mailto / not-configured notice instead).
  contactEndpoint: clean(env.VITE_CONTACT_ENDPOINT).toLowerCase() === "off" ? "" : clean(env.VITE_CONTACT_ENDPOINT) || `${API_BASE_URL}/public/contact`,
  address: clean(env.VITE_COMPANY_ADDRESS),
};

/** Paths that are part of the private application. Never prerendered, never in the sitemap, always noindex. */
export const PRIVATE_PREFIXES = ["/dashboard", "/admin", "/login", "/signup", "/forgot-password", "/reset-password"];
export const isPrivatePath = (p) => PRIVATE_PREFIXES.some((x) => p === x || p.startsWith(`${x}/`));

// indexable:false → rendered, but noindex and left out of the sitemap (legal drafts until they are reviewed).
export const PUBLIC_ROUTES = [
  { path: "/", id: "home", nav: "Home", title: "e-Pulse — Pharmaceutical Distributor Management System", description: "Manage batch-wise inventory, expiry, sales, purchasing, accounts and reporting for pharmaceutical distribution in one web application.", indexable: true },
  { path: "/features", id: "features", nav: "Features", title: "Features — e-Pulse", description: "Batch and expiry-aware inventory, FEFO allocation, sales and purchase documents, returns, accounts and Admin oversight in e-Pulse.", indexable: true },
  { path: "/modules", id: "modules", nav: "Modules", title: "Modules — e-Pulse", description: "Inventory, sales, purchasing, returns, accounts, retailers, schemes, claims and ERP integration modules, with their current implementation status.", indexable: true },
  { path: "/solutions", id: "solutions", nav: "Solutions", title: "Solutions and Use Cases — e-Pulse", description: "How pharmaceutical distributors use e-Pulse for stock control, expiry management, order-to-cash, procure-to-pay and head-office oversight.", indexable: true },
  { path: "/about", id: "about", nav: "About", title: "About — e-Pulse", description: "What e-Pulse is, who it is built for and how it is structured: a Distributor portal, an Admin portal and an optional ERP integration layer.", indexable: true },
  { path: "/faq", id: "faq", nav: "FAQ", title: "Frequently Asked Questions — e-Pulse", description: "Answers about e-Pulse: batch and expiry handling, FEFO, portals, ERP and SAP integration status, security and data isolation.", indexable: true },
  { path: "/contact", id: "contact", nav: "Contact", title: "Contact — e-Pulse", description: "Get in touch about e-Pulse. Send an enquiry about a demo, deployment or integration question.", indexable: true },
  { path: "/privacy", id: "privacy", nav: "", title: "Privacy Policy — e-Pulse", description: "Privacy policy template for e-Pulse. Draft text pending legal review.", indexable: false },
  { path: "/terms", id: "terms", nav: "", title: "Terms of Use — e-Pulse", description: "Terms of use template for e-Pulse. Draft text pending legal review.", indexable: false },
];

export const NOT_FOUND_ROUTE = { path: "/404", id: "not-found", nav: "", title: "Page not found — e-Pulse", description: "The page you requested does not exist.", indexable: false };
export const routeFor = (path) => PUBLIC_ROUTES.find((r) => r.path === path) || null;
export const SITEMAP_ROUTES = () => PUBLIC_ROUTES.filter((r) => r.indexable);
