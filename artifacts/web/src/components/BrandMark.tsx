const CREST_SRC = `${import.meta.env.BASE_URL}brand/crest.png`;

export function BrandMark({
  size = 36,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <img
      src={CREST_SRC}
      alt="MarketingOS"
      width={size}
      height={size}
      className={className}
      style={{
        width: size,
        height: size,
        objectFit: "contain",
        display: "block",
        flexShrink: 0,
      }}
    />
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
