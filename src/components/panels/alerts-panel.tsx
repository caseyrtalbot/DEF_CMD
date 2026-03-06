"use client";

import { Panel } from "../dashboard/panel";
import { useSavedOpportunities } from "@/hooks";

export function AlertsPanel() {
  const { data: savedItems } = useSavedOpportunities();
  const savedCount = savedItems?.length ?? 0;

  return (
    <Panel
      title="Intel"
      className="h-full"
      actions={
        <span className="text-[9px] font-mono-data text-muted-foreground">
          {savedCount > 0 ? `${savedCount} saved` : ""}
        </span>
      }
    >
      <div className="flex flex-col items-center justify-center h-full text-[11px] text-muted-foreground gap-1">
        <span>No active alerts</span>
        <span className="text-[9px]">Deadline and match signals appear here</span>
      </div>
    </Panel>
  );
}
