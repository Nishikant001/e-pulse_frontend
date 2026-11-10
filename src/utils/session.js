import { API_BASE_URL } from "./authFetch";

// The distributor profile returned by the existing login is kept in localStorage["user"].
// Only display fields are read here — no tokens are stored in the browser (cookies are httpOnly).
export function getStoredUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Same behaviour as the previous sidebar logout: end the server session, clear local state, go to /login.
export async function logout() {
  try {
    await fetch(`${API_BASE_URL}/logout`, { method: "POST", credentials: "include" });
  } catch (err) {
    console.error("Logout error", err);
  } finally {
    localStorage.removeItem("user");
    window.location.href = "/login";
  }
}
