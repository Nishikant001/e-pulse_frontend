import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import Button from "../../ui/Button";
import EmptyState from "../../ui/EmptyState";

// Unknown or removed /dashboard/* path (Phase 2: FEFO Monitor, Masters, Schemes & Claims, Financial View and Vendor Ledger are no longer routed).
// Rendered inside the Distributor shell, so the sidebar stays; no redirect into another working page.
export default function DistributorNotFound() {
  return (
    <EmptyState
      icon={Compass}
      title="This page is not available"
      description="It may not exist, or it is not available in the Distributor portal."
      action={
        <Button as={Link} to="/dashboard">
          Go to the dashboard
        </Button>
      }
    />
  );
}
