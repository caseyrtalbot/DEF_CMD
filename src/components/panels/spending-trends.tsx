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

function formatCompact(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${Math.round(value / 1_000_000)}M`;
  if (value >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${value}`;
}

function abbreviateCmdName(name: string): string {
  return name.replace("Department of the ", "").replace("Defense ", "D/");
}

function abbreviateNaicsName(name: string): string {
  return name
    .replace("Manufacturing", "Mfg")
    .replace("Services", "Svc")
    .replace("and Repairing", "")
    .replace(/\s*\(except[^)]*\)/gi, "")
    .replace(/\s*\(formerly[^)]*\)/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function formatMonth(period: string): string {
  const [year, month] = period.split("-");
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleString("en-US", { month: "short" }).toUpperCase();
}

function filterDeadTrailingMonths(
  data: { name: string; value: number }[]
): { name: string; value: number }[] {
  const max = Math.max(...data.map((d) => d.value));
  const threshold = max * 0.01;
  let lastSignificant = data.length - 1;
  while (lastSignificant > 0 && data[lastSignificant].value < threshold) {
    lastSignificant--;
  }
  return data.slice(0, lastSignificant + 1);
}

interface SpendingTrendsProps {
  branch: Branch;
}

function CustomTrendTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { value: number }[];
}) {
  if (!active || !payload?.length) return null;
  return (
    <span
      className="text-[11px] font-mono-data font-bold text-foreground"
      style={{ textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}
    >
      {formatCompact(payload[0].value)}
    </span>
  );
}

function SparkTable({
  records,
  view,
  branchColor,
}: {
  records: SpendingRecord[];
  view: "agency" | "naics";
  branchColor: string;
}) {
  const rows = records.slice(0, 10);
  const maxAmount = Math.max(...rows.map((r) => r.amount), 1);

  return (
    <div className="flex flex-col gap-[3px] p-2">
      {rows.map((row, index) => {
        const displayName =
          view === "naics"
            ? abbreviateNaicsName(row.name)
            : abbreviateCmdName(row.name);
        const widthPct = (row.amount / maxAmount) * 100;
        const opacity = 0.8 - index * 0.05;

        return (
          <div key={row.id} className="flex items-center gap-1.5 h-[24px]">
            <span className="text-[10px] font-mono-data text-muted-foreground w-4 shrink-0 text-right">
              {index + 1}
            </span>
            <span
              className="text-[10px] truncate w-[100px] shrink-0"
              title={row.name}
            >
              {displayName}
            </span>
            <div className="flex-1 h-[10px] bg-surface-inset rounded-[1px] overflow-hidden">
              <div
                className="h-full rounded-[1px]"
                style={{
                  width: `${widthPct}%`,
                  backgroundColor: branchColor,
                  opacity,
                }}
              />
            </div>
            <span className="text-[10px] font-mono-data text-foreground w-[52px] text-right shrink-0">
              {formatCompact(row.amount)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function SpendingTrends({ branch }: SpendingTrendsProps) {
  const [view, setView] = useState<ViewMode>("agency");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const { data, isLoading, dataUpdatedAt } = useSpending(view);

  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt) : null;
  const branchColor = branch.color;

  const isTrend = view === "time";
  const rawData = data?.data;

  const trendData = isTrend && rawData
    ? filterDeadTrailingMonths(
        (rawData as SpendingByTime[]).slice(0, 12).map((r) => ({
          name: formatMonth(r.period),
          value: r.amount,
        }))
      )
    : [];

  const sparkRecords = !isTrend && rawData ? (rawData as SpendingRecord[]) : [];
  const hasData = isTrend ? trendData.length > 0 : sparkRecords.length > 0;

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
      {isLoading && !rawData ? (
        <div className="flex items-center justify-center h-full text-muted-foreground text-[11px]">
          Loading...
        </div>
      ) : !hasData ? (
        <div className="flex items-center justify-center h-full text-muted-foreground text-[11px]">
          No spending data
        </div>
      ) : isTrend ? (
        <div className="w-full h-full min-h-[240px] p-1.5">
          <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={200}>
            <BarChart data={trendData} margin={{ left: 2, right: 12, top: 16, bottom: 2 }} barCategoryGap="15%">
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
                cursor={false}
                content={<CustomTrendTooltip />}
                wrapperStyle={{ background: "none", border: "none", boxShadow: "none" }}
              />
              <Bar
                dataKey="value"
                radius={[1, 1, 0, 0]}
                onMouseLeave={() => setActiveIndex(null)}
              >
                {trendData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={branchColor}
                    fillOpacity={
                      activeIndex === null ? 0.8 : activeIndex === index ? 1.0 : 0.35
                    }
                    onMouseEnter={() => setActiveIndex(index)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <SparkTable
          records={sparkRecords}
          view={view}
          branchColor={branchColor}
        />
      )}
    </Panel>
  );
}
