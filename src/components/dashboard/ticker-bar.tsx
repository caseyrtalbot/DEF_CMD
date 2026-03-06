"use client";

const TICKER_ITEMS = [
  { label: "DOD FY26", value: "$961.6B" },
  { label: "RDT&E", value: "$179.1B", change: "+27%" },
  { label: "PROCUREMENT", value: "~$205B" },
  { label: "SPACE FORCE", value: "$39.9B", change: "+36%" },
  { label: "NUCLEAR", value: "~$62B" },
  { label: "NAVY", value: "$292.2B", change: "+13%" },
  { label: "AIR FORCE", value: "$209.6B", change: "+11%" },
  { label: "ARMY", value: "$197.4B", change: "+6%" },
  { label: "F-47 NGAD", value: "$3.5B" },
  { label: "B-21 RAIDER", value: "$10.3B" },
  { label: "COLUMBIA SSBN", value: "$11.2B" },
  { label: "GOLDEN DOME", value: "$25B" },
  { label: "AUTONOMY", value: "$13.4B DOD-WIDE" },
];

export function TickerBar() {
  return (
    <div
      className="flex items-center h-7 bg-ticker border-b border-border overflow-hidden"
      role="marquee"
      aria-label="Key budget figures"
    >
      <div className="flex items-center gap-6 px-4 text-[11px] font-mono-data font-medium text-ticker-fg whitespace-nowrap tracking-wide animate-ticker-scroll">
        {/* Render items twice for seamless loop */}
        {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
          <span key={i} className="inline-flex items-center gap-1">
            <span>
              {item.label}: {item.value}
            </span>
            {item.change && (
              <span className="text-emerald-500">{item.change}</span>
            )}
            {i < TICKER_ITEMS.length * 2 - 1 && (
              <span className="text-ticker-fg/20 mx-2">|</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
