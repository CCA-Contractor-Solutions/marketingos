// ---------------------------------------------------------------------------
// Phase 3 — Module 7: User Roles.
//
// PRESENTATIONAL GATING ONLY. This context controls which buttons/actions
// are *shown* in the UI so different personas see an experience tailored to
// their job — it is NOT a security boundary. Every API endpoint remains
// reachable by anyone holding the shared app token (see custom-fetch.ts /
// requireApiToken). Phase 4 is expected to add real per-user authentication
// and server-side authorization; until then, treat all gating here as a
// UX affordance, not access control.
// ---------------------------------------------------------------------------

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { safeLocal } from "@/lib/safe-storage";

export type Role = "executive" | "marketing_director" | "marketing_team" | "analyst";

export const ROLES: { value: Role; label: string; description: string }[] = [
  {
    value: "executive",
    label: "Executive",
    description: "Read-all access across every intelligence module.",
  },
  {
    value: "marketing_director",
    label: "Marketing Director",
    description: "Manages campaigns and insights — can edit strategy, create actions, generate insights.",
  },
  {
    value: "marketing_team",
    label: "Marketing Team",
    description: "Manages assigned work — actions/tasks and limited campaign edits.",
  },
  {
    value: "analyst",
    label: "Analyst",
    description: "Reporting only — read-only, no edit or create actions.",
  },
];

const STORAGE_KEY = "marketingos.role";
const DEFAULT_ROLE: Role = "executive";

function isRole(value: string | null): value is Role {
  return value === "executive" || value === "marketing_director" || value === "marketing_team" || value === "analyst";
}

// --- Capability gates ---------------------------------------------------------
// Centralizing these means every page checks the *capability* it needs
// rather than hardcoding role comparisons, so the underlying role → permission
// mapping only needs to change in one place.

export type Capabilities = {
  canEditCampaignStrategy: boolean;
  canCreateActions: boolean;
  canGenerateInsights: boolean;
  canManageTasks: boolean;
  canConvertLeads: boolean;
  canEditLeadStatus: boolean;
};

function capabilitiesForRole(role: Role): Capabilities {
  switch (role) {
    case "executive":
      return {
        canEditCampaignStrategy: false,
        canCreateActions: false,
        canGenerateInsights: false,
        canManageTasks: false,
        canConvertLeads: false,
        canEditLeadStatus: false,
      };
    case "marketing_director":
      return {
        canEditCampaignStrategy: true,
        canCreateActions: true,
        canGenerateInsights: true,
        canManageTasks: true,
        canConvertLeads: true,
        canEditLeadStatus: true,
      };
    case "marketing_team":
      return {
        canEditCampaignStrategy: false,
        canCreateActions: true,
        canGenerateInsights: false,
        canManageTasks: true,
        canConvertLeads: true,
        canEditLeadStatus: true,
      };
    case "analyst":
      return {
        canEditCampaignStrategy: false,
        canCreateActions: false,
        canGenerateInsights: false,
        canManageTasks: false,
        canConvertLeads: false,
        canEditLeadStatus: false,
      };
  }
}

type RoleContextValue = {
  role: Role;
  setRole: (role: Role) => void;
  capabilities: Capabilities;
};

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>(() => {
    if (typeof window === "undefined") return DEFAULT_ROLE;
    const stored = safeLocal.get(STORAGE_KEY);
    return isRole(stored) ? stored : DEFAULT_ROLE;
  });

  useEffect(() => {
    safeLocal.set(STORAGE_KEY, role);
  }, [role]);

  const setRole = useCallback((next: Role) => {
    setRoleState(next);
  }, []);

  const capabilities = useMemo(() => capabilitiesForRole(role), [role]);

  const value = useMemo(() => ({ role, setRole, capabilities }), [role, setRole, capabilities]);

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole(): RoleContextValue {
  const ctx = useContext(RoleContext);
  if (!ctx) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return ctx;
}

export function roleLabel(role: Role): string {
  return ROLES.find((r) => r.value === role)?.label ?? role;
}
