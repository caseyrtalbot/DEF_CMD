"use client";

import type { Opportunity, SearchFilters } from "@/lib/types";

interface OpportunityFeedProps {
  filters: SearchFilters;
  onSelect: (opp: Opportunity) => void;
}

export function OpportunityFeed({ filters: _filters, onSelect: _onSelect }: OpportunityFeedProps) {
  return (
    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
      Opportunity Feed
    </div>
  );
}
