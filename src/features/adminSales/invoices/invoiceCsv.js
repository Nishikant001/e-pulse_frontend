import { formatDate } from "../../../utils/format";

// Spreadsheet formula-injection guard: cells beginning with = + - @ (or tab / CR) are prefixed with an apostrophe.
const cell = (v) => {
  if (v === null || v === undefined) return "";
  let s = String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const row = (cols) => cols.map(cell).join(",");

/** Build a CSV export of one invoice (header, product lines with batch details, totals). Pure — values come from the API. */
export function invoiceToCsv({ invoice, lines, totals }) {
  const out = [
    row(["Invoice", invoice.invoiceNumber]),
    row(["Invoice date", formatDate(invoice.invoiceDate)]),
    row(["Status", invoice.rawStatus]),
    row(["Company", invoice.company.name]),
    row(["Company GSTIN", invoice.company.gstin]),
    row(["Retailer", invoice.retailerDetails.name]),
    row(["Retailer GSTIN", invoice.retailerDetails.gstin]),
    row(["Payment terms", invoice.paymentTerms]),
    "",
    row(["Product", "SKU", "HSN", "Batch", "MFG", "Expiry", "Qty", "MRP", "Dealer price", "Discount", "GST %", "Tax", "Net amount"]),
  ];
  lines.forEach((l) => {
    const b = l.batches.length ? l.batches : [null];
    out.push(row([
      l.product, l.sku, l.hsn,
      b.map((x) => (x ? `${x.batchNo} (${x.quantity})` : "")).join("; "),
      b.map((x) => (x ? formatDate(x.mfgDate) : "")).join("; "),
      b.map((x) => (x ? formatDate(x.expDate) : "")).join("; "),
      l.quantity, l.mrp === null ? "" : l.mrp, l.dealerPrice, l.discountAmount, l.gstRate, l.tax, l.net,
    ]));
  });
  out.push("", row(["Gross amount", totals.grossAmount]), row(["Discount", totals.discount]), row(["Taxable amount", totals.taxable]), row(["CGST", totals.cgst]), row(["SGST", totals.sgst]), row(["IGST", totals.igst]), row(["Round off", totals.roundOff]), row(["Grand total", totals.grandTotal]));
  return out.join("\r\n");
}

export function downloadTextFile(filename, text, type = "text/csv;charset=utf-8") {
  const blob = new Blob(["\uFEFF", text], { type }); // BOM so Excel reads UTF-8 (₹, dashes)
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
