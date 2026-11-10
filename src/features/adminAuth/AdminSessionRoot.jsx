import { useCallback, useEffect, useMemo, useState } from "react";
import { Outlet } from "react-router-dom";
import { AdminApiError, adminRequest } from "../../utils/adminApi";
import { AdminSessionContext } from "./adminSessionContext";

/**
 * AdminSessionRoot — route element for /admin/*. It owns the Admin session STATE, but the session itself lives in
 * an httpOnly cookie the browser cannot read: identity is always asked from the server (GET /api/admin/session).
 * It is mounted only under /admin, so Distributor pages never trigger an Admin request.
 * The Distributor login/session is neither read nor modified here.
 */
export default function AdminSessionRoot() {
  const [state, setState] = useState({ status: "loading", admin: null, error: null });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState((s) => (s.status === "authenticated" ? s : { status: "loading", admin: null, error: null }));
    adminRequest("/session", { signal: controller.signal })
      .then((data) => setState(data.authenticated ? { status: "authenticated", admin: data.admin, error: null } : { status: "unauthenticated", admin: null, error: null }))
      .catch((err) => {
        if (err?.name === "AbortError") return;
        if (err instanceof AdminApiError && err.status === 401) setState({ status: "unauthenticated", admin: null, error: null });
        else setState({ status: "error", admin: null, error: err });
      });
    return () => controller.abort();
  }, [attempt]);

  const login = useCallback(async (email, password) => {
    const data = await adminRequest("/login", { method: "POST", body: { email, password } });
    setState({ status: "authenticated", admin: data.admin, error: null });
  }, []);

  const logout = useCallback(async () => {
    try {
      await adminRequest("/logout", { method: "POST" });
    } catch {
      /* the cookie may already be gone — still leave the portal */
    }
    setState({ status: "unauthenticated", admin: null, error: null });
  }, []);

  // A data request came back 401 (session expired or admin deactivated) → send the user to the login page.
  const expire = useCallback(() => setState({ status: "unauthenticated", admin: null, error: null }), []);
  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  const value = useMemo(() => ({ ...state, login, logout, expire, retry }), [state, login, logout, expire, retry]);
  return (
    <AdminSessionContext.Provider value={value}>
      <Outlet />
    </AdminSessionContext.Provider>
  );
}
