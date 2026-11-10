import { formatPercent } from "../../../utils/format";

// changePct → { direction, value, sentiment } for KpiCard/TrendIndicator (null when there is nothing to compare with).
// `higherIsBad` flips the sentiment (e.g. more sales returns is a negative signal).
export function trendOf(changePct, { higherIsBad = false } = {}) {
  if (changePct === null || changePct === undefined) return undefined;
  const direction = changePct > 0 ? "up" : changePct < 0 ? "down" : "flat";
  let sentiment = direction === "up" ? "positive" : direction === "down" ? "negative" : "neutral";
  if (higherIsBad && direction !== "flat") sentiment = direction === "up" ? "negative" : "positive";
  return { direction, value: formatPercent(changePct), sentiment };
}
