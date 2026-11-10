import PortalLoginPage from "../../auth/PortalLoginPage";

/**
 * Sign-in (/login). One page for both portals: the Distributor / Admin switch lives on the page itself, so administrators
 * no longer need to type /admin/login. The Distributor flow (POST /login, cookie session, localStorage user → /dashboard) is unchanged.
 */
export default function Login() {
  return <PortalLoginPage />;
}
