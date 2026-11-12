import Card from "../../../components/ui/Card";
import EmptyState from "../../../components/ui/EmptyState";
import PageHeader from "../../../components/ui/PageHeader";
import { Database } from "lucide-react";

/** Honest placeholder for Super Admin sections that do not yet have a persistent backend API. */
export default function NotConfiguredPage({ title, description }) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <Card>
        <EmptyState
          icon={Database}
          title="No live data available"
          description="This section has no connected server-side data source yet. Demo records and local-only actions have been removed; nothing is being invented or saved only in this browser."
        />
      </Card>
    </div>
  );
}
