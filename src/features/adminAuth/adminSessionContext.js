import { createContext, useContext } from "react";

export const AdminSessionContext = createContext(null);

// { status: "loading" | "authenticated" | "unauthenticated" | "error", admin, error, login, logout, retry, expire }
export function useAdminSession() {
  const ctx = useContext(AdminSessionContext);
  if (!ctx) throw new Error("useAdminSession must be used inside <AdminSessionRoot>");
  return ctx;
}

// For shared screens that also run in the Distributor portal (Customers, Reports): there is no admin session there,
// so this returns null instead of throwing. The Admin portal still gets the real session (used to react to a 401).
export function useOptionalAdminSession() {
  return useContext(AdminSessionContext);
}
