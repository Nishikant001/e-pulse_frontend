import { useState } from "react";
import { useToast } from "../../../components/feedback";
import { inventoryErrorMessage } from "../api/inventoryErrors";

/**
 * Row-level "Transfer stock" / "Mark non-saleable" actions need the FULL batch detail (distributor id, warehouse,
 * current saleable/non-saleable quantities) that a list row does not carry — so this fetches it fresh via
 * api.batchDetail(batchId) the moment the action is chosen, then opens the same modal BatchDrawer already uses.
 * Fetching fresh (rather than reusing the row the person clicked) also means the action always works against
 * current stock, not whatever was on screen when the list last loaded.
 */
export function useBatchQuickActions(api) {
  const toast = useToast();
  const [transferBatch, setTransferBatch] = useState(null);
  const [nonSaleableBatch, setNonSaleableBatch] = useState(null);
  const [loadingId, setLoadingId] = useState(null);

  async function load(batchId, setter) {
    setLoadingId(batchId);
    try {
      const detail = await api.batchDetail(batchId);
      setter(detail);
    } catch (e) {
      toast.error(inventoryErrorMessage(e, "Unable to load batch details."));
    } finally {
      setLoadingId(null);
    }
  }

  return {
    loadingId,
    openTransfer: (batchId) => load(batchId, setTransferBatch),
    openNonSaleable: (batchId) => load(batchId, setNonSaleableBatch),
    transferBatch,
    nonSaleableBatch,
    closeTransfer: () => setTransferBatch(null),
    closeNonSaleable: () => setNonSaleableBatch(null),
  };
}
