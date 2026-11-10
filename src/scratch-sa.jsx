import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import { FeedbackProvider } from "./components/feedback";
import Page from "./features/superAdmin/pages/SuperAdminDashboardPage.jsx";
createRoot(document.getElementById("root")).render(
  <FeedbackProvider><BrowserRouter><div className="mx-auto max-w-[96rem] p-4 sm:p-6 bg-surface-muted min-h-screen"><Page /></div></BrowserRouter></FeedbackProvider>
);
