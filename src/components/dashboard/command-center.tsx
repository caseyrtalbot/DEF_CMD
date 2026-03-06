"use client";

import { useState, useRef, useCallback } from "react";
import type { Opportunity, SearchFilters } from "@/lib/types";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useQueryClient } from "@tanstack/react-query";
import { Header } from "./header";
import { Panel } from "./panel";
import { OpportunityFeed } from "@/components/panels/opportunity-feed";
import { PipelineTracker } from "@/components/panels/pipeline-tracker";
import { RecentAwards } from "@/components/panels/recent-awards";
import { SpendingTrends } from "@/components/panels/spending-trends";
import { AlertsPanel } from "@/components/panels/alerts-panel";
import { OpportunityDrawer } from "@/components/drawers/opportunity-drawer";

export function CommandCenter() {
  const [globalFilters, setGlobalFilters] = useState<SearchFilters>({});
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [showAlerts, setShowAlerts] = useState(false);
  const searchFocusRef = useRef<(() => void) | null>(null);
  const queryClient = useQueryClient();

  const handleSearch = useCallback((query: string) => {
    setGlobalFilters((prev) => ({ ...prev, keywords: query }));
  }, []);

  const handleToggleAlerts = useCallback(() => {
    setShowAlerts((prev) => !prev);
  }, []);

  const handleToggleSettings = useCallback(() => {
    // Settings panel placeholder
  }, []);

  useKeyboardShortcuts({
    "/": () => searchFocusRef.current?.(),
    Escape: () => {
      setSelectedOpportunity(null);
      setShowAlerts(false);
    },
    r: () => {
      queryClient.invalidateQueries();
    },
  });

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header
        onSearch={handleSearch}
        alertCount={0}
        onToggleAlerts={handleToggleAlerts}
        onToggleSettings={handleToggleSettings}
        searchFocusRef={searchFocusRef}
      />
      <div className="flex-1 grid grid-rows-[1fr_1fr] grid-cols-[2fr_3fr] gap-px bg-border overflow-hidden">
        <OpportunityFeed filters={globalFilters} onSelect={setSelectedOpportunity} />
        <PipelineTracker />
        <RecentAwards naicsCode={globalFilters.naicsCodes?.[0]} />
        <div className="grid grid-rows-[1fr_1fr] gap-px bg-border">
          <Panel title="Spending Trends">
            <SpendingTrends />
          </Panel>
          <Panel title="Alerts" className={showAlerts ? "ring-1 ring-blue-500" : ""}>
            <AlertsPanel />
          </Panel>
        </div>
      </div>
      {selectedOpportunity && (
        <OpportunityDrawer
          opportunity={selectedOpportunity}
          onClose={() => setSelectedOpportunity(null)}
        />
      )}
    </div>
  );
}
