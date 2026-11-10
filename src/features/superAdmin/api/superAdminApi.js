import { adminRequest } from "../../../utils/adminApi";

/** Super Admin client (/api/admin/superadmin/*). Admin session cookie only; the server answers 403 to any non-SUPER_ADMIN role. */
export const superAdminApi = {
  overview: (signal) => adminRequest("/superadmin/overview", { signal }),
  adminDistributors: (id, signal) => adminRequest(`/superadmin/admins/${encodeURIComponent(id)}/distributors`, { signal }),
};
