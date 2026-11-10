import React, { useEffect, useState } from "react";
import { Calculator } from "lucide-react";
import Alert from "../../../ui/Alert";
import Card from "../../../ui/Card";
import PageHeader from "../../../ui/PageHeader";
import DataTable from "../../../tables/DataTable";
import { formatINR } from "../../../../utils/format";
import { authFetch } from "../../../../utils/authFetch";

function TrialBalance() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTrialBalance();
  }, []);

  const fetchTrialBalance = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await authFetch("/trial-balance");

      // Backend now returns { accounts: {...}, total_debit, total_credit, balanced }
      const formattedRows = Object.entries(data?.accounts || {}).map(
        ([accountName, values]) => ({
          accountName,
          glType: values.gl_type,
          debit: Number(values.debit || 0),
          credit: Number(values.credit || 0),
        })
      );

      setRows(formattedRows);
    } catch (err) {
      console.error("Error fetching trial balance:", err);
      setError(err.message || "Failed to load trial balance");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const totalDebit = rows.reduce((sum, r) => sum + r.debit, 0);
  const totalCredit = rows.reduce((sum, r) => sum + r.credit, 0);
  const difference = Math.abs(totalDebit - totalCredit);

  const balanced = difference < 0.01;
  const columns = [
    { key: "accountName", header: "Account name", sortable: true },
    { key: "debit", header: "Debit", sortable: true, align: "right", render: (v) => <span className="tabular-nums text-success-700">{formatINR(v)}</span> },
    { key: "credit", header: "Credit", sortable: true, align: "right", render: (v) => <span className="tabular-nums text-error-700">{formatINR(v)}</span> },
  ];

  return (
    <div>
      <PageHeader title="Trial Balance" description="Debit and credit totals per ledger account." />

      {error ? (
        <Alert tone="error" className="mb-4" onClose={() => setError("")}>
          {error}
        </Alert>
      ) : null}

      <Card>
        <DataTable bare rowKey="accountName" caption="Trial balance" columns={columns} data={rows} loading={loading} pagination={false} emptyIcon={Calculator} emptyTitle="No trial balance data found" />
        {!loading && rows.length > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-surface-muted px-4 py-3 text-body">
            <span className="font-semibold text-ink">Total</span>
            <span className="flex flex-wrap gap-x-8 gap-y-1 tabular-nums">
              <span>Debit <strong className="text-success-700">{formatINR(totalDebit)}</strong></span>
              <span>Credit <strong className="text-error-700">{formatINR(totalCredit)}</strong></span>
            </span>
          </div>
        ) : null}
      </Card>

      {!loading && rows.length > 0 ? (
        <Alert tone={balanced ? "success" : "warning"} className="mt-4">
          {balanced ? "Trial balance is balanced." : `Difference: ${formatINR(difference)}`}
        </Alert>
      ) : null}
    </div>
  );
}

export default TrialBalance;
