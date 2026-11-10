import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../../../utils/authFetch";

const Logout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const endSession = async () => {
      try {
        // The auth cookies are httpOnly, so only the server can clear them.
        await fetch(`${API_BASE_URL}/logout`, {
          method: "POST",
          credentials: "include",
        });
      } catch (err) {
        console.error("Logout error", err);
      } finally {
        // Clear all stored data (user info, etc.)
        localStorage.clear();

        // Redirect to home (which will navigate to /login because of your Navigate rule)
        navigate("/", { replace: true });
      }
    };
    endSession();
  }, [navigate]);

  return null; // No UI needed
};

export default Logout;
