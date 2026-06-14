export function BrandMark({
  size = 36,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={className}
      aria-label="MarketingOS"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, var(--c-brand) 0%, var(--c-violet) 55%, var(--c-purple) 100%)",
        boxShadow:
          "0 6px 16px -6px rgba(99,102,241,0.6), inset 0 0 0 1px rgba(255,255,255,0.2)",
        color: "#fff",
        fontWeight: 800,
        fontFamily: "var(--font-display, 'Plus Jakarta Sans', system-ui, sans-serif)",
        fontSize: size * 0.54,
        lineHeight: 1,
        letterSpacing: "-0.04em",
        flexShrink: 0,
      }}
    >
      M
    </div>
  );
}

export function BrandWordmark({
  className,
  accentStyle,
  baseStyle,
}: {
  className?: string;
  accentStyle?: React.CSSProperties;
  baseStyle?: React.CSSProperties;
}) {
  return (
    <span className={className}>
      <span
        style={{
          background: "linear-gradient(90deg, var(--c-violet), var(--c-purple))",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          ...accentStyle,
        }}
      >
        MarketingOS
      </span>
      <span style={baseStyle}> Command Center</span>
    </span>
  );
}
