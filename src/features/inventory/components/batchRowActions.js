import { Ban, Eye, FileClock, Repeat, RotateCcw, Send } from "lucide-react";
import { inventoryBase } from "../hooks/useInventoryScreen";

/**
 * The row-action list Phase 6 asks for (item 15): View Batch, View Stock Ledger, Transfer Stock, Push Sales, Return,
 * Mark Non-Saleable — for a Batch Stock / FEFO Monitor / Near Expiry / Expired Stock row.
 *
 * Only an action with a real, already-safe backend workflow behind it is enabled — the other two are shown, disabled,
 * with a one-line explanation, rather than either being hidden (the brief asks the action to at least exist as a
 * clear integration point) or faked into "succeeding":
 *   - Push Sales: no backend workflow exists yet (it depends on the scheme/claims engine, a later phase).
 *   - Return: the existing Sales/Purchase Return flows always return against a specific posted invoice or purchase
 *     line, not an arbitrary batch chosen from an inventory screen — there is no "return this batch" endpoint to
 *     call, so this is not yet a safe integration point either.
 * Write actions (Transfer Stock, Mark Non-Saleable) never appear for a caller who can't write (Admin/sample).
 */
export function buildBatchRowActions(row, { api, portal, onViewBatch, onTransfer, onMarkNonSaleable }) {
  const base = inventoryBase(portal);
  const items = [
    { key: "view", label: "View batch", icon: Eye, onClick: () => onViewBatch?.(row.batchId) },
    { key: "ledger", label: "View stock ledger", icon: FileClock, to: `${base}/ledger?batch=${row.batchId}` },
  ];
  if (api.canWrite) {
    items.push({
      key: "transfer", label: "Transfer stock", icon: Repeat,
      disabled: row.saleableQty <= 0,
      hint: row.saleableQty <= 0 ? "No saleable stock to transfer" : undefined,
      onClick: row.saleableQty > 0 ? () => onTransfer?.(row.batchId) : undefined,
    });
  }
  items.push({ key: "push-sales", label: "Push sales", icon: Send, disabled: true, hint: "Planned — depends on the Scheme Engine (a later phase)" });
  items.push({ key: "return", label: "Return", icon: RotateCcw, disabled: true, hint: "Use Sales Returns from the original invoice, or Purchase Returns from the original purchase" });
  if (api.canWrite) {
    items.push({
      key: "non-saleable", label: "Mark non-saleable", icon: Ban,
      disabled: row.saleableQty <= 0,
      hint: row.saleableQty <= 0 ? "No saleable stock to mark" : undefined,
      onClick: row.saleableQty > 0 ? () => onMarkNonSaleable?.(row.batchId) : undefined,
    });
  }
  return items;
}
