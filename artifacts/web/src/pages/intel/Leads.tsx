// Module 2 — Lead Workspace list. Route: /leads
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { Users, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { AppLayout, PageLoading, PageError } from "@/components/AppLayout";
import { useLeads, useLeadPredictions } from "@/hooks/useIntel";
import { fmtMoney } from "@/lib/format";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ScoreTier, LeadStatus, LeadPrediction } from "@/lib/intel-types";

const TIER_COLOR: Record<ScoreTier, string> = {
  high: "var(--c-emerald)",
  medium: "var(--c-amber)",
  low: "var(--c-rose)",
  unscored: "var(--c-muted)",
};

const STATUS_LABEL: Record<LeadStatus, string> = {
  new: "New",
  working: "Working",
  qualified: "Qualified",
  sales_accepted: "Sales Accepted",
  customer: "Customer",
  lost: "Lost",
};

const ALL = "__all__";

type SortKey = "none" | "probability";

export default function Leads() {
  const { data, isLoading, isError } = useLeads();
  const { data: predictionsData } = useLeadPredictions();

  const [search, setSearch] = useState("");
  const [source, setSource] = useState(ALL);
  const [tier, setTier] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [industry, setIndustry] = useState(ALL);
  const [location, setLocation] = useState(ALL);
  const [sortKey, setSortKey] = useState<SortKey>("none");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const leads = data ?? [];

  const predictionByLead = useMemo(() => {
    const map = new Map<string, LeadPrediction>();
    for (const p of predictionsData ?? []) map.set(p.leadId, p);
    return map;
  }, [predictionsData]);

  const sources = useMemo(() => Array.from(new Set(leads.map((l) => l.firstTouchChannel).filter(Boolean))) as string[], [leads]);
  const industries = useMemo(() => Array.from(new Set(leads.map((l) => l.industry).filter(Boolean))), [leads]);
  const locations = useMemo(() => Array.from(new Set(leads.map((l) => l.location).filter(Boolean))), [leads]);

  const filtered = useMemo(() => {
    const rows = leads.filter((l) => {
      if (search && !`${l.companyName} ${l.contactName}`.toLowerCase().includes(search.toLowerCase())) return false;
      if (source !== ALL && l.firstTouchChannel !== source) return false;
      if (tier !== ALL && l.scoreTier !== tier) return false;
      if (status !== ALL && l.status !== status) return false;
      if (industry !== ALL && l.industry !== industry) return false;
      if (location !== ALL && l.location !== location) return false;
      return true;
    });
    if (sortKey === "probability") {
      const withProb = [...rows].sort((a, b) => {
        const pa = predictionByLead.get(a.id)?.conversionProbability ?? -1;
        const pb = predictionByLead.get(b.id)?.conversionProbability ?? -1;
        return sortDir === "desc" ? pb - pa : pa - pb;
      });
      return withProb;
    }
    return rows;
  }, [leads, search, source, tier, status, industry, location, sortKey, sortDir, predictionByLead]);

  function toggleProbabilitySort() {
    if (sortKey !== "probability") {
      setSortKey("probability");
      setSortDir("desc");
    } else {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    }
  }

  return (
    <AppLayout active="leads" title="Lead Workspace" subtitle="Growth Intelligence · All leads captured across channels">
      {isLoading ? (
        <PageLoading />
      ) : isError ? (
        <PageError />
      ) : (
        <div className="mx-auto max-w-7xl p-6 lg:p-8 space-y-6 pb-20">
          {/* Filters */}
          <div
            className="cadence-rise flex flex-col gap-3 rounded-2xl p-4 lg:flex-row lg:items-center lg:gap-3"
            style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", boxShadow: "var(--c-shadow-sm)" }}
          >
            <Input
              placeholder="Search company or contact…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="lg:max-w-xs"
            />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex lg:flex-1 lg:gap-2">
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger><SelectValue placeholder="Source" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All sources</SelectItem>
                  {sources.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={tier} onValueChange={setTier}>
                <SelectTrigger><SelectValue placeholder="Tier" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All tiers</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="unscored">Unscored</SelectItem>
                </SelectContent>
              </Select>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All statuses</SelectItem>
                  {Object.entries(STATUS_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={industry} onValueChange={setIndustry}>
                <SelectTrigger><SelectValue placeholder="Industry" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All industries</SelectItem>
                  {industries.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger><SelectValue placeholder="Location" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All locations</SelectItem>
                  {locations.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          <div
            className="cadence-rise rounded-2xl p-5 lg:p-6"
            style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", boxShadow: "var(--c-shadow-sm)", animationDelay: "60ms" }}
          >
            <div className="mb-4 flex items-center gap-2">
              <Users size={16} style={{ color: "var(--c-brand)" }} />
              <h3 className="text-[15px] font-bold" style={{ color: "var(--c-ink)" }}>
                {filtered.length} lead{filtered.length === 1 ? "" : "s"}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Industry</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>
                      <button
                        type="button"
                        onClick={toggleProbabilitySort}
                        className="flex items-center gap-1 font-medium"
                        title="Sort by conversion probability"
                      >
                        Conv. probability
                        {sortKey === "probability" ? (
                          sortDir === "desc" ? <ArrowDown size={12} /> : <ArrowUp size={12} />
                        ) : (
                          <ArrowUpDown size={12} style={{ color: "var(--c-muted)" }} />
                        )}
                      </button>
                    </TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-[13px]" style={{ color: "var(--c-muted)" }}>
                        No leads match these filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((lead) => {
                      const prediction = predictionByLead.get(lead.id);
                      return (
                        <TableRow key={lead.id}>
                          <TableCell className="whitespace-nowrap font-medium">
                            <Link href={`/leads/${lead.id}`} className="hover:underline" style={{ color: "var(--c-brand-600)" }}>
                              {lead.companyName}
                            </Link>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">{lead.contactName}</TableCell>
                          <TableCell className="whitespace-nowrap">{lead.industry}</TableCell>
                          <TableCell className="whitespace-nowrap">{lead.location}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Badge style={{ background: TIER_COLOR[lead.scoreTier], color: "#fff" }}>
                              {lead.score} · {lead.scoreTier}
                            </Badge>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">{STATUS_LABEL[lead.status]}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            {prediction ? (
                              <Badge
                                style={{
                                  background:
                                    prediction.confidenceBand === "high"
                                      ? "var(--c-emerald)"
                                      : prediction.confidenceBand === "medium"
                                        ? "var(--c-amber)"
                                        : "var(--c-rose)",
                                  color: "#fff",
                                }}
                              >
                                {(prediction.conversionProbability * 100).toFixed(0)}%
                              </Badge>
                            ) : (
                              <span style={{ color: "var(--c-muted)" }}>—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-semibold whitespace-nowrap">{fmtMoney(lead.revenueGenerated)}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
