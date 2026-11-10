import { Navigate, useLocation } from "react-router-dom";

// UX-level gate for private portal routes.
//
// This is NOT a security boundary: real authorization is enforced by the
// backend (httpOnly cookie + authMiddleware on every /api route). It only
// stops the dashboard shell from rendering for a visitor who has no
// session, and sends them to the login page instead.
//
// Written so it can later be reused (or extended with a `role` / `portal`
// prop) for the /admin/* and /retailer/* portals without touching the
// existing Distributor login.
const ProtectedRoute = ({ children }) => {
  const location = useLocation();

  let hasSession = false;
  try {
    hasSession = Boolean(localStorage.getItem("user"));
  } catch {
    hasSession = false;
  }

  if (!hasSession) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
};

export default ProtectedRoute;
