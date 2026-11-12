import { adminInventoryApi, distributorInventoryApi } from "./liveInventoryApi";

/** Production inventory clients. Admin and Distributor portals both read live server records only. */
export function inventoryApi(portal) {
  return portal === "admin" ? adminInventoryApi : distributorInventoryApi;
}
