import ccaCrest from "@assets/cca-crest-400_1781250303124.png";

export function CcaLogo({
  size = 36,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <img
      src={ccaCrest}
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size, objectFit: "contain" }}
      alt="Contractor Compliance Authority"
      draggable={false}
    />
  );
}
