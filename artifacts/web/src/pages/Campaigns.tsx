import { useState } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListCampaigns,
  useCreateCampaign,
  getListCampaignsQueryKey,
} from "@workspace/api-client-react";
import { AppLayout, PageLoading, PageError } from "@/components/AppLayout";
import { fmtMoney } from "@/lib/format";
import { ArrowUpRight, Plus, X } from "lucide-react";

const CHANNEL_OPTIONS = [
  "Instagram",
  "TikTok",
  "YouTube",
  "Email",
  "Paid Search",
  "LinkedIn",
];

function NewCampaignModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [owner, setOwner] = useState("");
  const [budgetTotal, setBudgetTotal] = useState("");
  const [channels, setChannels] = useState<string[]>([]);

  const createCampaign = useCreateCampaign({
    mutation: { onSuccess: onCreated },
  });

  const canSubmit =
    name.trim().length > 0 && owner.trim().length > 0 && !createCampaign.isPending;

  const toggleChannel = (ch: string) =>
    setChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch],
    );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    const budget = parseInt(budgetTotal, 10);
    createCampaign.mutate({
      data: {
        name: name.trim(),
        owner: owner.trim(),
        subtitle: subtitle.trim() || undefined,
        budgetTotal: Number.isFinite(budget) && budget >= 0 ? budget : undefined,
        channels: channels.length > 0 ? channels : undefined,
      },
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,15,30,0.45)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl p-6 cadence-rise"
        style={{
          background: "var(--c-surface)",
          border: "1px solid var(--c-border)",
          boxShadow: "var(--c-shadow-lg, 0 24px 48px -12px rgba(0,0,0,0.25))",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <div className="font-display text-[18px] font-bold">New campaign</div>
            <div className="mt-0.5 text-[12.5px]" style={{ color: "var(--c-muted)" }}>
              Spin up a new marketing initiative
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-black/5"
            style={{ color: "var(--c-muted)" }}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[12.5px] font-semibold" style={{ color: "var(--c-ink-soft)" }}>
              Campaign name
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Aurora Launch"
              className="w-full rounded-xl px-3.5 py-2.5 text-[13.5px] outline-none transition-colors focus:border-[var(--c-brand)]"
              style={{ background: "var(--c-bg)", border: "1px solid var(--c-border)", color: "var(--c-ink)" }}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[12.5px] font-semibold" style={{ color: "var(--c-ink-soft)" }}>
              Tagline <span style={{ color: "var(--c-muted)" }}>(optional)</span>
            </label>
            <input
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Q3 product launch across social"
              className="w-full rounded-xl px-3.5 py-2.5 text-[13.5px] outline-none transition-colors focus:border-[var(--c-brand)]"
              style={{ background: "var(--c-bg)", border: "1px solid var(--c-border)", color: "var(--c-ink)" }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-[12.5px] font-semibold" style={{ color: "var(--c-ink-soft)" }}>
                Owner
              </label>
              <input
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="Maya Chen"
                className="w-full rounded-xl px-3.5 py-2.5 text-[13.5px] outline-none transition-colors focus:border-[var(--c-brand)]"
                style={{ background: "var(--c-bg)", border: "1px solid var(--c-border)", color: "var(--c-ink)" }}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[12.5px] font-semibold" style={{ color: "var(--c-ink-soft)" }}>
                Budget <span style={{ color: "var(--c-muted)" }}>(optional)</span>
              </label>
              <input
                value={budgetTotal}
                onChange={(e) => setBudgetTotal(e.target.value.replace(/[^0-9]/g, ""))}
                inputMode="numeric"
                placeholder="50000"
                className="w-full rounded-xl px-3.5 py-2.5 text-[13.5px] outline-none transition-colors focus:border-[var(--c-brand)]"
                style={{ background: "var(--c-bg)", border: "1px solid var(--c-border)", color: "var(--c-ink)" }}
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[12.5px] font-semibold" style={{ color: "var(--c-ink-soft)" }}>
              Channels <span style={{ color: "var(--c-muted)" }}>(optional)</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CHANNEL_OPTIONS.map((ch) => {
                const active = channels.includes(ch);
                return (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => toggleChannel(ch)}
                    className="rounded-lg px-2.5 py-1.5 text-[12px] font-semibold transition-all"
                    style={{
                      background: active ? "var(--c-brand)" : "var(--c-bg)",
                      color: active ? "#fff" : "var(--c-ink-soft)",
                      border: `1px solid ${active ? "var(--c-brand)" : "var(--c-border)"}`,
                    }}
                  >
                    {ch}
                  </button>
                );
              })}
            </div>
          </div>

          {createCampaign.isError && (
            <div className="text-[12.5px] font-medium" style={{ color: "var(--c-rose)" }}>
              Could not create the campaign. Please try again.
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-[13px] font-semibold transition-colors hover:bg-black/5"
              style={{ color: "var(--c-ink-soft)", border: "1px solid var(--c-border)" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg,var(--c-brand),var(--c-violet))",
                boxShadow: "0 8px 18px -8px rgba(79,70,229,0.8)",
              }}
            >
              <Plus size={16} />
              {createCampaign.isPending ? "Creating…" : "Create campaign"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Campaigns() {
  const { data, isLoading, isError } = useListCampaigns();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);

  const handleCreated = () => {
    queryClient.invalidateQueries({ queryKey: getListCampaignsQueryKey() });
    setShowModal(false);
  };

  return (
    <AppLayout
      active="campaigns"
      title="Campaigns"
      subtitle="All active and upcoming marketing initiatives"
      actions={
        <button
          onClick={() => setShowModal(true)}
          className="flex h-9 items-center gap-2 rounded-xl px-3.5 text-[13px] font-semibold text-white transition-all hover:opacity-90"
          style={{
            background: "linear-gradient(135deg,var(--c-brand),var(--c-violet))",
            boxShadow: "0 8px 18px -8px rgba(79,70,229,0.8)",
          }}
        >
          <Plus size={16} /> New campaign
        </button>
      }
    >
      {isLoading ? (
        <PageLoading />
      ) : isError ? (
        <PageError />
      ) : (
        <div className="p-6 max-w-6xl mx-auto pb-20">
          <div
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 cadence-rise"
            style={{ animationDelay: "40ms" }}
          >
            {(Array.isArray(data) ? data : []).map((c) => (
              <Link
                key={c.id}
                href={`/campaigns/${c.id}`}
                className="group rounded-2xl p-5 transition-all hover:-translate-y-0.5"
                style={{
                  background: "var(--c-surface)",
                  border: "1px solid var(--c-border)",
                  boxShadow: "var(--c-shadow-sm)",
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-xl text-[13px] font-bold text-white"
                      style={{
                        background:
                          c.ownerColor ?? "linear-gradient(135deg,#16a34a,#166534)",
                      }}
                    >
                      {c.owner
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <div>
                      <div className="font-display text-[15px] font-bold leading-tight">
                        {c.name}
                      </div>
                      <div className="mt-0.5 text-[12px]" style={{ color: "var(--c-muted)" }}>
                        {c.owner}
                      </div>
                    </div>
                  </div>
                  <span
                    className="shrink-0 rounded-md px-2 py-0.5 text-[10.5px] font-semibold"
                    style={{ background: `${c.statusColor}1a`, color: c.statusColor }}
                  >
                    {c.status}
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--c-bg)]">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${c.progress}%`,
                        background:
                          "linear-gradient(90deg,var(--c-brand),var(--c-violet))",
                      }}
                    />
                  </div>
                  <span
                    className="text-[11.5px] font-semibold"
                    style={{ color: "var(--c-ink-soft)" }}
                  >
                    {c.progress}%
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex flex-wrap gap-1.5">
                    {c.channels.map((ch) => (
                      <span
                        key={ch}
                        className="rounded-md px-1.5 py-0.5 text-[10.5px] font-medium"
                        style={{ background: "var(--c-bg)", color: "var(--c-ink-soft)" }}
                      >
                        {ch}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 text-right">
                    <div>
                      <div className="text-[13px] font-semibold">
                        {fmtMoney(c.budgetSpent)}
                        <span style={{ color: "var(--c-muted)" }}>
                          {" "}
                          / {fmtMoney(c.budgetTotal)}
                        </span>
                      </div>
                    </div>
                    <ArrowUpRight
                      size={16}
                      className="opacity-0 transition-opacity group-hover:opacity-100"
                      style={{ color: "var(--c-brand)" }}
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {showModal && (
        <NewCampaignModal onClose={() => setShowModal(false)} onCreated={handleCreated} />
      )}
    </AppLayout>
  );
}
