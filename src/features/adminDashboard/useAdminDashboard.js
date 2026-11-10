import { useCallback, useEffect, useState } from "react";
import { AdminApiError } from "../../utils/adminApi";
import { loadAdminDashboard } from "./adminDashboardService";

/**
 * Loads the dashboard once per (source, from, to) — no polling, no duplicate requests. An in-flight request is
 * aborted when the inputs change. `reload()` re-runs the same request. A 401 calls `onUnauthorized` (session ended).
 */
export function useAdminDashboard({ source, from, to, onUnauthorized }) {
  const [state, setState] = useState({ status: "loading", data: null, error: null });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState((s) => ({ status: "loading", data: s.data, error: null }));
    loadAdminDashboard({ source, range: { from, to }, signal: controller.signal })
      .then((data) => setState({ status: "ready", data, error: null }))
      .catch((error) => {
        if (error?.name === "AbortError") return;
        if (error instanceof AdminApiError && error.status === 401) onUnauthorized?.();
        setState({ status: "error", data: null, error });
      });
    return () => controller.abort();
    // onUnauthorized is intentionally excluded: it is a stable callback from the session context.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, from, to, attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);
  return { ...state, reload };
}
