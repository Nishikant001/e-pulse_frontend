// Pure SEO helpers shared by the browser (Seo component), the prerender script and the tests. No DOM access here.
import { SITE, SITEMAP_ROUTES, isPrivatePath } from "./siteConfig.js";

export const canonicalUrl = (path, origin = SITE.origin) => (origin ? `${origin}${path === "/" ? "/" : path}` : "");

/** Structured data — only types the site can honestly support, and only when the production origin is known. */
export function jsonLdFor(route, origin = SITE.origin, site = SITE) {
  if (!origin || route.path !== "/" || !route.indexable) return [];
  const org = { "@context": "https://schema.org", "@type": "Organization", name: site.legalName || site.name, url: `${origin}/` };
  if (site.contactEmail) org.email = site.contactEmail;
  return [
    org,
    { "@context": "https://schema.org", "@type": "WebSite", name: site.name, url: `${origin}/` },
    { "@context": "https://schema.org", "@type": "SoftwareApplication", name: site.name, applicationCategory: "BusinessApplication", operatingSystem: "Web browser", description: route.description, url: `${origin}/` },
  ];
}

/** Everything that belongs in <head> for a route. */
export function headFor(route, origin = SITE.origin, site = SITE) {
  const canonical = route.indexable ? canonicalUrl(route.path, origin) : "";
  return {
    title: route.title,
    description: route.description,
    robots: route.indexable ? "index,follow" : "noindex,follow",
    canonical,
    og: {
      "og:type": "website", "og:site_name": site.name, "og:title": route.title, "og:description": route.description,
      ...(canonical ? { "og:url": canonical } : {}),
      "twitter:card": "summary", "twitter:title": route.title, "twitter:description": route.description,
    },
    jsonLd: jsonLdFor(route, origin, site),
  };
}

/** XML sitemap of public, indexable routes. Returns null when the production origin is unknown (never guesses a domain). */
export function buildSitemap(routes = SITEMAP_ROUTES(), origin = SITE.origin) {
  if (!origin) return null;
  const urls = routes.filter((r) => !isPrivatePath(r.path)).map((r) => `  <url><loc>${canonicalUrl(r.path, origin)}</loc></url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

import { PRIVATE_PREFIXES } from "./siteConfig.js";
export function buildRobots(origin = SITE.origin) {
  const lines = ["# Private application areas must never be indexed.", "User-agent: *", ...PRIVATE_PREFIXES.map((p) => `Disallow: ${p}`), "Disallow: /api/", ""];
  if (origin) lines.push(`Sitemap: ${origin}/sitemap.xml`, "");
  else lines.push("# Sitemap line is added at build time once VITE_SITE_URL (the production domain) is configured.", "");
  return lines.join("\n");
}

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escJson = (o) => JSON.stringify(o).replace(/</g, "\\u003c");

/** Replaces the SEO tags of the built index.html shell with the route's tags and injects the prerendered body. */
export function applyHead(html, head, bodyHtml) {
  let out = html
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(head.title)}</title>`)
    .replace(/<meta\s+name="description"[^>]*>/, `<meta name="description" content="${esc(head.description)}" />`)
    .replace(/<meta\s+name="robots"[^>]*>/, `<meta name="robots" content="${head.robots}" />`);
  const extra = [];
  if (head.canonical) extra.push(`<link rel="canonical" href="${esc(head.canonical)}" />`);
  for (const [k, v] of Object.entries(head.og)) extra.push(k.startsWith("twitter:") ? `<meta name="${k}" content="${esc(v)}" />` : `<meta property="${k}" content="${esc(v)}" />`);
  for (const ld of head.jsonLd) extra.push(`<script type="application/ld+json">${escJson(ld)}</script>`);
  out = out.replace("</head>", `    ${extra.join("\n    ")}\n  </head>`);
  return out.replace('<div id="root"></div>', `<div id="root">${bodyHtml}</div>`);
}
