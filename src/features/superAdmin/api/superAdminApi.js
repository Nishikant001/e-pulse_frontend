import { adminRequest } from "../../../utils/adminApi";

/** Super Admin client. All endpoints are protected by the server-side SUPER_ADMIN guard. */
export const superAdminApi = {
  overview: (signal) => adminRequest("/superadmin/overview", { signal }),
  createAdmin: (body) => adminRequest("/superadmin/admins", { method: "POST", body }),
  roles: (signal) => adminRequest("/superadmin/roles", { signal }),
  distributors: (signal) => adminRequest("/superadmin/distributors", { signal }),
  onboarding: (signal) => adminRequest("/superadmin/onboarding", { signal }),
  adminDistributors: (id, signal) => adminRequest(`/superadmin/admins/${encodeURIComponent(id)}/distributors`, { signal }),
};
