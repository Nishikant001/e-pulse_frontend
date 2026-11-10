// Test helper (not a test file): loads project source (JSX, extension-less imports, import.meta.env) through a Vite SSR server,
// so node --test can exercise the real navigation configs, route table and components without a browser.
import react from "@vitejs/plugin-react";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

export async function createLoader() {
  const server = await createServer({
    root,
    configFile: false,
    plugins: [react()],
    appType: "custom",
    logLevel: "error",
    server: { middlewareMode: true, hmr: false, watch: null },
    optimizeDeps: { noDiscovery: true, include: [] },
    ssr: { noExternal: [] },
  });
  return { load: (p) => server.ssrLoadModule(p), close: () => server.close() };
}
