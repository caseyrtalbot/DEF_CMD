"use client";

import { Panel } from "../dashboard/panel";
import { usePipeline } from "@/hooks";
import { differenceInDays, parseISO } from "date-fns";
import type { Alert } from "@/lib/types";

export function AlertsPanel() {
  const { data: pipelineItems } = usePipeline();

  const alerts: Alert[] = (pipelineItems ?? [])
    .filter((item) => item.decisionDate)
    .map((item) => {
      const days = differenceInDays(parseISO(item.decisionDate!), new Date());
      return {
        id: `deadline-${item.id}`,
        type: "deadline_approaching" as const,
        title: days <= 0 ? "Deadline passed" : days <= 7 ? "Deadline approaching" : "Upcoming deadline",
        message: `${item.opportunityId} — ${days <= 0 ? "overdue" : `${days} days remaining`}`,
        relatedId: item.opportunityId,
        read: false,
        createdAt: new Date().toISOString(),
      };
    })
    .filter((_, i) => {
      const item = (pipelineItems ?? [])[i];
      if (!item?.decisionDate) return false;
      const days = differenceInDays(parseISO(item.decisionDate), new Date());
      return days <= 30;
    })
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const alertColors: Record<string, string> = {
    deadline_approaching: "border-l-amber-500",
    incumbent_award: "border-l-green-500",
    new_presolicitation: "border-l-blue-500",
    saved_search_match: "border-l-cyan-500",
  };

  return (
    <Panel title="Alerts" className="h-full">
      {alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-32 text-xs text-muted-foreground">
          <p>No active alerts</p>
          <p className="text-[10px] mt-1">Pipeline deadlines and saved search matches appear here</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`px-3 py-2 border-l-2 ${alertColors[alert.type] ?? "border-l-muted"} hover:bg-secondary/50 transition-colors cursor-pointer`}
            >
              <p className="text-[10px] font-semibold text-foreground">{alert.title}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{alert.message}</p>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
