// Phase 4 — Integration Management Center. Route: /integrations
import { useMemo, useState } from "react";
import {
  Plug,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Circle,
  ShieldCheck,
} from "lucide-react";
import { AppLayout, PageLoading, PageError } from "@/components/AppLayout";
import {
  useIntegrations,
  useConnectIntegration,
  useSyncIntegration,
  useIntegrationSyncJobs,
  useIntegrationErrors,
  useUpdateIntegrationStatus,
} from "@/hooks/useIntel";
import { useRole } from "@/lib/roles";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import type { Integration } from "@/lib/intel-types";

const STATUS_META: Record<
  Integration["status"],
  { label: string; icon: typeof CheckCircle2; color: string }
> = {
  connected: { label: "Connected", icon: CheckCircle2, color: "var(--c-success, #16a34a)" },
  available: { label: "Available", icon: Circle, color: "var(--c-muted)" },
  error: { label: "Error", icon: XCircle, color: "var(--c-danger, #dc2626)" },
  disabled: { label: "Disabled", icon: Circle, color: "var(--c-muted)" },
};

const CATEGORY_LABEL: Record<Integration["category"], string> = {
  advertising: "Advertising",
  analytics: "Analytics",
  communication: "Communication",
  email: "Email",
  automation: "Automation",
};

function formatDate(iso: string | null): string {
  if (!iso) return "Never";
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: Integration["status"] }) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  return (
    <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium" style={{ color: meta.color }}>
      <Icon size={14} />
      {meta.label}
    </span>
  );
}

