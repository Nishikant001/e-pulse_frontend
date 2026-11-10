import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router";
import { Routes } from "react-router-dom";
import { publicRoutes } from "./public/PublicRoutes";

/** Build-time only: HTML of a public route for scripts/prerender.mjs. */
export function render(url) {
  return renderToString(<StaticRouter location={url}><Routes>{publicRoutes()}</Routes></StaticRouter>);
}
