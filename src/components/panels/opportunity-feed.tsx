"use client";

import { useState, useCallback } from "react";
import type { Opportunity, SearchFilters } from "@/lib/types";
import type { Branch } from "@/lib/branch-config";
import { useOpportunities } from "@/hooks/use-opportunities";
import { Panel } from "@/components/dashboard/panel";
import { DeadlineBadge } from "@/components/ui/deadline-badge";

interface OpportunityFeedProps {
  filters: SearchFilters;
  branch: Branch;
  onSelect: (opp: Opportunity) => void;
}

const NOTICE_TYPES = [
  { label: "ALL", value: undefined },
  { label: "PRE", value: "Presolicitation" },
  { label: "SOL", value: "Solicitation" },
  { label: "CMB", value: "Combined Synopsis/Solicitation" },
  { label: "AWD", value: "Award Notice" },
] as const;

const SORT_OPTIONS = [
  { label: "Newest", value: "posted_date:desc" },
  { label: "Oldest", value: "posted_date:asc" },
  { label: "Deadline", value: "response_deadline:asc" },
  { label: "Title", value: "title:asc" },
] as const;

const TYPE_COLORS: Record<Opportunity["type"], string> = {
  presolicitation: "text-data-amber",
  solicitation: "text-data-blue",
  award: "text-data-green",
  combined: "text-data-cyan",
};

const TYPE_LABELS: Record<Opportunity["type"], string> = {
  presolicitation: "PRE",
  solicitation: "SOL",
  award: "AWD",
  combined: "CMB",
};

