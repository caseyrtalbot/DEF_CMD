"use client";

import { useState } from "react";
import type { Opportunity, SearchFilters } from "@/lib/types";
import { useOpportunities } from "@/hooks/use-opportunities";
import { Panel } from "@/components/dashboard/panel";
import { Badge } from "@/components/ui/badge";
import { DeadlineBadge } from "@/components/ui/deadline-badge";

interface OpportunityFeedProps {
  filters: SearchFilters;
  onSelect: (opp: Opportunity) => void;
}

const TYPE_FILTERS = [
  { label: "ALL", value: undefined },
  { label: "PRE-SOL", value: "p" },
  { label: "SOL", value: "o" },
  { label: "AWARD", value: "a" },
] as const;

const TYPE_BADGE_COLORS: Record<Opportunity["type"], string> = {
  presolicitation: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  solicitation: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  award: "bg-green-500/20 text-green-400 border-green-500/30",
  combined: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
};

const TYPE_LABELS: Record<Opportunity["type"], string> = {
  presolicitation: "PRE-SOL",
  solicitation: "SOL",
  award: "AWARD",
  combined: "COMBINED",
};

export function OpportunityFeed({ filters, onSelect }: OpportunityFeedProps) {
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);

  const mergedFilters: SearchFilters = {
    ...filters,
    ...(typeFilter ? { opportunityType: typeFilter } : {}),
  };

  const { data, isLoading, dataUpdatedAt } = useOpportunities(mergedFilters);

  const opportunities = data?.data ?? [];
  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt) : null;

  return (
    <Panel
      title="Opportunities"
      lastUpdated={lastUpdated}
      isLoading={isLoading}
      actions={
        <div className="flex items-center gap-1">
          {TYPE_FILTERS.map((tf) => (
            <button
              key={tf.label}
              onClick={() => setTypeFilter(tf.value)}
              className={`px-1.5 py-0.5 text-[10px] font-mono-data font-semibold rounded transition-colors ${
                typeFilter === tf.value
                  ? "bg-blue-500/20 text-blue-400"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      }
    >
      {isLoading && opportunities.length === 0 ? (
        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
          Loading opportunities...
        </div>
      ) : opportunities.length === 0 ? (
        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
          No opportunities found
        </div>
      ) : (
        <div className="divide-y divide-border">
          {opportunities.map((opp) => (
            <button
              key={opp.id}
              onClick={() => onSelect(opp)}
              className="w-full text-left px-3 py-2 hover:bg-muted/50 transition-colors focus:outline-none focus:bg-muted/50"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate leading-tight">
                    {opp.title}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                    {opp.agency}
                    {opp.office ? ` / ${opp.office}` : ""}
                  </p>
                </div>
                <DeadlineBadge deadline={opp.responseDeadline} />
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <Badge
                  variant="outline"
                  className={`text-[9px] px-1 py-0 h-4 ${TYPE_BADGE_COLORS[opp.type]}`}
                >
                  {TYPE_LABELS[opp.type]}
                </Badge>
                {opp.naicsCodes.length > 0 && (
                  <span className="text-[9px] font-mono-data text-muted-foreground">
                    {opp.naicsCodes[0].code}
                  </span>
                )}
                {opp.setAside && (
                  <Badge
                    variant="outline"
                    className="text-[9px] px-1 py-0 h-4 border-purple-500/30 text-purple-400"
                  >
                    {opp.setAside}
                  </Badge>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </Panel>
  );
}
