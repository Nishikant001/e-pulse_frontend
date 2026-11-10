import Alert from "../../../components/ui/Alert";

/** DemoNotice — shown on every Super Admin screen that renders sample data (see demoData.js). */
export default function DemoNotice({ children }) {
  return (
    <Alert tone="info" title="Design preview — sample data" className="mb-4">
      {children || "This screen shows sample data only. Nothing is loaded from or saved to the server yet."}
    </Alert>
  );
}
