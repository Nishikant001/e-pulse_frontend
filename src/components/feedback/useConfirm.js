import { useContext } from "react";
import { ConfirmContext } from "./feedbackContext";

/**
 * useConfirm — promise-based replacement for window.confirm().
 *   const confirm = useConfirm();
 *   if (await confirm({ title: "Delete customer?", message: "This cannot be undone.", tone: "danger", confirmLabel: "Delete" })) { … }
 */
export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used inside <FeedbackProvider>");
  return ctx;
}
