import Alert from "../../../components/ui/Alert";
import Tabs from "../../../components/ui/Tabs";

const TABS = [
  { id: "live", label: "Live data" },
  { id: "sample", label: "Sample data" },
];

/** Live / Sample switch shown in the page header of every Sales screen. */
export function SourceSwitch({ source, onChange }) {
  return <Tabs variant="pills" tabs={TABS} value={source} onChange={onChange} />;
}

/** Persistent notice while sample data is shown — sample mode is read-only and does not touch the database. */
export function SampleBanner({ dateNote = true }) {
  return (
    <Alert tone="info" title="Sample data" className="mb-4">
      You are viewing demo records generated for illustration. They are not read from your database and are read-only
      {dateNote ? "; the demo covers about the last 75 days" : ""}. Switch to “Live data” for real records and to create or change anything.
    </Alert>
  );
}
