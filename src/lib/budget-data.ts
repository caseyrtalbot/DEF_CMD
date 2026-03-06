export interface ServiceBudgetComparison {
  service: string;
  fy25: string;
  fy26: string;
  change: string;
}

export interface RdteBreakdown {
  service: string;
  fy25: string;
  fy26base: string;
  fy26recon: string;
  fy26total: string;
}

export const SERVICE_BUDGET_COMPARISON: ServiceBudgetComparison[] = [
  { service: "Army", fy25: "$185.8B", fy26: "$197.4B", change: "+6.2%" },
  { service: "Navy (incl. USMC)", fy25: "$257.6B", fy26: "$292.2B", change: "+13.4%" },
  { service: "Air Force", fy25: "$188.1B", fy26: "$209.6B", change: "+11.4%" },
  { service: "Space Force", fy25: "$29.4B", fy26: "$39.9B", change: "+35.7%" },
  { service: "Defense-Wide", fy25: "~$170B", fy26: "$170.9B", change: "~flat" },
  { service: "TOTAL DoD", fy25: "~$895B", fy26: "$961.6B", change: "+13.4%" },
];

export const RDTE_BREAKDOWN: RdteBreakdown[] = [
  { service: "Air Force", fy25: "$47.69B", fy26base: "$52.02B", fy26recon: "$10.23B", fy26total: "$62.24B" },
  { service: "Defense-Wide", fy25: "$37.82B", fy26base: "$33.92B", fy26recon: "$8.90B", fy26total: "$42.82B" },
  { service: "Space Force", fy25: "$18.53B", fy26base: "$15.49B", fy26recon: "$13.55B", fy26total: "$29.03B" },
  { service: "Navy", fy25: "$27.00B", fy26base: "$25.71B", fy26recon: "$3.45B", fy26total: "$29.16B" },
  { service: "Army", fy25: "$17.12B", fy26base: "$14.55B", fy26recon: "$0.85B", fy26total: "$15.40B" },
  { service: "TOTAL", fy25: "$149.50B", fy26base: "$142.00B", fy26recon: "$37.07B", fy26total: "$179.07B" },
];

export const PROCUREMENT_HIGHLIGHTS: string[] = [
  "Total DoD Procurement: ~$205B ($153.3B base + ~$52B reconciliation)",
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

export const BUDGET_LINKS: { label: string; url: string }[] = [
  { label: "DoD Budget Materials (Main)", url: "https://comptroller.defense.gov/Budget-Materials/" },
  { label: "P-1 Procurement Programs", url: "https://comptroller.war.gov/Portals/45/Documents/defbudget/FY2026/FY2026_p1.pdf" },
  { label: "R-1 RDT&E Programs", url: "https://comptroller.war.gov/Portals/45/Documents/defbudget/FY2026/FY2026_r1.pdf" },
  { label: "Army Budget Materials", url: "https://www.asafm.army.mil/Budget-Materials/" },
  { label: "Navy FY2026 Budget", url: "https://www.secnav.navy.mil/fmc/fmb/Pages/Fiscal-Year-2026.aspx" },
  { label: "Air Force FY2026 Budget", url: "https://www.saffm.hq.af.mil/FM-Resources/Budget/Air-Force-Presidents-Budget-FY26/" },
];

export const TICKER_ITEMS: string[] = [
  "DOD FY26: $961.6B",
  "RDT&E: $179.1B +27%",
  "PROCUREMENT: ~$205B",
  "SPACE FORCE: $39.9B +36%",
  "NUCLEAR: ~$62B",
  "NAVY: $292.2B +13%",
  "AIR FORCE: $209.6B +11%",
  "ARMY: $197.4B +6%",
  "F-47 NGAD: $3.5B",
  "B-21 RAIDER: $10.3B",
  "COLUMBIA SSBN: $11.2B",
  "GOLDEN DOME: $25B",
  "AUTONOMY: $13.4B DOD-WIDE",
];

export const SERVICE_COLORS: Record<string, string> = {
  navy: "#4488cc",
  army: "#88aa44",
  airforce: "#6688dd",
  spaceforce: "#aaaacc",
  defensewide: "#ccaa44",
};

export function parseBudget(str: string): number {
  if (!str) return 0;
  const clean = str.replace(/[~$,>]/g, "").trim();
  const matchB = clean.match(/([\d.]+)\s*B/i);
  if (matchB) return parseFloat(matchB[1]);
  const matchM = clean.match(/([\d.]+)\s*M/i);
  if (matchM) return parseFloat(matchM[1]) / 1000;
  return 0;
}

export function parseChange(str: string): number {
  if (!str) return 0;
  if (str.includes("flat")) return 0;
  const match = str.match(/([+-]?[\d.]+)%/);
  return match ? parseFloat(match[1]) : 0;
}

export function classifyStatus(status: string): "green" | "amber" | "red" | "gray" {
  const s = status.toLowerCase();
  if (
    s.includes("production") ||
    s.includes("operational") ||
    s.includes("fielding") ||
    s.includes("commissioned") ||
    s.includes("in service") ||
    s.includes("deployed") ||
    s.includes("fielded") ||
    s.includes("active")
  )
    return "green";
  if (
    s.includes("delay") ||
    s.includes("paused") ||
    s.includes("restructure") ||
    s.includes("retire") ||
    s.includes("wind-down") ||
    s.includes("scaled back") ||
    s.includes("cancelled") ||
    s.includes("deferred")
  )
    return "red";
  if (s.includes("classified") || s.includes("tbd") || s.includes("included")) return "gray";
  return "amber";
}