export function OpportunityFeed({ filters, branch, onSelect }: OpportunityFeedProps) {
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
  const [naicsInput, setNaicsInput] = useState("");
  const [pscInput, setPscInput] = useState("");
  const [stateInput, setStateInput] = useState("");
  const [sortValue, setSortValue] = useState("posted_date:desc");
  const [searchTriggered, setSearchTriggered] = useState(false);

  const [sortBy, sortOrder] = sortValue.split(":") as [string, "asc" | "desc"];

  const mergedFilters: SearchFilters = {
    ...filters,
    ...(typeFilter ? { opportunityType: typeFilter } : {}),
    ...(branch.id !== "all" ? { agencies: branch.samAgencies } : {}),
    ...(naicsInput.trim() ? { naicsCodes: naicsInput.split(",").map((s) => s.trim()) } : {}),
    ...(pscInput.trim() ? { psc: pscInput.trim() } : {}),
    ...(stateInput.trim() ? { state: stateInput.trim().toUpperCase() } : {}),
    sortBy,
    sortOrder,
  };

  const { data, isLoading, dataUpdatedAt, refetch, isFetching } = useOpportunities(
    mergedFilters,
    25,
    0,
    searchTriggered
  );

  const handleSearch = useCallback(() => {
    if (searchTriggered) {
      refetch();
    } else {
      setSearchTriggered(true);
    }
  }, [searchTriggered, refetch]);

  const opportunities = data?.data ?? [];
  const total = data?.total ?? 0;
  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt) : null;

  return (
    <Panel
      title="Opportunities"
      lastUpdated={lastUpdated}
      isLoading={isLoading || isFetching}
      accentColor={branch.color}
      actions={
        <div className="flex items-center gap-1">
          {NOTICE_TYPES.map((tf) => (
            <button
              key={tf.label}
              onClick={() => setTypeFilter(tf.value)}
              className={`px-1.5 py-0.5 text-[10px] font-mono-data font-semibold transition-colors ${
                typeFilter === tf.value
                  ? "text-signal bg-signal"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tf.label}
            </button>
          ))}
          <button
            onClick={handleSearch}
            disabled={isFetching}
            className="ml-1.5 px-2 py-0.5 text-[10px] font-mono-data font-bold bg-signal text-signal-foreground hover:bg-signal/90 disabled:opacity-50 transition-colors"
          >
            {isFetching ? "..." : searchTriggered ? "REFRESH" : "SEARCH"}
          </button>
          {total > 0 && (
            <span className="ml-1 text-[10px] font-mono-data text-muted-foreground">
              {total.toLocaleString()}
            </span>
          )}
        </div>
      }
    >
      {/* Inline filter row */}
      <div className="px-2.5 py-1.5 border-b border-border bg-surface-0">
        <div className="flex items-center gap-1.5">
          <label className="text-[9px] font-mono-data text-muted-foreground shrink-0">NAICS</label>
          <input
            value={naicsInput}
            onChange={(e) => setNaicsInput(e.target.value)}
            placeholder="336411"
            className="flex-1 h-5 px-1.5 text-[10px] font-mono-data bg-surface-inset border border-border text-foreground placeholder:text-muted-foreground/40 focus:border-primary/40 focus:outline-none"
          />
          <label className="text-[9px] font-mono-data text-muted-foreground shrink-0">PSC</label>
          <input
            value={pscInput}
            onChange={(e) => setPscInput(e.target.value)}
            placeholder="1550"
            className="w-14 h-5 px-1.5 text-[10px] font-mono-data bg-surface-inset border border-border text-foreground placeholder:text-muted-foreground/40 focus:border-primary/40 focus:outline-none"
          />
          <label className="text-[9px] font-mono-data text-muted-foreground shrink-0">ST</label>
          <input
            value={stateInput}
            onChange={(e) => setStateInput(e.target.value)}
            placeholder="VA"
            className="w-10 h-5 px-1.5 text-[10px] font-mono-data bg-surface-inset border border-border text-foreground placeholder:text-muted-foreground/40 focus:border-primary/40 focus:outline-none uppercase"
          />
          <select
            value={sortValue}
            onChange={(e) => setSortValue(e.target.value)}
            className="w-[70px] h-5 px-1 text-[10px] font-mono-data bg-surface-inset border border-border text-foreground focus:border-primary/40 focus:outline-none appearance-none"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {!searchTriggered && opportunities.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-1.5">
          <span className="text-xs">Select filters and press SEARCH</span>
          <span className="text-[10px] font-mono-data">GOVCON API — manual queries only</span>
        </div>
      ) : isLoading && opportunities.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-1.5">
          <span className="text-xs">Querying GovCon API...</span>
          <span className="text-[10px] font-mono-data">DoD OPPORTUNITIES</span>
        </div>
      ) : opportunities.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-1.5">
          <span className="text-xs">No opportunities found</span>
          <span className="text-[10px] font-mono-data">Adjust filters and search again</span>
        </div>
      ) : (
        <div>
          {/* Column header */}
          <div className="flex items-center px-2.5 py-1.5 text-[10px] font-mono-data text-muted-foreground uppercase border-b border-border bg-surface-0">
            <span className="w-7">TYPE</span>
            <span className="flex-1 ml-1">TITLE / AGENCY</span>
            <span className="w-14 text-right">NAICS</span>
            <span className="w-16 text-right">DEADLINE</span>
          </div>
          {opportunities.map((opp, i) => (
            <button
              key={opp.id}
              onClick={() => onSelect(opp)}
              className="stagger-item data-row w-full text-left px-2.5 py-2 border-b border-border-subtle focus:outline-none focus:bg-primary/5"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <div className="flex items-start gap-1">
                <span className={`text-[10px] font-mono-data font-bold w-7 shrink-0 ${TYPE_COLORS[opp.type]}`}>
                  {TYPE_LABELS[opp.type]}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-foreground truncate leading-tight">
                    {opp.title}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                    {opp.agency}
                    {opp.office ? ` / ${opp.office}` : ""}
                  </p>
                </div>
                <span className="text-[10px] font-mono-data text-muted-foreground w-14 text-right shrink-0">
                  {opp.naicsCodes[0]?.code ?? "—"}
                </span>
                <div className="w-16 text-right shrink-0">
                  <DeadlineBadge deadline={opp.responseDeadline} />
                </div>
              </div>
              {opp.setAside && (
                <div className="ml-7 mt-0.5">
                  <span className="text-[9px] font-mono-data px-1 py-0 text-data-purple bg-data-purple/10 border border-data-purple/20">
                    {opp.setAside}
                  </span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </Panel>
  );
}
