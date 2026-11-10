/** True when the server-confirmed admin account has the SUPER_ADMIN role (UX gate only — the API enforces it). */
export const isSuperAdmin = (admin) => String(admin?.role || "").toUpperCase() === "SUPER_ADMIN";
