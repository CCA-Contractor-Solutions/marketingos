// Phase 4.5 — audit trail viewer + "Record outcome" action for a single
// recommendation. Mirrors the Dialog pattern used by CreateActionDialog.tsx.
import { useState } from "react";
import { History, CheckCircle2, Sparkles, MousePointerClick, Ban, ClipboardCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRecommendationAudit, useRecordRecommendationOutcome } from "@/hooks/useIntel";
import type { Recommendation, RecommendationAuditEvent } from "@/lib/intel-types";

const EVENT_LABEL: Record<RecommendationAuditEvent, string> = {
  generated: "Generated",
  viewed: "Viewed",
  action_created: "Action created",
  dismissed: "Dismissed",
  outcome_recorded: "Outcome recorded",
};

const EVENT_ICON: Record<RecommendationAuditEvent, typeof Sparkles> = {
  generated: Sparkles,
  viewed: MousePointerClick,
  action_created: CheckCircle2,
  dismissed: Ban,
  outcome_recorded: ClipboardCheck,
};

export function RecommendationAuditDialog({
  recommendation,
  open,
  onOpenChange,
}: {
  recommendation: Recommendation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [outcomeText, setOutcomeText] = useState("");
  const { data: audit, isLoading } = useRecommendationAudit(recommendation?.id ?? "", {
    enabled: open && !!recommendation,
  });
  const outcomeMutation = useRecordRecommendationOutcome(recommendation?.id ?? "");

  if (!recommendation) return null;

  const handleRecordOutcome = () => {
    if (!outcomeText.trim()) return;
    outcomeMutation.mutate({ outcome: outcomeText.trim() }, { onSuccess: () => setOutcomeText("") });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="cadence sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History size={16} style={{ color: "var(--c-brand)" }} />
            Audit trail
          </DialogTitle>
          <DialogDescription>{recommendation.title}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1">
          <div className="flex flex-wrap items-center gap-2 text-[12px]" style={{ color: "var(--c-muted)" }}>
            <Badge variant="outline" className="text-[10.5px]">
              {recommendation.actionTaken ? "Action taken" : "No action yet"}
            </Badge>
            <Badge variant="outline" className="text-[10.5px]">
              {recommendation.outcome ? `Outcome: ${recommendation.outcome}` : "No outcome recorded"}
            </Badge>
          </div>

          <div className="max-h-64 overflow-y-auto rounded-xl" style={{ border: "1px solid var(--c-border)" }}>
            {isLoading ? (
              <div className="p-4 text-[12.5px]" style={{ color: "var(--c-muted)" }}>
                Loading audit trail…
              </div>
            ) : !audit || audit.length === 0 ? (
              <div className="p-4 text-[12.5px]" style={{ color: "var(--c-muted)" }}>
                No audit events recorded yet.
              </div>
            ) : (
              <ul className="divide-y" style={{ borderColor: "var(--c-border)" }}>
                {audit.map((entry) => {
                  const Icon = EVENT_ICON[entry.event] ?? History;
                  return (
                    <li key={entry.id} className="flex items-start gap-2.5 p-3">
                      <Icon size={14} className="mt-0.5 shrink-0" style={{ color: "var(--c-brand)" }} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[12.5px] font-semibold" style={{ color: "var(--c-ink)" }}>
                            {EVENT_LABEL[entry.event] ?? entry.event}
                          </span>
                          <span className="text-[11px]" style={{ color: "var(--c-muted)" }}>
                            {new Date(entry.createdAt).toLocaleString()}
                          </span>
                        </div>
                        {entry.detail && Object.keys(entry.detail).length > 0 && (
                          <div className="mt-0.5 text-[11.5px]" style={{ color: "var(--c-ink-soft)" }}>
                            {Object.entries(entry.detail)
                              .filter(([, v]) => v !== null && v !== undefined && v !== "")
                              .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : String(v)}`)
                              .join(" · ")}
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rec-outcome">Record outcome</Label>
            <div className="flex gap-2">
              <Input
                id="rec-outcome"
                placeholder="e.g. Budget shifted, +12% leads next week"
                value={outcomeText}
                onChange={(e) => setOutcomeText(e.target.value)}
              />
              <Button onClick={handleRecordOutcome} disabled={outcomeMutation.isPending || !outcomeText.trim()}>
                {outcomeMutation.isPending ? "Saving…" : "Save"}
              </Button>
            </div>
            {outcomeMutation.isError && (
              <div className="text-[12px] font-medium" style={{ color: "var(--c-rose)" }}>
                Could not record the outcome. Please try again.
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
