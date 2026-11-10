import { AdminApiError } from "../../../utils/adminApi";
import { SampleReadOnlyError } from "./salesApi";

// Friendly, specific messages for toasts / inline errors (never a raw server or SQL message).
const BY_CODE = {
  CREDIT_LIMIT_EXCEEDED: "Order cannot be confirmed because the applicable credit limit has been exceeded.",
  INVALID_TRANSITION: "This action is not allowed for the current status. Refresh the list and try again.",
  NOTHING_TO_INVOICE: "There is nothing left to invoice for this order.",
  VALIDATION_FAILED: "Some order lines need attention. Check the highlighted lines.",
};

export function salesErrorMessage(error, fallback) {
  if (error instanceof SampleReadOnlyError) return error.message;
  if (error instanceof AdminApiError) {
    if (error.status === 0) return "The server could not be reached. Check your connection and try again.";
    if (error.code && BY_CODE[error.code]) return error.code === "CREDIT_LIMIT_EXCEEDED" || error.code === "INVALID_TRANSITION" || error.code === "VALIDATION_FAILED" ? BY_CODE[error.code] : error.message || BY_CODE[error.code];
    if (error.status === 401) return "Your session has ended. Please sign in again.";
    if (error.status < 500 && error.message) return error.message;
  }
  return fallback;
}
