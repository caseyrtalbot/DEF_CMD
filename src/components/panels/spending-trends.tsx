"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Panel } from "@/components/dashboard/panel";
import { useSpending } from "@/hooks";
import type { SpendingRecord, SpendingByTime } from "@/lib/types";

type ViewMode = "agency" | "naics" | "time";

const VIEW_TOGGLES: { label: string; value: ViewMode }[] = [
  { label: "AGENCY", value: "agency" },
  { label: "NAICS", value: "naics" },
  { label: "TREND", value: "time" },
];

const BAR_COLORS = [
  "#3b82f6",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

function formatCompact(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${Math.round(value / 1_000_000)}M`;
  if (value >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${value}`;
}

function mapToChartData(
  view: ViewMode,
  raw: SpendingRecord[] | SpendingByTime[]
): { name: string; value: number }[] {
  if (view === "time") {
    return (raw as SpendingByTime[]).slice(0, 8).map((r) => ({
      name: r.period,
      value: r.amount,
    }));
  }
  return (raw as SpendingRecord[]).slice(0, 8).map((r) => ({
    name: r.name,
    value: r.amount,
  }));
}

export function SpendingTrends() {
  const [view, setView] = useState<ViewMode>("agency");
  const { data, isLoading, dataUpdatedAt } = useSpending(view);

  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt) : null;
  const chartData = data?.data ? mapToChartData(view, data.data) : [];

  return (
    <Panel
      title="Spending"
      className="h-full"
      lastUpdated={lastUpdated}
      isLoading={isLoading}
      actions={
        <div className="flex items-center gap-1">
          {VIEW_TOGGLES.map((vt) => (
            <button
              key={vt.value}
              onClick={() => setView(vt.value)}
              className={`px-1.5 py-0.5 text-[10px] font-mono-data font-semibold rounded transition-colors ${
                view === vt.value
                  ? "bg-cyan-500/20 text-cyan-400"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {vt.label}
            </button>
          ))}
        </div>
      }
    >
      {isLoading && chartData.length === 0 ? (
        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
          Loading spending data...
        </div>
      ) : chartData.length === 0 ? (
        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
          No spending data available
        </div>
      ) : (
        <div className="w-full h-full min-h-[200px] p-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 4, right: 16, top: 4, bottom: 4 }}>
              <XAxis
                type="number"
                tickFormatter={formatCompact}
                tick={{ fontSize: 10 }}
                stroke="hsl(217,33%,25%)"
              />
              <YAxis
                type="category"
                dataKey="name"
                width={100}
                tick={{ fontSize: 9 }}
                stroke="hsl(217,33%,25%)"
              />
              <Tooltip
                formatter={(value: number | undefined) => [formatCompact(value ?? 0), "Amount"]}
                contentStyle={{
                  backgroundColor: "hsl(222,47%,6%)",
                  border: "1px solid hsl(217,33%,12%)",
                  fontSize: "11px",
                  borderRadius: "4px",
                }}
                cursor={{ fill: "hsl(217,33%,12%)", opacity: 0.3 }}
              />
              <Bar dataKey="value" radius={[0, 3, 3, 0]}>
                {chartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={BAR_COLORS[index % BAR_COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Panel>
  );
}
