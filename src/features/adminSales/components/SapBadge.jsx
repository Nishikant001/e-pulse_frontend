import StatusBadge from "../../../components/ui/StatusBadge";

/** SAP sync status (Pending / Synced / Failed / Partial); "—" when it does not apply (draft or cancelled documents). */
export default function SapBadge({ status }) {
  if (!status) return <span className="text-ink-subtle">—<span className="sr-only">Not applicable</span></span>;
  return <StatusBadge status={status} domain="sap" size="sm" />;
}
