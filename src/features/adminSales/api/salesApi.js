import { getSampleApi } from "../sample/sampleSalesApi.js";
import { liveSalesApi } from "./liveSalesApi";

/**
 * Single facade for the Sales screens. `salesApi(source)` returns the live API client or the read-only sample adapter with the
 * SAME method names and response shapes, so pages never branch on where data comes from (except to disable writes).
 */
export class SampleReadOnlyError extends Error {
  constructor() {
    super("Sample data is read-only. Switch to Live data to make changes.");
    this.name = "SampleReadOnlyError";
  }
}

const later = (fn) =>
  new Promise((resolve, reject) => {
    try {
      resolve(fn());
    } catch (e) {
      reject(e);
    }
  });
const readOnly = () => Promise.reject(new SampleReadOnlyError());

function buildSampleAdapter() {
  const s = getSampleApi();
  return {
    mode: "sample",
    filters: () => later(() => s.getFilterLookups()),
    retailers: () => Promise.resolve([]),
    products: () => Promise.resolve([]),
    batches: () => Promise.resolve([]),
    listOrders: (p) => later(() => s.listOrders(p)),
    getOrder: (id) => later(() => s.getOrder(id)),
    previewOrder: readOnly,
    createOrder: readOnly,
    updateOrder: readOnly,
    confirmOrder: readOnly,
    cancelOrder: readOnly,
    createInvoice: readOnly,
    listInvoices: (p) => later(() => s.listInvoices(p)),
    getInvoice: (id) => later(() => s.getInvoice(id)),
    postInvoice: readOnly,
    cancelInvoice: readOnly,
    secondarySummary: (p) => later(() => s.getSecondarySummary(p)),
    listSecondary: (p) => later(() => s.listSecondary(p)),
    getSecondary: (key) => later(() => s.getSecondary(key)),
  };
}

let sampleAdapter = null;
export function salesApi(source) {
  if (source === "sample") {
    if (!sampleAdapter) sampleAdapter = buildSampleAdapter();
    return sampleAdapter;
  }
  return liveSalesApi;
}
