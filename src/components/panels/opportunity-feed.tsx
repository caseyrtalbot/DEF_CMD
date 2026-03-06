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

const TYPE_FILTERS = [
  { label: "ALL", value: undefined },
  { label: "PRE-SOL", value: "p" },
  { label: "SOL", value: "o" },
  { label: "AWARD", value: "a" },
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
  const [searchTriggered, setSearchTriggered] = useState(false);

  const mergedFilters: SearchFilters = {
    ...filters,
    ...(typeFilter ? { opportunityType: typeFilter } : {}),
    ...(branch.id !== "all" ? { agencies: branch.samAgencies } : {}),
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
        <div className="flex items-center gap-0.5">
          {TYPE_FILTERS.map((tf) => (
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
      {!searchTriggered && opportunities.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-1.5">
          <span className="text-xs">Select filters and press SEARCH</span>
          <span className="text-[10px] font-mono-data">SAM.GOV API — manual queries only</span>
        </div>
      ) : isLoading && opportunities.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-1.5">
          <span className="text-xs">Querying SAM.gov...</span>
          <span className="text-[10px] font-mono-data">SAM.GOV API</span>
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
              className={`stagger-item data-row w-full text-left px-2.5 py-2 border-b border-border-subtle focus:outline-none focus:bg-primary/5`}
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
                    {opp.office ? ` — ${opp.office}` : ""}
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
