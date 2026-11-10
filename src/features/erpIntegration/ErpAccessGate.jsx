import { ShieldAlert } from "lucide-react";
import EmptyState from "../../components/ui/EmptyState";
import { useErpPermissions } from "./erpPermissions";

/** Route-level UX guard for an ERP page. The server refuses the data anyway (403); this only avoids rendering a page full of failing requests. */
export default function ErpAccessGate({ permission, children }) {
  const { can } = useErpPermissions();
  if (!can(permission)) {
    return <EmptyState icon={ShieldAlert} title="You don't have access to this page" description="Your account is not allowed to use this part of ERP Integration. Ask an administrator if you need access." />;
  }
  return children;
}
