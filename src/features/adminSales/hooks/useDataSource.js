// Production mode: operational screens always read live server data. The setter is a no-op for compatibility.
export function useDataSource() {
  return ["live", () => {}];
}
