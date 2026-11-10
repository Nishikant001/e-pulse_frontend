import { SampleReadOnlyError } from "../../adminSales/api/salesApi";
import { getSampleInventoryApi } from "../sample/sampleInventoryApi";
import { adminInventoryApi, distributorInventoryApi } from "./liveInventoryApi";

/**
 * Single facade for the Inventory screens. inventoryApi(portal, source) returns a client with the SAME method names and
 * response shapes for live Admin, live Distributor and read-only sample data — pages never branch on where data comes from.
 * Sample data exists only in the Admin portal (demo); the Distributor portal is always live.
 */
const later = (fn) =>
  new Promise((resolve, reject) => {
    try {
      resolve(fn());
    } catch (e) {
      reject(e);
    }
  });

let sampleAdapter = null;
function buildSampleAdapter() {
  const s = getSampleInventoryApi();
  return {
    mode: "sample",
    canWrite: false,
    lookups: () => later(() => s.lookups()),
    summary: (p) => later(() => s.summary(p)),
    current: (p) => later(() => s.current(p)),
    batches: (p) => later(() => s.batches(p)),
    batchDetail: (id) => later(() => s.batchDetail(id)),
    ledger: (p) => later(() => s.ledger(p)),
    movement: (p) => later(() => s.movement(p)),
    transfers: (p) => later(() => s.transfers(p)),
    expirySummary: (p) => later(() => s.expirySummary(p)),
    fefoPreview: (p) => later(() => s.fefoPreview(p)),
    changeSaleability: () => Promise.reject(new SampleReadOnlyError()),
    createTransfer: () => Promise.reject(new SampleReadOnlyError()),
  };
}

export function inventoryApi(portal, source) {
  if (portal === "admin") {
    if (source === "sample") {
      if (!sampleAdapter) sampleAdapter = buildSampleAdapter();
      return sampleAdapter;
    }
    return adminInventoryApi;
  }
  return distributorInventoryApi;
}
