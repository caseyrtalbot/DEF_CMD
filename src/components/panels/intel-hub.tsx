"use client";

import { useState } from "react";
import type { Branch } from "@/lib/branch-config";
import { PeoIntel } from "./peo-intel";
import { BudgetIntel } from "./budget-intel";
import { SpendingTrends } from "./spending-trends";
import { SbirTopics } from "./sbir-topics";
import { DfarsFeed } from "./dfars-feed";
import { RegulationsFeed } from "./regulations-feed";
import { OrgBrowser } from "./org-browser";
import { AlertsPanel } from "./alerts-panel";

type IntelTab = "peo" | "budget" | "spending" | "sbir" | "dfars" | "regs" | "org" | "alerts";

interface IntelHubProps {
  branch: Branch;
}

const TABS: { id: IntelTab; label: string }[] = [
  { id: "peo", label: "PEO" },
  { id: "budget", label: "BUDGET" },
  { id: "spending", label: "SPENDING" },
  { id: "sbir", label: "SBIR" },
  { id: "dfars", label: "DFARS" },
  { id: "regs", label: "REGS" },
  { id: "org", label: "ORG" },
  { id: "alerts", label: "ALERTS" },
];

export function IntelHub({ branch }: IntelHubProps) {
  const [activeTab, setActiveTab] = useState<IntelTab>("peo");

  return (
    <div className="flex flex-col h-full bg-surface-1 overflow-hidden">
      {/* Top accent line */}
      <div
        className="h-[2px] w-full"
        style={{ backgroundColor: `${branch.color}4d` }}
      />

      {/* Tab bar */}
      <div className="flex items-center border-b border-border px-1 bg-surface-1 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-2.5 py-2 text-[10px] font-mono-data font-bold uppercase tracking-[0.08em] transition-colors relative shrink-0 ${
              activeTab === tab.id
                ? "text-signal"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-signal" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "peo" && <PeoIntel branch={branch} />}
        {activeTab === "budget" && <BudgetIntel />}
        {activeTab === "spending" && <SpendingTrends branch={branch} />}
        {activeTab === "sbir" && <SbirTopics />}
        {activeTab === "dfars" && <DfarsFeed />}
        {activeTab === "regs" && <RegulationsFeed />}
        {activeTab === "org" && <OrgBrowser />}
        {activeTab === "alerts" && <AlertsPanel />}
      </div>
    </div>
  );
}
