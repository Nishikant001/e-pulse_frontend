import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";

// Unknown /admin/* path. Planned modules are not routed yet, so they land here if typed manually.
export default function AdminNotFound() {
  return (
    <EmptyState
      icon={Compass}
      title="This page is not available"
      description="It may not exist, or it belongs to a module that has not been released yet."
      action={
        <Button as={Link} to="/admin/dashboard">
          Go to the dashboard
        </Button>
      }
    />
  );
}
