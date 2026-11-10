import { useCallback, useEffect, useState } from "react";

/** Small fetch-on-change hook (aborts the previous request). `fn(signal)` is re-run whenever `deps` change or reload() is called. */
export function useAsyncData(fn, deps) {
  const [state, setState] = useState({ status: "loading", data: null, error: null });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setState((s) => ({ status: "loading", data: s.data, error: null }));
    Promise.resolve(fn(controller.signal))
      .then((data) => setState({ status: "ready", data, error: null }))
      .catch((error) => {
        if (error?.name === "AbortError") return;
        setState({ status: "error", data: null, error });
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, attempt]);
  const reload = useCallback(() => setAttempt((n) => n + 1), []);
  return { ...state, reload };
}
