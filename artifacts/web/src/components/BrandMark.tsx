export function BrandMark({
  size = 36,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={className}
      aria-label="MarketingOS"
      role="img"
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: size * 0.28,
        background: "linear-gradient(135deg, var(--c-violet), var(--c-purple))",
        color: "#fff",
        fontWeight: 800,
        fontSize: size * 0.56,
        lineHeight: 1,
        letterSpacing: "-0.04em",
        fontFamily:
          "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        userSelect: "none",
      }}
    >
      M
    </span>
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
