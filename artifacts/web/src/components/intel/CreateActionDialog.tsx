// Module 5 — "Create Action" dialog. Turns an AI recommendation into a task
// by calling POST /actions/from-recommendation, which reuses `tasksTable`
// (see routes/intelligence-summary.ts) and marks the recommendation applied.
// Mirrors the shadcn Dialog + form pattern used in TaskBoard.tsx.
import { useEffect, useState } from "react";
import { CheckCircle2, Sparkles } from "lucide-react";
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
import { useCreateActionFromRecommendation } from "@/hooks/useIntel";
import type { Recommendation } from "@/lib/intel-types";

export function CreateActionDialog({
  recommendation,
  open,
  onOpenChange,
}: {
  recommendation: Recommendation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [title, setTitle] = useState("");
  const [owner, setOwner] = useState("");
  const [dueAt, setDueAt] = useState("");
  const mutation = useCreateActionFromRecommendation();

  useEffect(() => {
    if (recommendation) {
      setTitle(recommendation.title);
      setOwner("");
      setDueAt("");
      mutation.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recommendation?.id]);

  if (!recommendation) return null;

  const alreadyApplied = recommendation.status === "applied";

  const handleSubmit = () => {
    if (!title.trim()) return;
    mutation.mutate({
      recommendationId: recommendation.id,
      title: title.trim(),
      owner: owner.trim() || undefined,
      dueAt: dueAt || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="cadence sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles size={16} style={{ color: "var(--c-brand)" }} />
            Create action
          </DialogTitle>
          <DialogDescription>
            This creates a task on the Task Board (flagged AI-generated) and marks the
            recommendation as applied.
          </DialogDescription>
        </DialogHeader>

        {mutation.isSuccess || alreadyApplied ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <CheckCircle2 size={32} style={{ color: "var(--c-emerald)" }} />
            <div className="text-[14px] font-semibold" style={{ color: "var(--c-ink)" }}>
              Action created
            </div>
            <div className="text-[12.5px]" style={{ color: "var(--c-muted)" }}>
              Find it on the Task Board, filtered to AI-generated tasks.
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="action-title">Title</Label>
              <Input id="action-title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="action-owner">Owner (optional)</Label>
              <Input
                id="action-owner"
                placeholder="e.g. Jessica Miller"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="action-due">Due date (optional)</Label>
              <Input id="action-due" type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
            </div>
            {mutation.isError && (
              <div className="text-[12.5px] font-medium" style={{ color: "var(--c-rose)" }}>
                Could not create the action. Please try again.
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {mutation.isSuccess || alreadyApplied ? (
            <Button onClick={() => onOpenChange(false)}>Done</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={mutation.isPending || !title.trim()}>
                {mutation.isPending ? "Creating…" : "Create action"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
