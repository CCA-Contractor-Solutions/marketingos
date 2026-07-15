// Phase 4 -- Data sources strip. Additive summary of connected external
// integrations, shown on the Executive Dashboard above the existing tables.
// Links out to the full Integration Management Center (/integrations).
import { Link } from "wouter";
import { Plug, CheckCircle2, Circle, XCircle } from "lucide-react";
import type { Integration } from "@/lib/intel-types";

const STATUS_ICON: Record<Integration["status"], typeof CheckCircle2> = {
  connected: CheckCircle2,
  available: Circle,
  error: XCircle,
  disabled: Circle,
};

const STATUS_COLOR: Record<Integration["status"], string> = {
  connected: "var(--c-success, #16a34a)",
  available: "var(--c-muted)",
  error: "var(--c-danger, #dc2626)",
  disabled: "var(--c-muted)",
};

export function DataSourcesStrip({
  integrations,
  isLoading,
}: {
  integrations: Integration[];
  isLoading?: boolean;
}) {
  const connectedCount = integrations.filter((i) => i.status === "connected").length;
  const totalImported = integrations.reduce((sum, i) => sum + i.dataImported, 0);

  return (
    <div
      className="cadence-rise rounded-2xl p-5 lg:p-6"
      style={{
        background: "var(--c-surface)",
        border: "1px solid var(--c-border)",
        boxShadow: "var(--c-shadow-sm)",
        animationDelay: "180ms",
      }}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Plug size={16} style={{ color: "var(--c-brand)" }} />
          <h3 className="text-[15px] font-bold" style={{ color: "var(--c-ink)" }}>
            Data sources
          </h3>
          <span className="text-[12.5px]" style={{ color: "var(--c-muted)" }}>
            {connectedCount} connected &middot; {totalImported.toLocaleString()} records imported
          </span>
        </div>
        <Link href="/integrations" className="text-[12.5px] font-medium hover:underline" style={{ color: "var(--c-brand-600)" }}>
          Manage integrations
        </Link>
      </div>

      {isLoading ? (
        <div className="text-[13px]" style={{ color: "var(--c-muted)" }}>
          Loading data sources...
        </div>
      ) : integrations.length === 0 ? (
        <div className="text-[13px]" style={{ color: "var(--c-muted)" }}>
          No integrations configured yet.
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {integrations.map((integration) => {
            const Icon = STATUS_ICON[integration.status];
            return (
              <div
                key={integration.id}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px]"
                style={{ background: "var(--c-bg)", border: "1px solid var(--c-border)" }}
              >
                <Icon size={12} style={{ color: STATUS_COLOR[integration.status] }} />
                <span style={{ color: "var(--c-ink)" }}>{integration.displayName}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
