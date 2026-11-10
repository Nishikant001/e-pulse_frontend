// Static server with nginx-style fallback + same-origin /api proxy to the backend (the documented production layout).
import http from "node:http"; import fs from "node:fs"; import path from "node:path";
const DIST = path.resolve(process.env.DIST || "dist"); const API = { host: "127.0.0.1", port: Number(process.env.API_PORT || 5055) }; const PORT = Number(process.env.PORT || 4173);
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".xml": "application/xml", ".txt": "text/plain" };
http.createServer((q, s) => {
  if (q.url.startsWith("/api/")) { const p = http.request({ ...API, method: q.method, path: q.url, headers: { ...q.headers, host: `localhost:${API.port}` } }, (r) => { s.writeHead(r.statusCode, r.headers); r.pipe(s); }); p.on("error", () => { s.writeHead(502); s.end("bad gateway"); }); q.pipe(p); return; }
  let f = path.join(DIST, decodeURIComponent(q.url.split("?")[0])); if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, "index.html");
  if (!fs.existsSync(f)) f = path.join(DIST, "app-shell.html");
  s.writeHead(200, { "content-type": types[path.extname(f)] || "application/octet-stream" }); fs.createReadStream(f).pipe(s);
}).listen(PORT, () => console.log("serving", DIST, PORT));
