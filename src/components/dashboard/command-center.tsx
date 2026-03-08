"use client";

import { useState, useRef, useCallback } from "react";
import type { Opportunity, SearchFilters } from "@/lib/types";
import type { Branch } from "@/lib/branch-config";
import { BRANCHES } from "@/lib/branch-config";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useQueryClient } from "@tanstack/react-query";
import { TickerBar } from "./ticker-bar";
import { KpiStrip } from "./kpi-strip";
import { Header } from "./header";
import { BranchNav } from "./branch-nav";
import { StatusBar } from "./status-bar";
import { OpportunityFeed } from "@/components/panels/opportunity-feed";
import { SavedReferences } from "@/components/panels/pipeline-tracker";
import { ContractAwardsPanel } from "@/components/panels/contract-awards";
import { IntelHub } from "@/components/panels/intel-hub";
import { OpportunityDrawer } from "@/components/drawers/opportunity-drawer";

export function CommandCenter() {
  const [globalFilters, setGlobalFilters] = useState<SearchFilters>({});
  const [activeBranch, setActiveBranch] = useState<Branch>(BRANCHES[0]);
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
    <div className="flex flex-col h-screen bg-surface-0">
      {/* Bloomberg-style scrolling budget ticker */}
      <TickerBar />

      <Header
        onSearch={handleSearch}
        alertCount={0}
        onToggleAlerts={handleToggleAlerts}
        onToggleSettings={handleToggleSettings}
        searchFocusRef={searchFocusRef}
      />
      <BranchNav activeBranch={activeBranch} onSelect={setActiveBranch} />

      {/* KPI Strip — top-line DoD budget figures */}
      <KpiStrip />

      {/* Main grid — 3-column layout */}
      <div className="flex-1 grid grid-cols-[minmax(320px,3fr)_minmax(240px,2fr)_minmax(280px,3fr)] gap-px bg-surface-gap overflow-hidden">
        {/* Left column: Opportunities (full height) */}
        <OpportunityFeed
          filters={globalFilters}
          branch={activeBranch}
          onSelect={setSelectedOpportunity}
        />

        {/* Center column: Saved References + Contract Awards stacked */}
        <div className="grid grid-rows-[1fr_1fr] gap-px bg-surface-gap">
          <SavedReferences />
          <ContractAwardsPanel branch={activeBranch} />
        </div>

        {/* Right column: Intel Hub (PEO / Budget / Spending / SBIR / DFARS / Regs / Org) */}
        <IntelHub branch={activeBranch} />
      </div>

      <StatusBar branch={activeBranch} />

      {selectedOpportunity && (
        <OpportunityDrawer
          opportunity={selectedOpportunity}
          onClose={() => setSelectedOpportunity(null)}
        />
      )}
    </div>
  );
}
