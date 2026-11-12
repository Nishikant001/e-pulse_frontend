# e-Pulse SEO implementation report

Target: global English-language market; primary outcomes: organic discovery and qualified demo enquiries.

## Implemented in source

- Refined page titles and meta descriptions around pharmaceutical distributor software, batch inventory, FEFO expiry management, purchasing, sales and accounts.
- Added a branded 1200 × 630 Open Graph / X (Twitter) social preview image.
- Added route-aware Open Graph metadata, large-image Twitter cards, locale, image alt text and `max-image-preview:large`.
- Expanded truthful Schema.org data: WebPage for indexable pages, WebSite and SoftwareApplication on the home page, and FAQPage from the visible FAQ content. Organization data is emitted only when a legal entity name is configured. No fake reviews, ratings, prices, offers, certifications or customer counts are added.
- Changed private application pages to `noindex,nofollow`; robots.txt no longer blocks those paths, so crawlers can read the noindex directive. API paths remain disallowed.
- Added a prerendered 404 document for a real HTTP 404 response when paired with the supplied Nginx configuration.
- Added `.gitignore` entries for `.env`, build output and dependencies. `.env.example` contains only the public site/API URLs required for this deployment.
- Added an Nginx snippet so public prerendered routes are served as static HTML, known private routes use `app-shell.html`, and unknown paths return the 404 document.

## Deployment

1. Keep the existing server `.env`; do not overwrite it with the ZIP. Ensure it contains the public `VITE_SITE_URL` and `VITE_API_BASE_URL` values shown in `.env.example`.
2. Install dependencies with `npm ci`.
3. Run `npm run build`.
4. Run `npm run verify:dist` and `npm test`.
5. Apply the relevant location directives from `deploy/nginx-epulse-frontend.conf` inside the existing `epulse.excelligent.co.in` server block. Preserve the existing TLS/listen directives. Test with `sudo nginx -t` before reloading.
6. Verify the public pages, `/robots.txt`, `/sitemap.xml`, `/og/e-pulse-social.png`, a private URL (noindex shell), and a random unknown URL (HTTP 404).
7. Submit the sitemap in Google Search Console and Bing Webmaster Tools.

## Important limits

- This ZIP contains source changes, not a freshly generated `dist/` folder. The build environment here could not complete `npm ci` because dependency installation timed out, so a production build and the full dependency-based test suite could not be verified in this environment.
- The pure SEO test file passed 13/13. The full test run had 5 dependency-resolution failures because the interrupted install left React and Vite packages incomplete; 50 other tests passed.
- Search ranking, indexing, Core Web Vitals and contact-form delivery require live-site and Search Console verification after deployment.
- Privacy and Terms remain noindex drafts. Do not index them until reviewed and replaced with approved legal text.
