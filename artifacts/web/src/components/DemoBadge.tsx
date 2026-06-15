type DemoBadgeProps = {
  className?: string;
  label?: string;
};

/**
 * Honest indicator that the surrounding data is seeded/sample demo content,
 * not live production data. Used wherever the UI might otherwise imply the
 * figures are live.
 */
export function DemoBadge({ className = "", label = "Demo data" }: DemoBadgeProps) {
  return (
    <span
      title="This environment shows seeded sample data for demonstration. It is not live production data."
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${className}`}
      style={{
        background: "color-mix(in srgb, var(--c-amber) 14%, transparent)",
        color: "var(--c-amber)",
        border: "1px solid color-mix(in srgb, var(--c-amber) 35%, transparent)",
      }}
    >
      <span
        aria-hidden
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: "var(--c-amber)" }}
      />
      {label}
    </span>
  );
}
