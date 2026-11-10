import React, { useEffect, useState } from "react";
import { Banknote, Landmark, Scale } from "lucide-react";
import Alert from "../../../ui/Alert";
import Card, { CardBody, CardHeader } from "../../../ui/Card";
import KpiCard from "../../../ui/KpiCard";
import PageHeader from "../../../ui/PageHeader";
import { formatINR } from "../../../../utils/format";
import { authFetch } from "../../../../utils/authFetch";

function BalanceSheet() {
  const [data, setData] = useState({
    assets: 0,
    liabilities: 0,
    equity: 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBalanceSheet = async () => {
      setLoading(true);
      setError("");

      try {
        const result = await authFetch("/balance-sheet");
        setData({
          assets: result.assets || 0,
          liabilities: result.liabilities || 0,
          equity: result.equity || 0,
        });
      } catch (err) {
        console.error("Error fetching balance sheet:", err);
        setError(err.message || "Failed to load balance sheet");
      } finally {
        setLoading(false);
      }
    };

    fetchBalanceSheet();
  }, []);

  return (
    <div>
      <PageHeader title="Balance Sheet" description="Assets, liabilities and equity for your business." />

      {error ? (
        <Alert tone="error" title="Unable to load the balance sheet">
          {error}
        </Alert>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <KpiCard title="Total assets" icon={Landmark} status="success" loading={loading} value={formatINR(data.assets)} />
            <KpiCard title="Total liabilities" icon={Banknote} status="error" loading={loading} value={formatINR(data.liabilities)} />
            <KpiCard title="Equity" icon={Scale} status={Number(data.equity) >= 0 ? "brand" : "error"} loading={loading} value={formatINR(data.equity)} />
          </div>
          <Card>
            <CardHeader title="Accounting equation" />
            <CardBody>
              <p className="text-body text-ink-muted">Assets = Liabilities + Equity</p>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}

export default BalanceSheet;
