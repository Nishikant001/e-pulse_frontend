import { useEffect, useState } from "react";

/** Loads the lookups (distributors / retailers) once for the filter bars; failures just leave the filters empty. */
export function useLookups(api, params) {
  const [data, setData] = useState({});
  const key = JSON.stringify(params || {});
  useEffect(() => {
    const c = new AbortController();
    api.lookups(params, c.signal).then(setData).catch(() => {});
    return () => c.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, key]);
  return data;
}

export const distributorOptions = (l) => (l.distributors || []).map((d) => ({ value: String(d.id), label: `${d.name} (${d.code})` }));
export const retailerOptions = (l, distributorId) => (l.retailers || []).filter((r) => !distributorId || String(r.distributorId) === String(distributorId)).map((r) => ({ value: String(r.id), label: r.name }));
