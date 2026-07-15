// Phase 4.5 — shared confidence-band pill used across the AI feed
// (Opportunities, IntelligenceDashboard) and attribution rows (LeadDetail).
// Color-coded High/Medium/Low with an optional "why" tooltip sourced from
// `dataBasis.rationale` + `dataSources` (recommendations) or a plain
// `reason` string (attribution rows).
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import type { ConfidenceBand } from "@/lib/intel-types";

const BAND_LABEL: Record<ConfidenceBand, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

const BAND_COLOR: Record<ConfidenceBand, { fg: string; bg: string }> = {
  high: { fg: "var(--c-emerald)", bg: "color-mix(in srgb, var(--c-emerald) 14%, transparent)" },
  medium: { fg: "var(--c-amber)", bg: "color-mix(in srgb, var(--c-amber) 14%, transparent)" },
  low: { fg: "var(--c-rose)", bg: "color-mix(in srgb, var(--c-rose) 14%, transparent)" },
};

export function ConfidenceBandPill({
  band,
  why,
}: {
  band: ConfidenceBand;
  /** Optional "why" explanation shown in a tooltip (rationale / reason). */
  why?: string;
}) {
  const color = BAND_COLOR[band] ?? BAND_COLOR.low;
  const pill = (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide"
      style={{ color: color.fg, background: color.bg }}
    >
      {BAND_LABEL[band] ?? "Low"} confidence
      {why ? <Info size={11} /> : null}
    </span>
  );

  if (!why) return pill;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-help">{pill}</span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-[12px] leading-snug">{why}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/** Builds the tooltip body from a recommendation's `dataBasis` + sources. */
export function dataBasisWhy(dataBasis: Record<string, unknown> | undefined, dataSources?: string[]): string {
  const rationale = typeof dataBasis?.["rationale"] === "string" ? (dataBasis["rationale"] as string) : undefined;
  const sources = dataSources && dataSources.length > 0 ? `Sources: ${dataSources.join(", ")}.` : "";
  return [rationale, sources].filter(Boolean).join(" ");
}
