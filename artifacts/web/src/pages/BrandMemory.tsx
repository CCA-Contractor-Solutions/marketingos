import { AppLayout } from "@/components/AppLayout";
import { BookMarked, Sparkles } from "lucide-react";

export default function BrandMemory() {
  return (
    <AppLayout
      active="brand"
      title="Brand Memory"
      subtitle="Voice, guardrails, and shared brand context"
    >
      <div className="flex h-full items-center justify-center p-10">
        <div
          className="max-w-md rounded-2xl p-8 text-center"
          style={{
            background: "var(--c-surface)",
            border: "1px solid var(--c-border)",
            boxShadow: "var(--c-shadow-sm)",
          }}
        >
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-white"
            style={{
              background: "linear-gradient(135deg, var(--c-brand), var(--c-violet))",
              boxShadow: "0 10px 22px -10px rgba(37,99,235,0.7)",
            }}
          >
            <BookMarked size={26} />
          </div>
          <h2 className="font-display mt-5 text-[18px] font-bold">Brand Memory</h2>
          <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: "var(--c-muted)" }}>
            Your brand voice, tone guardrails, and reusable messaging will live here so
            MarketingOS AI stays on-brand across every campaign.
          </p>
          <div
            className="mt-5 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[12px] font-semibold"
            style={{ background: "var(--c-brand-50)", color: "var(--c-brand-600)" }}
          >
            <Sparkles size={14} /> Coming soon
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
