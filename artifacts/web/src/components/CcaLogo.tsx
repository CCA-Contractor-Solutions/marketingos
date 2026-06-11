export function CcaLogo({
  size = 36,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="cca-shield-grad"
          x1="0"
          y1="0"
          x2="48"
          y2="48"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#3b82f6" />
          <stop offset="0.55" stopColor="#2563eb" />
          <stop offset="1" stopColor="#1e3a8a" />
        </linearGradient>
      </defs>
      <path
        d="M24 3 L42 9 V24 C42 35 33 42 24 45 C15 42 6 35 6 24 V9 Z"
        fill="url(#cca-shield-grad)"
      />
      <path d="M13 20 L24 12.5 L35 20 Z" fill="#ffffff" />
      <rect x="12.5" y="20.5" width="23" height="2.4" rx="0.6" fill="#ffffff" />
      <rect x="14.5" y="23.4" width="2.2" height="8" rx="0.5" fill="#ffffff" />
      <rect x="19.4" y="23.4" width="2.2" height="8" rx="0.5" fill="#ffffff" />
      <rect x="24.3" y="23.4" width="2.2" height="8" rx="0.5" fill="#ffffff" />
      <rect x="29.2" y="23.4" width="2.2" height="8" rx="0.5" fill="#ffffff" />
      <rect x="12.5" y="31.6" width="23" height="2.4" rx="0.6" fill="#ffffff" />
    </svg>
  );
}
