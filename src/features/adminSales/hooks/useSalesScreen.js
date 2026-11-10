import { useEffect, useMemo, useState } from "react";
import { useAdminSession } from "../../adminAuth/adminSessionContext";
import { salesApi } from "../api/salesApi";
import { useDataSource } from "./useDataSource";

/** Common wiring for the Sales screens: data source, API client, filter lookups (distributors, territories, categories), session expiry. */
export function useSalesScreen() {
  const [source, setSource] = useDataSource();
  const { expire } = useAdminSession();
  const api = useMemo(() => salesApi(source), [source]);
  const [lookups, setLookups] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    setLookups(null);
    Promise.resolve(api.filters(controller.signal))
      .then(setLookups)
      .catch(() => setLookups({ distributors: [], territories: [], categories: [] })); // filters degrade to empty lists; the list itself shows its own error
    return () => controller.abort();
  }, [api]);

  return { source, setSource, api, lookups, expire, isSample: source === "sample" };
}
