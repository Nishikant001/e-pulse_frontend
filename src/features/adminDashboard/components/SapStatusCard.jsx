import { Plug } from "lucide-react";
import Badge from "../../../components/ui/Badge";
import Card, { CardBody, CardHeader } from "../../../components/ui/Card";
import Skeleton from "../../../components/ui/Skeleton";
import StatusBadge from "../../../components/ui/StatusBadge";
import SapStatusIndicator from "../../../components/layout/SapStatusIndicator";
import { formatNumber } from "../../../utils/format";
import { erpCardModel, formatRelative } from "../dashboardModel";

const COPY = {
  not_configured: "The SAP integration has not been set up for this environment, so nothing is being synchronised. Synchronisation statistics will appear here once it is enabled.",
  connected: "The SAP connection is healthy.",
  degraded: "SAP is reachable but some jobs are failing.",
  disconnected: "SAP cannot be reached.",
};

/**
 * SapStatusCard — ERP integration status. Live data shows the REAL ERP state from the backend (Phase 21: erpCardModel); the Sample-data view keeps its
 * labelled illustration. No credentials or URLs ever appear here.
 */
export default function SapStatusCard({ data, loading }) {
  const status = data?.sap.status || "not_configured";
  const stats = data?.sap.stats;
  const live = data?.sap.erp ? erpCardModel(data.sap.erp) : null; // real figures (live data); the sample view keeps its labelled illustration

  return (
    <Card className="min-w-0">
      <CardHeader title="ERP integration" subtitle="Integration status" icon={Plug} actions={stats ? <Badge tone="info" size="sm">Sample data</Badge> : null} />
      <CardBody>
        {loading || !data ? (
          <div role="status" aria-label="Loading SAP status" className="space-y-3">
            <Skeleton className="h-8 w-44" rounded="rounded-full" />
            <Skeleton className="h-16" />
          </div>
        ) : (
          live ? (
            <>
              <Badge tone={live.tone} size="md" dot>{live.label}</Badge>
              <p className="mt-3 text-table text-ink-muted">{live.message}</p>
              {live.rows.length ? (
                <dl className="mt-4 grid grid-cols-2 gap-3 rounded-card bg-surface-muted p-4">
                  {live.rows.map((r) => (
                    <div key={r.label}>
                      <dt className="text-caption text-ink-subtle">{r.label}</dt>
                      <dd className="text-card-title font-semibold tabular-nums text-ink">{typeof r.value === "number" ? formatNumber(r.value) : r.value}</dd>
                    </div>
                  ))}
                  {data.sap.erp.lastSuccessfulSync ? <div className="col-span-2 text-caption text-ink-subtle">Last successful sync {formatRelative(data.sap.erp.lastSuccessfulSync.at)}</div> : null}
                </dl>
              ) : null}
            </>
          ) : (
          <>
            <SapStatusIndicator status={status} />
            <p className="mt-3 text-table text-ink-muted">{COPY[status] || COPY.not_configured}</p>
            {stats ? (
              <dl className="mt-4 grid grid-cols-3 gap-3 rounded-card bg-surface-muted p-4">
                <div>
                  <dt className="text-caption text-ink-subtle">Synced</dt>
                  <dd className="text-card-title font-semibold tabular-nums text-ink">{formatNumber(stats.documentsSynced)}</dd>
                </div>
                <div>
                  <dt className="text-caption text-ink-subtle">Pending</dt>
                  <dd className="text-card-title font-semibold tabular-nums text-ink">{formatNumber(stats.pending)}</dd>
                </div>
                <div>
                  <dt className="text-caption text-ink-subtle">Failed</dt>
                  <dd className="flex items-center gap-2 text-card-title font-semibold tabular-nums text-ink">
                    {formatNumber(stats.failed)}
                    {stats.failed > 0 ? <StatusBadge status="failed" domain="sap" size="sm" /> : null}
                  </dd>
                </div>
                <div className="col-span-3 text-caption text-ink-subtle">Illustrative figures · last sync {formatRelative(stats.lastSyncAt)}</div>
              </dl>
            ) : null}
          </>
          )
        )}
      </CardBody>
    </Card>
  );
}
