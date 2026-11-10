import React, { useState } from "react";
import { Search, Users } from "lucide-react";
import Alert from "../../../ui/Alert";
import Button from "../../../ui/Button";
import Card from "../../../ui/Card";
import Input from "../../../ui/Input";
import KpiCard from "../../../ui/KpiCard";
import PageHeader from "../../../ui/PageHeader";
import DataTable from "../../../tables/DataTable";
import { formatDate, formatINR } from "../../../../utils/format";
import { authFetch } from "../../../../utils/authFetch";

function CustomerLedger() {
  const [data, setData] = useState([]);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [closingBalance, setClosingBalance] = useState(0);
  const [customerId, setCustomerId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchLedger = async () => {
    if (!customerId) return;

    setLoading(true);
    setError("");

    try {
      const result = await authFetch(
        `/ledger/customer/${customerId}`
      );

      // Backend returns { opening_balance, entries, closing_balance } —
      // only Accounts Receivable postings are included (Sales/GST legs
      // that also reference the customer for traceability are excluded,
      // since they aren't part of the customer's actual balance).
      setData(Array.isArray(result?.entries) ? result.entries : []);
      setOpeningBalance(Number(result?.opening_balance || 0));
      setClosingBalance(Number(result?.closing_balance || 0));
    } catch (err) {
      console.error("Error fetching customer ledger:", err);
      setError(err.message || "Failed to load customer ledger");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const finalBalance = data.length > 0 ? closingBalance : openingBalance;

  const columns = [
    { key: "date", header: "Date", sortable: true, accessor: (e) => e.date?.slice(0, 10) || "", render: (v) => formatDate(v) },
    { key: "document", header: "Document", accessor: (e) => e.document || "-" },
    { key: "reference", header: "Reference", accessor: (e) => e.reference ?? "-" },
    { key: "narration", header: "Narration", accessor: (e) => e.narration || "-" },
    { key: "debit", header: "Debit", align: "right", accessor: (e) => Number(e.debit || 0), render: (v) => <span className="tabular-nums text-success-700">{formatINR(v)}</span> },
    { key: "credit", header: "Credit", align: "right", accessor: (e) => Number(e.credit || 0), render: (v) => <span className="tabular-nums text-error-700">{formatINR(v)}</span> },
    { key: "balance", header: "Balance", align: "right", accessor: (e) => Number(e.balance || 0), render: (v) => <span className="font-medium tabular-nums">{formatINR(v)}</span> },
  ];

  return (
    <div>
      <PageHeader title="Customer Ledger" description="Accounts receivable postings for a customer." />

      <form
        className="mb-4 flex flex-wrap items-end gap-3 rounded-card border border-line bg-surface p-3 shadow-card"
        onSubmit={(e) => {
          e.preventDefault();
          fetchLedger();
        }}
      >
        <Input label="Customer code" value={customerId} onChange={(e) => setCustomerId(e.target.value)} placeholder="e.g. CTR001" wrapperClassName="w-full sm:w-64" leftIcon={Users} />
        <Button type="submit" leftIcon={Search} loading={loading} disabled={!customerId}>
          Load ledger
        </Button>
      </form>

      {error ? (
        <Alert tone="error" className="mb-4" onClose={() => setError("")}>
          {error}
        </Alert>
      ) : null}

      <div className="mb-4 max-w-xs">
        <KpiCard title="Current balance" icon={Users} status={finalBalance >= 0 ? "success" : "error"} value={formatINR(finalBalance)} />
      </div>

      <Card>
        <DataTable bare rowKey="idx" caption="Customer ledger entries" columns={columns} data={data.map((e, idx) => ({ ...e, idx }))} loading={loading} emptyTitle="No ledger entries found" emptyDescription="Enter a customer code and load the ledger." />
      </Card>
    </div>
  );
}

export default CustomerLedger;
