"use client";

import { useState } from "react";
import { Panel } from "@/components/dashboard/panel";

type BudgetView = "overview" | "rdte" | "procurement";

const SERVICE_BUDGETS = [
  { label: "NAVY", fy26: 292.2, fy25: 257.6, color: "#4488cc" },
  { label: "AIR FORCE", fy26: 209.6, fy25: 188.1, color: "#6688dd" },
  { label: "ARMY", fy26: 197.4, fy25: 185.8, color: "#88aa44" },
  { label: "DEFENSE-WIDE", fy26: 170.9, fy25: 170.0, color: "#ccaa44" },
  { label: "SPACE FORCE", fy26: 39.9, fy25: 29.4, color: "#aaaacc" },
];

const RDTE_BREAKDOWN = [
  {
    service: "AIR FORCE",
    base: 52.02,
    recon: 10.23,
    total: 62.24,
    color: "#6688dd",
  },
  {
    service: "DEFENSE-WIDE",
    base: 33.92,
    recon: 8.9,
    total: 42.82,
    color: "#ccaa44",
  },
  {
    service: "SPACE FORCE",
    base: 15.49,
    recon: 13.55,
    total: 29.03,
    color: "#aaaacc",
  },
  {
    service: "NAVY",
    base: 25.71,
    recon: 3.45,
    total: 29.16,
    color: "#4488cc",
  },
  {
    service: "ARMY",
    base: 14.55,
    recon: 0.85,
    total: 15.4,
    color: "#88aa44",
  },
];

const PROCUREMENT_HIGHLIGHTS = [
  "47 F-35 Joint Strike Fighters (reduced from prior year)",
  "F-47 NGAD: $3.5B (6th-generation fighter)",
  "B-21 Raider: $10.3B total ($3.8B procurement + RDT&E)",
  "Columbia-class SSBN: $11.2B (up $1.4B)",
  "Virginia-class SSN: 2 boats in FY2026",
  "37 THAAD interceptors (MDA)",
  "Autonomy investment: $13.4B DoD-wide",
  "Nuclear modernization total: ~$62B",
  "Space Force surge: $39.9B (+43% from FY25)",
];

const MAX_BUDGET = 300;

export function BudgetIntel() {
  const [view, setView] = useState<BudgetView>("overview");

  return (
    <Panel
      title="Budget Analysis"
      actions={
        <div className="flex items-center gap-0.5">
          {(
            [
              { label: "SVC", value: "overview" as BudgetView },
              { label: "RDT&E", value: "rdte" as BudgetView },
              { label: "PROC", value: "procurement" as BudgetView },
            ] as const
          ).map((vt) => (
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
      <div className="p-2.5 space-y-2">
        {view === "overview" && (
          <>
            <div className="text-[8px] font-mono-data text-muted-foreground uppercase tracking-wide mb-2">
              FY2026 SERVICE BUDGETS (SOLID = FY26 | OUTLINE = FY25)
            </div>
            {SERVICE_BUDGETS.map((d) => {
              const w26 = (d.fy26 / MAX_BUDGET) * 100;
              const w25 = (d.fy25 / MAX_BUDGET) * 100;
              return (
                <div key={d.label} className="flex items-center gap-2">
                  <span className="w-24 text-right text-[10px] font-mono-data text-muted-foreground uppercase shrink-0 truncate">
                    {d.label}
                  </span>
                  <div className="flex-1 h-[18px] bg-surface-inset relative overflow-hidden">
                    {/* FY25 outline */}
                    <div
                      className="absolute top-0 left-0 h-full border opacity-40"
                      style={{ width: `${w25}%`, borderColor: d.color }}
                    />
                    {/* FY26 fill */}
                    <div
                      className="absolute top-0 left-0 h-full transition-all duration-500"
                      style={{
                        width: `${w26}%`,
                        backgroundColor: d.color,
                      }}
                    />
                  </div>
                  <span className="text-[9px] font-mono-data font-bold text-foreground w-14 text-right shrink-0">
                    ${d.fy26}B
                  </span>
                </div>
              );
            })}
          </>
        )}

        {view === "rdte" && (
          <>
            <div className="text-[8px] font-mono-data text-muted-foreground uppercase tracking-wide mb-2">
              RDT&E BREAKDOWN (SOLID = BASE | HATCHED = RECONCILIATION)
            </div>
            {RDTE_BREAKDOWN.map((d) => {
              const wBase = (d.base / 65) * 100;
              const wRecon = (d.recon / 65) * 100;
              return (
                <div key={d.service} className="flex items-center gap-2">
                  <span className="w-24 text-right text-[10px] font-mono-data text-muted-foreground uppercase shrink-0 truncate">
                    {d.service}
                  </span>
                  <div className="flex-1 h-[18px] bg-surface-inset relative overflow-hidden flex">
                    <div
                      style={{
                        width: `${wBase}%`,
                        backgroundColor: d.color,
                      }}
                      className="h-full"
                    />
                    <div
                      style={{
                        width: `${wRecon}%`,
                        backgroundColor: d.color,
                      }}
                      className="h-full bg-hatched"
                    />
                  </div>
                  <span className="text-[9px] font-mono-data font-bold text-foreground w-14 text-right shrink-0">
                    ${d.total.toFixed(1)}B
                  </span>
                </div>
              );
            })}
          </>
        )}

        {view === "procurement" && (
          <>
            <div className="text-[8px] font-mono-data text-muted-foreground uppercase tracking-wide mb-2">
              FY2026 PROCUREMENT HIGHLIGHTS — ~$205B TOTAL
            </div>
            <ul className="space-y-1">
              {PROCUREMENT_HIGHLIGHTS.map((item, i) => (
                <li
                  key={i}
                  className="text-[10px] text-foreground flex items-start gap-1.5"
                >
                  <span className="text-signal mt-0.5 shrink-0">-</span>
                  {item}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </Panel>
  );
}
