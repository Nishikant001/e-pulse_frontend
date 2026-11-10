import { useEffect, useState } from "react";
import { mastersApi } from "../api/mastersApi";

const EMPTY = { products: [], distributors: [], categories: [], hsnOptions: [], customerGroups: [], dosageForms: [] };

/** Distributors / categories / HSN options / customer groups shown across every Masters screen's filters and forms. */
export function useMastersLookups(distributorId) {
  const [lookups, setLookups] = useState(null);
  useEffect(() => {
    const controller = new AbortController();
    setLookups(null);
    mastersApi
      .lookups(distributorId, controller.signal)
      .then(setLookups)
      .catch(() => setLookups(EMPTY)); // filters degrade to empty; the list still shows its own error state
    return () => controller.abort();
  }, [distributorId]);
  return lookups || EMPTY;
}