function IntegrationDetail({ integration, onClose }: { integration: Integration; onClose: () => void }) {
  const { data: syncJobs } = useIntegrationSyncJobs(integration.id);
  const { data: errors } = useIntegrationErrors(integration.id);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{integration.displayName}</DialogTitle>
          <DialogDescription>
            {CATEGORY_LABEL[integration.category]} · provider key <code>{integration.providerKey}</code>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-[13px]">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wide" style={{ color: "var(--c-muted)" }}>
                Auth method
              </div>
              <div style={{ color: "var(--c-ink)" }}>{integration.authMethod}</div>
            </div>
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wide" style={{ color: "var(--c-muted)" }}>
                Sync frequency
              </div>
              <div style={{ color: "var(--c-ink)" }}>{integration.defaultSyncFrequency}</div>
            </div>
          </div>

          <div>
            <div className="text-[11px] font-medium uppercase tracking-wide" style={{ color: "var(--c-muted)" }}>
              Required credential references
            </div>
            {integration.requiredCredentials.length === 0 ? (
              <div style={{ color: "var(--c-muted)" }}>None</div>
            ) : (
              <div className="mt-1 flex flex-wrap gap-1.5">
                {integration.requiredCredentials.map((ref) => (
                  <Badge key={ref} variant="outline" className="text-[11px] font-mono">
                    {ref}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="text-[11px] font-medium uppercase tracking-wide" style={{ color: "var(--c-muted)" }}>
              Data types available
            </div>
            {integration.dataAvailable.length === 0 ? (
              <div style={{ color: "var(--c-muted)" }}>None yet</div>
            ) : (
              <div className="mt-1 flex flex-wrap gap-1.5">
                {integration.dataAvailable.map((d) => (
                  <Badge key={d} variant="secondary" className="text-[11px]">
                    {d}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="mb-1 text-[11px] font-medium uppercase tracking-wide" style={{ color: "var(--c-muted)" }}>
              Recent sync jobs
            </div>
            {!syncJobs || syncJobs.length === 0 ? (
              <div style={{ color: "var(--c-muted)" }}>No sync jobs yet.</div>
            ) : (
              <ul className="space-y-1">
                {syncJobs.slice(0, 5).map((job) => (
                  <li key={job.id} className="flex items-center justify-between gap-2">
                    <span style={{ color: "var(--c-ink-soft)" }}>{formatDate(job.startedAt)}</span>
                    <span className="flex items-center gap-1">
                      <Badge variant={job.status === "error" ? "destructive" : "outline"} className="text-[10px]">
                        {job.status}
                      </Badge>
                      <span style={{ color: "var(--c-muted)" }}>{job.recordsProcessed} records</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {errors && errors.length > 0 && (
            <div>
              <div className="mb-1 text-[11px] font-medium uppercase tracking-wide" style={{ color: "var(--c-danger, #dc2626)" }}>
                Recent errors
              </div>
              <ul className="space-y-1">
                {errors.slice(0, 5).map((err, i) => (
                  <li key={i} className="text-[12px]" style={{ color: "var(--c-ink-soft)" }}>
                    {err.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ConnectDialog({ integration, onClose }: { integration: Integration; onClose: () => void }) {
  const connectMutation = useConnectIntegration(integration.id);
  const [refs, setRefs] = useState<Record<string, string>>(() =>
    Object.fromEntries(integration.requiredCredentials.map((r) => [r, integration.credentialsReference === r ? r : ""])),
  );

  const handleConnect = () => {
    // We only ever send the reference NAME for the first required credential
    // (or the provider key itself if none are required) — never a secret
    // value. Real secret resolution happens server-side via process.env.
    const primary = integration.requiredCredentials[0];
    const credentialsReference = primary ? refs[primary] || primary : null;
    connectMutation.mutate({ credentialsReference }, { onSuccess: onClose });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Connect {integration.displayName}</DialogTitle>
          <DialogDescription>
            Enter the credential <strong>reference name</strong> (e.g. an environment variable or vault key) —
            never the actual secret value.
          </DialogDescription>
        </DialogHeader>

        <div
          className="flex items-start gap-2 rounded-xl p-3 text-[12.5px]"
          style={{ background: "var(--c-surface-2, #f5f5f4)", border: "1px solid var(--c-border)" }}
        >
          <ShieldCheck size={16} style={{ color: "var(--c-brand)" }} className="mt-0.5 flex-shrink-0" />
          <span style={{ color: "var(--c-ink-soft)" }}>
            We store references only. Secret values are resolved server-side from environment variables and are
            never logged or persisted in this app.
          </span>
        </div>

        {integration.requiredCredentials.length === 0 ? (
          <p className="text-[13px]" style={{ color: "var(--c-muted)" }}>
            This connector does not require any credentials.
          </p>
        ) : (
          <div className="space-y-3">
            {integration.requiredCredentials.map((ref) => (
              <div key={ref} className="space-y-1">
                <Label htmlFor={ref} className="font-mono text-[12px]">
                  {ref}
                </Label>
                <Input
                  id={ref}
                  placeholder={ref}
                  value={refs[ref] ?? ""}
                  onChange={(e) => setRefs((prev) => ({ ...prev, [ref]: e.target.value }))}
                />
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConnect} disabled={connectMutation.isPending}>
            {connectMutation.isPending ? "Connecting…" : "Connect"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function IntegrationRow({ integration, index }: { integration: Integration; index: number }) {
  const { capabilities } = useRole();
  const syncMutation = useSyncIntegration(integration.id);
  const statusMutation = useUpdateIntegrationStatus(integration.id);
  const [detailOpen, setDetailOpen] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);

  const canManage = capabilities.canEditCampaignStrategy;

  return (
    <div
      className="cadence-rise flex flex-col gap-3 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between"
      style={{
        background: "var(--c-surface)",
        border: "1px solid var(--c-border)",
        boxShadow: "var(--c-shadow-sm)",
        animationDelay: `${index * 40}ms`,
      }}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h4 className="text-[14.5px] font-semibold" style={{ color: "var(--c-ink)" }}>
            {integration.displayName}
          </h4>
          <Badge variant="outline" className="text-[10.5px]">
            {CATEGORY_LABEL[integration.category]}
          </Badge>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px]" style={{ color: "var(--c-muted)" }}>
          <StatusBadge status={integration.status} />
          <span>Last sync: {formatDate(integration.lastSyncedAt)}</span>
          <span>{integration.dataImported.toLocaleString()} records imported</span>
          {integration.errorCount > 0 && (
            <span className="inline-flex items-center gap-1" style={{ color: "var(--c-danger, #dc2626)" }}>
              <AlertTriangle size={12} />
              {integration.errorCount} error{integration.errorCount === 1 ? "" : "s"}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-shrink-0 items-center gap-2">
        <Button size="sm" variant="ghost" onClick={() => setDetailOpen(true)}>
          Details
        </Button>
        {canManage && integration.status !== "connected" && (
          <Button size="sm" variant="outline" onClick={() => setConnectOpen(true)}>
            <Plug size={13} />
            Connect
          </Button>
        )}
        {canManage && (
          <Button
            size="sm"
            variant="outline"
            disabled={syncMutation.isPending}
            onClick={() => syncMutation.mutate(true)}
          >
            <RefreshCw size={13} className={syncMutation.isPending ? "animate-spin" : ""} />
            {syncMutation.isPending ? "Syncing…" : "Sync now"}
          </Button>
        )}
        {canManage && integration.status !== "available" && (
          <div className="flex items-center gap-1.5 pl-1">
            <Switch
              checked={integration.status !== "disabled"}
              onCheckedChange={(checked) => statusMutation.mutate(checked ? "connected" : "disabled")}
            />
          </div>
        )}
      </div>

      {detailOpen && <IntegrationDetail integration={integration} onClose={() => setDetailOpen(false)} />}
      {connectOpen && <ConnectDialog integration={integration} onClose={() => setConnectOpen(false)} />}
    </div>
  );
}

export default function Integrations() {
  const { data, isLoading, isError } = useIntegrations();
  const integrations = data ?? [];

  const summary = useMemo(() => {
    return {
      connected: integrations.filter((i) => i.status === "connected").length,
      total: integrations.length,
      dataImported: integrations.reduce((sum, i) => sum + i.dataImported, 0),
      errors: integrations.reduce((sum, i) => sum + i.errorCount, 0),
    };
  }, [integrations]);

  return (
    <AppLayout
      active="integrations"
      title="Integration Management Center"
      subtitle="Growth Intelligence · External data sources feeding MarketingOS"
    >
      {isLoading ? (
        <PageLoading />
      ) : isError ? (
        <PageError />
      ) : (
        <div className="mx-auto max-w-7xl p-6 lg:p-8 space-y-6 pb-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Connected integrations", value: `${summary.connected} / ${summary.total}` },
              { label: "Records imported", value: summary.dataImported.toLocaleString() },
              { label: "Open errors", value: summary.errors.toLocaleString() },
              { label: "Providers available", value: String(integrations.length) },
            ].map((kpi, i) => (
              <div
                key={kpi.label}
                className="cadence-rise rounded-2xl p-5"
                style={{
                  background: "var(--c-surface)",
                  border: "1px solid var(--c-border)",
                  boxShadow: "var(--c-shadow-sm)",
                  animationDelay: `${i * 40}ms`,
                }}
              >
                <div className="text-[13px] font-medium" style={{ color: "var(--c-muted)" }}>
                  {kpi.label}
                </div>
                <div className="mt-2 font-display text-2xl font-bold" style={{ color: "var(--c-ink)" }}>
                  {kpi.value}
                </div>
              </div>
            ))}
          </div>

          <p className="text-[12.5px]" style={{ color: "var(--c-muted)" }}>
            MarketingOS never stores provider secrets. Connecting an integration records only a{" "}
            <strong>credential reference name</strong>; actual values are resolved server-side from environment
            variables at sync time.
          </p>

          <div className="space-y-3">
            {integrations.length === 0 ? (
              <div
                className="rounded-2xl p-6 text-center text-[13px]"
                style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", color: "var(--c-muted)" }}
              >
                No integrations configured yet.
              </div>
            ) : (
              integrations.map((integration, i) => (
                <IntegrationRow key={integration.id} integration={integration} index={i} />
              ))
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
