import Card, { CardHeader } from "../ui/Card";
import DataTable from "../tables/DataTable";

/** DataTableCard — a Card with a title/actions header wrapping a DataTable. All other props go to DataTable. */
export default function DataTableCard({ title, subtitle, actions, className, ...tableProps }) {
  return (
    <Card className={className}>
      <CardHeader title={title} subtitle={subtitle} actions={actions} />
      <DataTable bare {...tableProps} />
    </Card>
  );
}
