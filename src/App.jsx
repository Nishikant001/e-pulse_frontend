import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoadingState from "./components/ui/LoadingState";
import { publicRoutes } from "./public/PublicRoutes";

// Phase 23: public website routes are bundled eagerly (they are prerendered); the whole authenticated application is one lazy chunk,
// so a visitor to the marketing pages does not download the dashboards.
const PrivateApp = lazy(() => import("./PrivateApp"));
const privateShell = (
  <Suspense fallback={<LoadingState label="Loading…" />}>
    <PrivateApp />
  </Suspense>
);

function App() {
  return (
    <Router>
      <Routes>
        {publicRoutes()}
        {/* Existing URLs, unchanged. PrivateApp contains the original route table (guards, portals, deep links). */}
        <Route element={privateShell}>
          {["/login", "/signup", "/forgot-password", "/reset-password", "/admin/*", "/dashboard/*"].map((p) => <Route key={p} path={p} />)}
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
