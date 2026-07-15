// MarketingOS brand mark — a rounded gradient tile with a white "M" whose
// right stroke rises into a growth-chart arrow. Inline SVG so it stays crisp at
// every size (favicon → hero) with no raster asset. The gradient runs blue →
// indigo → purple, matching the brand lockup.
let _brandGradientSeq = 0;

export function BrandMark({
  size = 36,
  className,
}: {
  size?: number;
  className?: string;
}) {
  // Unique gradient id per instance so multiple marks can render on one page.
  const gid = `mos-brand-${(_brandGradientSeq += 1)}`;
  const radius = 22; // corner radius on a 100x100 viewBox
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label="MarketingOS"
      style={{ flexShrink: 0, display: "inline-block" }}
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="52%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="100" height="100" rx={radius} fill={`url(#${gid})`} />
      {/* The "M": left leg, center dip, then the right stroke rising into an
          arrow — a growth trajectory. */}
      <path
        d="M26 74 L26 34 L50 58 L67 41 L67 74"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="9"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Rising arrow off the right stroke. */}
      <path
        d="M62 30 L76 30 L76 44"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="9"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path
        d="M67 41 L76 30"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="9"
        strokeLinecap="round"
      />
    </svg>
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
  // Matches the brand lockup: "Marketing" in the base ink color, "OS" in the
  // blue→purple gradient.
  return (
    <span className={className}>
      <span style={baseStyle}>Marketing</span>
      <span
        style={{
          background: "linear-gradient(90deg, #2563EB, #8B5CF6)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          ...accentStyle,
        }}
      >
        OS
      </span>
    </span>
  );
}
