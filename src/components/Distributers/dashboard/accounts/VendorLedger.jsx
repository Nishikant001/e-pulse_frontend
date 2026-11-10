import React, { useState } from "react";
import { Factory } from "lucide-react";
import { authFetch } from "../../../../utils/authFetch";

function VendorLedger() {
  const [rows, setRows] = useState([]);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [closingBalance, setClosingBalance] = useState(0);
  const [vendorId, setVendorId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchLedger = async () => {
    if (!vendorId) return;

    setLoading(true);
    setError("");

    try {
      const data = await authFetch(`/ledger/vendor/${vendorId}`);

      // Backend returns { opening_balance, entries, closing_balance } —
      // only Accounts Payable postings are included.
      setRows(Array.isArray(data?.entries) ? data.entries : []);
      setOpeningBalance(Number(data?.opening_balance || 0));
      setClosingBalance(Number(data?.closing_balance || 0));
    } catch (err) {
      console.error("Error fetching vendor ledger:", err);
      setError(err.message || "Failed to load vendor ledger");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const finalBalance = rows.length > 0 ? closingBalance : openingBalance;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold flex items-center gap-2 text-purple-700">
        <Factory /> Vendor Ledger
      </h1>

      {/* INPUT */}
      <div className="mt-4 flex gap-2">
        <input
          className="border p-2 rounded w-48"
          placeholder="Vendor Code (e.g. VEN001)"
          value={vendorId}
          onChange={(e) => setVendorId(e.target.value)}
        />
        <button
          onClick={fetchLedger}
          disabled={loading || !vendorId}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? "Loading..." : "Load"}
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <div className="mt-4 bg-red-100 border border-red-400 text-red-700 p-3 rounded">
          {error}
        </div>
      )}

      {/* BALANCE */}
      <div className="mt-6 text-xl font-semibold">
        Current Balance:{" "}
        <span
          className={
            finalBalance >= 0 ? "text-green-600" : "text-red-600"
          }
        >
          ₹{finalBalance.toFixed(2)}
        </span>
      </div>

      {/* TABLE */}
      <table className="w-full mt-6 shadow bg-white rounded-xl overflow-hidden">
        <thead className="bg-gray-100 text-gray-700">
          <tr>
            <th className="p-3 text-left">Date</th>
            <th className="p-3 text-left">Document</th>
            <th className="p-3 text-left">Reference</th>
            <th className="p-3 text-left">Narration</th>
            <th className="p-3 text-right">Debit</th>
            <th className="p-3 text-right">Credit</th>
            <th className="p-3 text-right">Balance</th>
          </tr>
        </thead>

        <tbody>
          {rows.length > 0 ? (
            rows.map((e, idx) => (
              <tr key={idx} className="border-b hover:bg-gray-50">
                <td className="p-3">
                  {e.date?.slice(0, 10) || "-"}
                </td>
                <td className="p-3 text-gray-600">{e.document || "-"}</td>
                <td className="p-3 text-gray-600">{e.reference ?? "-"}</td>
                <td className="p-3">{e.narration}</td>
                <td className="p-3 text-right text-green-600">
                  ₹{Number(e.debit || 0).toFixed(2)}
                </td>
                <td className="p-3 text-right text-red-600">
                  ₹{Number(e.credit || 0).toFixed(2)}
                </td>
                <td className="p-3 text-right font-semibold">
                  ₹{Number(e.balance || 0).toFixed(2)}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan="7"
                className="p-6 text-center text-gray-500"
              >
                No ledger entries found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default VendorLedger;
