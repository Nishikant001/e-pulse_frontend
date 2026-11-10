import { createContext, useContext } from "react";

export const DateRangeContext = createContext({ range: { from: "", to: "" }, setRange: () => {} });

// Shell-level date range. Screens opt in by reading it; legacy screens do not consume it yet.
export function useDateRange() {
  return useContext(DateRangeContext);
}
