"use client";

const KPI_ITEMS = [
  {
    label: "TOTAL DOD FY2026",
    value: "$961.6B",
    sub: "$848.3B BASE + $113.3B RECONCILIATION",
  },
  {
    label: "TOTAL RDT&E",
    value: "$179.1B",
    sub: "+27% VS FY25",
    subClass: "text-emerald-500",
  },
  {
    label: "TOTAL PROCUREMENT",
    value: "~$205B",
    sub: "$153.3B BASE + ~$52B RECONCILIATION",
  },
  {
    label: "PEOS TRACKED",
    value: "52+",
    sub: "ACROSS ALL SERVICES",
  },
];

export function KpiStrip() {
  return (
    <div className="flex gap-2 px-3 py-2 bg-surface-0">
      {KPI_ITEMS.map((item) => (
        <div
          key={item.label}
          className="flex-1 min-w-[120px] px-3 py-2 bg-surface-2 border border-border"
        >
          <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-signal mb-0.5">
            {item.label}
          </div>
          <div className="text-lg font-bold text-foreground font-mono-data tabular-nums leading-tight">
            {item.value}
          </div>
          <div
            className={`text-[10px] uppercase tracking-wide mt-0.5 ${item.subClass ?? "text-muted-foreground"}`}
          >
            {item.sub}
          </div>
        </div>
      ))}
    </div>
  );
}
