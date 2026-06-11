import { AppLayout } from "./_shared/AppLayout";
import { BookMarked } from "lucide-react";

export function BrandMemory() {
  return (
    <AppLayout
      active="brand"
      title="Brand Memory"
      subtitle="Your single source of brand truth"
    >
      <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-6 text-center">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-2xl text-white"
          style={{
            background: "linear-gradient(135deg, var(--c-brand), var(--c-violet))",
            boxShadow: "0 12px 24px -8px rgba(79,70,229,0.35)",
          }}
        >
          <BookMarked size={28} />
        </div>
        <h2 className="font-display mt-6 text-[22px] font-bold">
          Brand Memory is coming soon
        </h2>
        <p
          className="mt-2 text-[14px] leading-relaxed"
          style={{ color: "var(--c-ink-soft)" }}
        >
          Voice, tone, visual guidelines, and approved messaging will live here so
          Cadence AI can keep every campaign on-brand.
        </p>
      </div>
    </AppLayout>
  );
}
