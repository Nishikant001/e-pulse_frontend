// Post-build step: writes real HTML for every public route (dist/<route>/index.html), plus sitemap.xml and robots.txt.
//   vite build                                   → dist/ (client)
//   vite build --ssr src/entry-server.jsx        → dist-ssr/ (renderer)
//   node scripts/prerender.mjs                   → this file
// Without VITE_SITE_URL no canonical/OG url/JSON-LD/sitemap is produced (the domain is never guessed).
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { loadEnv } from "vite";

const root = process.cwd();
Object.assign(process.env, loadEnv(process.env.NODE_ENV === "production" ? "production" : "production", root, "VITE_"));
const { PUBLIC_ROUTES, SITE, isPrivatePath } = await import("../src/public/siteConfig.js");
const { headFor, applyHead, buildSitemap, buildRobots } = await import("../src/public/seo.js");
const ssrDir = path.join(root, "dist-ssr");
const ssrFile = fs.readdirSync(ssrDir).find((f) => /^entry-server\.(m?js)$/.test(f));
const { render } = await import(pathToFileURL(path.join(ssrDir, ssrFile)).href);

const shell = fs.readFileSync(path.join(root, "dist", "index.html"), "utf8");
if (!shell.includes('<div id="root"></div>')) throw new Error("dist/index.html shell has no empty #root");

for (const route of PUBLIC_ROUTES) {
  if (isPrivatePath(route.path)) throw new Error(`private path in public routes: ${route.path}`);
  const html = applyHead(shell, headFor(route), render(route.path));
  const out = route.path === "/" ? path.join(root, "dist", "index.html") : path.join(root, "dist", route.path.slice(1), "index.html");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html);
  console.log(`prerendered ${route.path}`);
}
// The private/unknown-URL fallback shell stays noindex; keep a copy for servers that need an explicit fallback file.
fs.writeFileSync(path.join(root, "dist", "app-shell.html"), shell);
fs.writeFileSync(path.join(root, "dist", "robots.txt"), buildRobots(SITE.origin));
const sm = buildSitemap();
if (sm) { fs.writeFileSync(path.join(root, "dist", "sitemap.xml"), sm); console.log("sitemap.xml written"); }
else console.warn("WARNING: VITE_SITE_URL not set — canonical URLs, JSON-LD and sitemap.xml were NOT generated.");
fs.rmSync(ssrDir, { recursive: true, force: true });
