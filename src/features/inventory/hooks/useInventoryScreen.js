import { useContext, useEffect, useMemo, useState } from "react";
import { AdminSessionContext } from "../../adminAuth/adminSessionContext";
import { useDataSource } from "../../adminSales/hooks/useDataSource";
import { inventoryApi } from "../api/inventoryApi";

/**
 * Common wiring for the Inventory screens in either portal: data source (Admin only), API client, filter lookups
 * (distributors, warehouses, categories, reasons, thresholds) and session expiry. The Distributor portal is always live and
 * scoped by the server to the signed-in distributor.
 */
export function useInventoryScreen(portal) {
  const [source, setSource] = useDataSource();
  const adminSession = useContext(AdminSessionContext); // null outside the Admin portal
  const isAdmin = portal === "admin";
  const api = useMemo(() => inventoryApi(portal), [portal]);
  const [lookups, setLookups] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    setLookups(null);
    Promise.resolve(api.lookups(controller.signal))
      .then(setLookups)
      .catch(() => setLookups({ distributors: [], warehouses: [], categories: [], transactionTypes: [], nonSaleableReasons: [], thresholds: null })); // filters degrade to empty; the list shows its own error
    return () => controller.abort();
  }, [api]);

  return { portal, isAdmin, source, setSource, api, lookups, expire: adminSession?.expire, isSample: false };
}

export const inventoryBase = (portal) => (portal === "admin" ? "/admin/inventory" : "/dashboard/inventory");
