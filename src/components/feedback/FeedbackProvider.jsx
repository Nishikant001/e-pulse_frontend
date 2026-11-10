import ConfirmProvider from "./ConfirmProvider";
import ToastProvider from "./ToastProvider";

/** FeedbackProvider — mount once near the app root to enable useToast() and useConfirm(). */
export default function FeedbackProvider({ children }) {
  return (
    <ToastProvider>
      <ConfirmProvider>{children}</ConfirmProvider>
    </ToastProvider>
  );
}
