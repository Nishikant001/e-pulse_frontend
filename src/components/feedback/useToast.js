import { useContext } from "react";
import { ToastContext } from "./feedbackContext";

/**
 * useToast — non-blocking notifications (replaces alert()).
 *   const toast = useToast();
 *   toast.success("Customer saved");
 *   toast.error("Unable to save customer", { title: "Save failed" });
 * Also: toast.warning, toast.info, toast.dismiss(id). Each returns the toast id.
 */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <FeedbackProvider>");
  return ctx;
}
