// Module 7 top-bar control — lets the user switch their presentational role.
// See src/lib/roles.tsx for the gating rules this drives.
import { ShieldCheck } from "lucide-react";
import { useRole, ROLES, type Role } from "@/lib/roles";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function RoleSwitcher() {
  const { role, setRole } = useRole();

  return (
    <Select value={role} onValueChange={(value) => setRole(value as Role)}>
      <SelectTrigger
        aria-label="Switch role"
        className="hidden h-10 w-auto gap-2 rounded-xl border px-3 text-[13px] font-semibold sm:flex"
        style={{
          background: "var(--c-surface)",
          borderColor: "var(--c-border)",
          color: "var(--c-ink-soft)",
        }}
      >
        <ShieldCheck size={15} style={{ color: "var(--c-brand)" }} />
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {ROLES.map((r) => (
          <SelectItem key={r.value} value={r.value}>
            <div className="flex flex-col py-0.5">
              <span className="text-[13px] font-semibold">{r.label}</span>
              <span className="text-[11px]" style={{ color: "var(--c-muted)" }}>
                {r.description}
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
