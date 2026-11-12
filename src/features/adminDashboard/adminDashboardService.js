import { adminRequest } from "../../utils/adminApi";
import { normalizeDashboard } from "./dashboardModel";

export const DATA_SOURCES = { LIVE: "live" };

/**
 * Single entry point for Admin dashboard data.
 *
 *  live   → ONE request: GET /api/admin/dashboard/summary?from=&to=  (read-only aggregation, admin cookie required).
 *           The selected range is sent to the server, which applies it to the range-based figures and reports which
 *           figures are snapshots (meta.appliedTo).
 *  Production mode intentionally has no sample-data fallback: server errors remain errors and empty results remain empty.
 *
 * The live response is normalized through dashboardModel.normalizeDashboard.
 */
export async function loadAdminDashboard({ source, range, signal }) {
  const query = new URLSearchParams({ from: range.from, to: range.to });
  const raw = await adminRequest(`/dashboard/summary?${query.toString()}`, { signal });
  return normalizeDashboard(raw, { source: DATA_SOURCES.LIVE });
}
