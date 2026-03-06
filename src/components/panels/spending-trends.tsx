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
import type { Branch } from "@/lib/branch-config";
import type { SpendingRecord, SpendingByTime } from "@/lib/types";

type ViewMode = "agency" | "naics" | "time";

const VIEW_TOGGLES: { label: string; value: ViewMode }[] = [
  { label: "CMD", value: "agency" },
  { label: "NAICS", value: "naics" },
  { label: "TREND", value: "time" },
];

interface SpendingTrendsProps {
  branch: Branch;
}

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
    return (raw as SpendingByTime[]).slice(0, 12).map((r) => ({
      name: r.period,
      value: r.amount,
    }));
  }
  return (raw as SpendingRecord[]).slice(0, 10).map((r) => ({
    name: r.name.replace("Department of the ", "").replace("Defense ", "D/"),
    value: r.amount,
  }));
}

export function SpendingTrends({ branch }: SpendingTrendsProps) {
  const [view, setView] = useState<ViewMode>("agency");
  const { data, isLoading, dataUpdatedAt } = useSpending(view);

  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt) : null;
  const chartData = data?.data ? mapToChartData(view, data.data) : [];
  const branchColor = branch.color;
  const isVertical = view !== "time";

  return (
    <Panel
      title="Spending"
      className="h-full"
      lastUpdated={lastUpdated}
      isLoading={isLoading}
      accentColor={branchColor}
      actions={
        <div className="flex items-center gap-0.5">
          {VIEW_TOGGLES.map((vt) => (
            <button
              key={vt.value}
              onClick={() => setView(vt.value)}
              className={`px-1.5 py-0.5 text-[9px] font-mono-data font-semibold transition-colors ${
                view === vt.value
                  ? "text-signal bg-signal"
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
        <div className="flex items-center justify-center h-full text-muted-foreground text-[11px]">
          Loading...
        </div>
      ) : chartData.length === 0 ? (
        <div className="flex items-center justify-center h-full text-muted-foreground text-[11px]">
          No spending data
        </div>
      ) : (
        <div className="w-full h-full min-h-[180px] p-1.5">
          <ResponsiveContainer width="100%" height="100%">
            {isVertical ? (
              <BarChart data={chartData} layout="vertical" margin={{ left: 2, right: 12, top: 2, bottom: 2 }}>
                <XAxis
                  type="number"
                  tickFormatter={formatCompact}
                  tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
                  stroke="var(--border)"
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={80}
                  tick={{ fontSize: 8, fill: "var(--muted-foreground)" }}
                  stroke="var(--border)"
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value: number | undefined) => [formatCompact(value ?? 0), "Obligated"]}
                  contentStyle={{
                    backgroundColor: "var(--surface-2)",
                    border: "1px solid var(--input)",
                    fontSize: "10px",
                    borderRadius: "0",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                  cursor={{ fill: "color-mix(in srgb, var(--primary) 4%, transparent)" }}
                />
                <Bar dataKey="value" radius={[0, 1, 1, 0]} maxBarSize={14}>
                  {chartData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={branchColor}
                      fillOpacity={0.7 - index * 0.04}
                    />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              <BarChart data={chartData} margin={{ left: 2, right: 12, top: 2, bottom: 2 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 8, fill: "var(--muted-foreground)" }}
                  stroke="var(--border)"
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={formatCompact}
                  tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
                  stroke="var(--border)"
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value: number | undefined) => [formatCompact(value ?? 0), "Obligated"]}
                  contentStyle={{
                    backgroundColor: "var(--surface-2)",
                    border: "1px solid var(--input)",
                    fontSize: "10px",
                    borderRadius: "0",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                  cursor={{ fill: "color-mix(in srgb, var(--primary) 4%, transparent)" }}
                />
                <Bar dataKey="value" radius={[1, 1, 0, 0]} maxBarSize={24}>
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={branchColor} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </Panel>
  );
}
