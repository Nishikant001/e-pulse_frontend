// Pure helpers for the Purchase Order "vendor by code" lookup (Phase 22, D3).
//
// The old fallback called GET /vendor/by-code/:code, which has never existed on the server. The vendor list returned by the
// existing, authenticated and distributor-scoped GET /vendor is already complete for the logged-in distributor, so the lookup
// is done against that list. Nothing here widens access: a vendor that belongs to another distributor is never in the list.

export function normalizeVendorCode(code) {
  return String(code ?? "").trim().toLowerCase();
}

// The API serialises the model field as `vendor_code`; `vendorCode` / `code` are tolerated for older payload shapes.
export function vendorCodeOf(vendor) {
  return vendor?.vendor_code ?? vendor?.vendorCode ?? vendor?.code ?? "";
}

/** Returns the vendor whose code equals `code` (trimmed, case-insensitive) or null. Never throws. */
export function findVendorByCode(vendors, code) {
  const wanted = normalizeVendorCode(code);
  if (!wanted || !Array.isArray(vendors)) return null;
  return vendors.find((v) => normalizeVendorCode(vendorCodeOf(v)) === wanted) || null;
}
