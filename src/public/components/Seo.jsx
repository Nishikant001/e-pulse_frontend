import { useEffect } from "react";
import { headFor } from "../seo.js";

function setMeta(attr, key, value) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!value) { if (el) el.remove(); return; }
  if (!el) { el = document.createElement("meta"); el.setAttribute(attr, key); document.head.appendChild(el); }
  el.setAttribute("content", value);
}

/** Keeps <head> correct during client-side navigation. The first load of each public URL is already correct because the build prerenders it (scripts/prerender.mjs). */
export default function Seo({ route }) {
  useEffect(() => {
    const h = headFor(route);
    document.title = h.title;
    setMeta("name", "description", h.description);
    setMeta("name", "robots", h.robots);
    for (const [k, v] of Object.entries(h.og)) setMeta(k.startsWith("twitter:") ? "name" : "property", k, v);
    ["og:url"].forEach((k) => { if (!h.og[k]) setMeta("property", k, ""); });
    let link = document.head.querySelector('link[rel="canonical"]');
    if (h.canonical) { if (!link) { link = document.createElement("link"); link.rel = "canonical"; document.head.appendChild(link); } link.href = h.canonical; } else if (link) link.remove();
    document.head.querySelectorAll('script[type="application/ld+json"]').forEach((s) => s.remove());
    h.jsonLd.forEach((o) => { const s = document.createElement("script"); s.type = "application/ld+json"; s.text = JSON.stringify(o).replace(/</g, "\\u003c"); document.head.appendChild(s); });
  }, [route]);
  return null;
}
