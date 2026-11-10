import { useCallback, useState } from "react";
import ConfirmationModal from "../../../components/ui/ConfirmationModal";
import { useToast } from "../../../components/feedback";
import { salesErrorMessage } from "../api/salesErrors";

const ACTIONS = {
  confirm: {
    title: (o) => `Confirm order ${o.orderNumber}?`,
    message: () => "The order will be confirmed. Stock is not reduced until the goods are delivered.",
    confirmLabel: "Confirm order",
    tone: "primary",
    run: (api, o) => api.confirmOrder(o.id),
    success: (o) => `Order ${o.orderNumber} confirmed`,
    failure: "Unable to confirm the order",
  },
  cancel: {
    title: (o) => `Cancel order ${o.orderNumber}?`,
    message: () => "The order will be cancelled. This cannot be undone.",
    confirmLabel: "Cancel order",
    tone: "danger",
    run: (api, o) => api.cancelOrder(o.id),
    success: (o) => `Order ${o.orderNumber} cancelled`,
    failure: "Unable to cancel the order",
  },
  create_invoice: {
    title: (o) => `Create invoice for ${o.orderNumber}?`,
    message: () => "Any quantity not yet delivered will be delivered now — stock is reduced (earliest expiry first unless a batch was chosen) — and a DRAFT invoice is created. Posting the invoice is a separate step.",
    confirmLabel: "Create invoice",
    tone: "warning",
    run: (api, o) => api.createInvoice(o.id),
    success: (o, r) => `Invoice ${r.invoice.invoiceNumber} created as a draft`,
    failure: "Invoice creation failed",
  },
  post_invoice: {
    title: (i) => `Post invoice ${i.invoiceNumber}?`,
    message: () => "Posting creates the accounting entries for this invoice and makes it final.",
    confirmLabel: "Post invoice",
    tone: "primary",
    run: (api, i) => api.postInvoice(i.id),
    success: (i) => `Invoice ${i.invoiceNumber} posted`,
    failure: "Unable to post the invoice",
  },
  cancel_invoice: {
    title: (i) => `Cancel invoice ${i.invoiceNumber}?`,
    message: () => "The draft invoice will be cancelled.",
    confirmLabel: "Cancel invoice",
    tone: "danger",
    run: (api, i) => api.cancelInvoice(i.id),
    success: (i) => `Invoice ${i.invoiceNumber} cancelled`,
    failure: "Unable to cancel the invoice",
  },
};

/**
 * useSalesActions — one place that runs a Sales action behind a ConfirmationModal, reports the result with a toast (never
 * alert()) and calls onDone() to refresh. Which actions are offered is decided by the backend (`actions` on each record).
 * Usage: const { request, modal } = useSalesActions({ api, onDone });  request("confirm", order);  …render {modal}.
 */
export function useSalesActions({ api, onDone }) {
  const toast = useToast();
  const [pending, setPending] = useState(null);
  const [busy, setBusy] = useState(false);

  const request = useCallback((action, record) => setPending({ action, record }), []);

  const confirm = async () => {
    const cfg = ACTIONS[pending.action];
    setBusy(true);
    try {
      const result = await cfg.run(api, pending.record);
      toast.success(cfg.success(pending.record, result));
      setPending(null);
      onDone?.(result);
    } catch (error) {
      toast.error(salesErrorMessage(error, cfg.failure), { title: cfg.failure });
      setPending(null);
      onDone?.(null); // refresh anyway — the record may have changed
    } finally {
      setBusy(false);
    }
  };

  const cfg = pending ? ACTIONS[pending.action] : null;
  const modal = (
    <ConfirmationModal
      open={Boolean(pending)}
      title={cfg ? cfg.title(pending.record) : ""}
      message={cfg ? cfg.message(pending.record) : ""}
      confirmLabel={cfg?.confirmLabel}
      tone={cfg?.tone}
      loading={busy}
      onConfirm={confirm}
      onCancel={() => setPending(null)}
    />
  );
  return { request, modal };
}
