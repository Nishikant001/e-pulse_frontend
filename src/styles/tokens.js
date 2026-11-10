// JS mirror of the colour tokens in tokens.css, for libraries that cannot read
// CSS classes (e.g. Recharts). tokens.css remains the source of truth — keep in sync.
export const brand = {
  50: "#f0f7ff", 100: "#e0efff", 200: "#b9dcfe", 300: "#7cc0fd", 400: "#36a0fa",
  500: "#0c83eb", 600: "#0066cc", 700: "#0052a5", 800: "#054687", 900: "#0a3b6f",
};

export const statusColors = {
  success: "#059669",
  warning: "#d97706",
  error: "#dc2626",
  info: "#0284c7",
  neutral: "#64748b",
};

// Ordered categorical palette for multi-series charts (brand-led, colour-blind-safer).
export const chartPalette = ["#0066cc", "#0ea5e9", "#059669", "#d97706", "#7c3aed", "#64748b"];

// 8 distinguishable series colours (category donut). Never the only signal — always paired with labels/values.
export const categoryPalette = ["#0066cc", "#0ea5e9", "#059669", "#d97706", "#7c3aed", "#db2777", "#0d9488", "#64748b"];

export const chartGrid = "#e2e8f0";
export const chartAxis = "#5f6f85";
