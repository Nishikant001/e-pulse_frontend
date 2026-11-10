import { useLocalStorage } from "../../../hooks/useLocalStorage";

// Live / Sample switch shared by every Admin screen that has sample data (the key is the Phase 3 dashboard's key,
// so the choice is remembered across the dashboard and the Sales screens).
export function useDataSource() {
  return useLocalStorage("dms.admin.dashboard.source", "live");
}
