import { adminRequest } from "../../utils/adminApi";
import { normalizeDashboard } from "./dashboardModel";
import { buildSampleRaw } from "./sampleData";

export const DATA_SOURCES = { LIVE: "live", SAMPLE: "sample" };

/**
 * Single entry point for Admin dashboard data.
 *
 *  live   → ONE request: GET /api/admin/dashboard/summary?from=&to=  (read-only aggregation, admin cookie required).
 *           The selected range is sent to the server, which applies it to the range-based figures and reports which
 *           figures are snapshots (meta.appliedTo).
 *  sample → structured demo data (./sampleData.js). It IGNORES the range on purpose and says so in its metadata.
 *
 * Both paths return the same normalized view-model (dashboardModel.normalizeDashboard).
 */
export async function loadAdminDashboard({ source, range, signal }) {
  if (source === DATA_SOURCES.SAMPLE) {
    return normalizeDashboard(buildSampleRaw(), { source: DATA_SOURCES.SAMPLE });
  }
  const query = new URLSearchParams({ from: range.from, to: range.to });
  const raw = await adminRequest(`/dashboard/summary?${query.toString()}`, { signal });
  return normalizeDashboard(raw, { source: DATA_SOURCES.LIVE });
}
