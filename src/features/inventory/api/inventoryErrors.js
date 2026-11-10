import { AdminApiError } from "../../../utils/adminApi";
import { SampleReadOnlyError } from "../../adminSales/api/salesApi";

// Friendly, specific messages for toasts / inline errors. Never a raw server or SQL message: only backend 4xx messages
// (which are written to be user-facing) pass through; everything else becomes the caller's fallback.
export function inventoryErrorMessage(error, fallback) {
  if (error instanceof SampleReadOnlyError) return error.message;
  const status = error?.status;
  if (error instanceof AdminApiError && status === 0) return "The server could not be reached. Check your connection and try again.";
  if (status === 401) return "Your session has ended. Please sign in again.";
  if (typeof status === "number" && status >= 400 && status < 500 && error.message) return error.message;
  return fallback;
}
