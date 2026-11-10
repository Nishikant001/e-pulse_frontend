import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminApiError } from "../../../utils/adminApi";

/**
 * Server-driven list state for the Sales tables: filters + search + sort + page. Each change fetches ONE page from the API
 * (aborting the previous request); nothing is filtered or sorted in the browser. `fetcher(params, signal)` returns
 * { items, total, page, pageSize }.
 */
export function useSalesList({ fetcher, filters, defaultSort, pageSize = 25, onUnauthorized }) {
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(pageSize);
  const [sort, setSort] = useState(defaultSort);
  const [state, setState] = useState({ status: "loading", data: null, error: null });
  const [attempt, setAttempt] = useState(0);

  // Any filter change returns to page 1.
  const filterKey = JSON.stringify(filters);
  useEffect(() => setPage(1), [filterKey]);

  const params = useMemo(() => ({ ...filters, page, pageSize: size, sort: sort?.key, dir: sort?.dir }), [filters, page, size, sort]);
  const paramKey = JSON.stringify(params);

  useEffect(() => {
    const controller = new AbortController();
    setState((s) => ({ status: "loading", data: s.data, error: null }));
    Promise.resolve(fetcher(params, controller.signal))
      .then((data) => setState({ status: "ready", data, error: null }))
      .catch((error) => {
        if (error?.name === "AbortError") return;
        if (error instanceof AdminApiError && error.status === 401) onUnauthorized?.();
        setState({ status: "error", data: null, error });
      });
    return () => controller.abort();
    // `params` is captured through paramKey; fetcher/onUnauthorized are stable per data source.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramKey, fetcher, attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);
  return {
    ...state,
    page,
    pageSize: size,
    sort,
    setPage,
    setPageSize: (n) => {
      setSize(n);
      setPage(1);
    },
    setSort: (s) => {
      setSort(s || defaultSort);
      setPage(1);
    },
    reload,
  };
}
