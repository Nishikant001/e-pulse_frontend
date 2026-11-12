// Pure SEO helpers shared by the browser (Seo component), the prerender script and the tests. No DOM access here.
import { SITE, SITEMAP_ROUTES, isPrivatePath } from "./siteConfig.js";
import { FAQS } from "./content.js";

export const canonicalUrl = (path, origin = SITE.origin) => (origin ? `${origin}${path === "/" ? "/" : path}` : "");

/** Structured data uses only product facts present in the application. No ratings, offers, certifications or customer counts are invented. */
export function jsonLdFor(route, origin = SITE.origin, site = SITE) {
  if (!origin || !route.indexable) return [];
  const graph = [
    { "@context": "https://schema.org", "@type": "WebPage", name: route.title, description: route.description, url: `${origin}${route.path === "/" ? "/" : route.path}`, isPartOf: { "@type": "WebSite", name: site.name, url: `${origin}/` } },
  ];
  if (route.path === "/") {
    graph.push(
      { "@context": "https://schema.org", "@type": "WebSite", name: site.name, url: `${origin}/`, description: site.tagline },
      { "@context": "https://schema.org", "@type": "SoftwareApplication", name: site.name, applicationCategory: "BusinessApplication", operatingSystem: "Web browser", description: route.description, url: `${origin}/` },
    );
    if (site.legalName) {
      const org = { "@context": "https://schema.org", "@type": "Organization", name: site.legalName, url: `${origin}/` };
      if (site.contactEmail) org.email = site.contactEmail;
      if (site.address) org.address = { "@type": "PostalAddress", streetAddress: site.address };
      graph.push(org);
    }
  }
  if (route.path === "/faq") {
    graph.push({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQS.map((item) => ({ "@type": "Question", name: item.q, acceptedAnswer: { "@type": "Answer", text: item.a } })) });
  }
  return graph;
}

/** Everything that belongs in <head> for a route. */
export function headFor(route, origin = SITE.origin, site = SITE) {
  const canonical = route.indexable ? canonicalUrl(route.path, origin) : "";
  const image = origin ? `${origin}/og/e-pulse-social.png` : "";
  return {
    title: route.title,
    description: route.description,
    robots: route.indexable ? "index,follow,max-image-preview:large" : "noindex,nofollow",
    canonical,
    og: {
      "og:type": "website", "og:site_name": site.name, "og:title": route.title, "og:description": route.description,
      "og:locale": "en_US",
      ...(canonical ? { "og:url": canonical } : {}),
      ...(image && route.indexable ? { "og:image": image, "og:image:width": "1200", "og:image:height": "630", "og:image:alt": "e-Pulse pharmaceutical distributor management software" } : {}),
      "twitter:card": image && route.indexable ? "summary_large_image" : "summary", "twitter:title": route.title, "twitter:description": route.description,
      ...(image && route.indexable ? { "twitter:image": image, "twitter:image:alt": "e-Pulse pharmaceutical distributor management software" } : {}),
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

export function buildRobots(origin = SITE.origin) {
  const lines = ["# Private pages are crawlable only so search engines can read their noindex directives.", "User-agent: *", "Disallow: /api/", ""];
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
