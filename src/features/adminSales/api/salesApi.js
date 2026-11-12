import { liveSalesApi } from "./liveSalesApi";

/** Production Sales client. Sample adapters are intentionally not exposed in the application. */
export class SampleReadOnlyError extends Error {
  constructor() {
    super("Sample data is disabled. Use live server records.");
    this.name = "SampleReadOnlyError";
  }
}

export function salesApi() {
  return liveSalesApi;
}
