// Armed service branch definitions for filtering and visual identity

export interface Branch {
  id: string;
  name: string;
  abbr: string;
  /** SAM.gov department names for filtering */
  samAgencies: string[];
  /** USASpending.gov toptier agency name */
  spendingAgency: string;
  /** Primary brand color (CSS value) */
  color: string;
  /** Muted/background variant */
  colorMuted: string;
  /** Border accent */
  colorBorder: string;
  /** Key NAICS codes relevant to this branch */
  naicsCodes: string[];
}

export const BRANCHES: Branch[] = [
  {
    id: "all",
    name: "All DoD",
    abbr: "DoD",
    samAgencies: [],
    spendingAgency: "Department of Defense",
    color: "#f59e0b",
    colorMuted: "rgba(245,158,11,0.12)",
    colorBorder: "rgba(245,158,11,0.3)",
    naicsCodes: [],
  },
  {
    id: "army",
    name: "U.S. Army",
    abbr: "USA",
    samAgencies: ["DEPT OF THE ARMY"],
    spendingAgency: "Department of Defense",
    color: "#4d7c0f",
    colorMuted: "rgba(77,124,15,0.12)",
    colorBorder: "rgba(77,124,15,0.3)",
    naicsCodes: ["336992", "541330", "541512", "561210"],
  },
  {
    id: "navy",
    name: "U.S. Navy",
    abbr: "USN",
    samAgencies: ["DEPT OF THE NAVY"],
    spendingAgency: "Department of Defense",
    color: "#1d4ed8",
    colorMuted: "rgba(29,78,216,0.12)",
    colorBorder: "rgba(29,78,216,0.3)",
    naicsCodes: ["336611", "336414", "541330", "541715"],
  },
  {
    id: "usaf",
    name: "U.S. Air Force",
    abbr: "USAF",
    samAgencies: ["DEPT OF THE AIR FORCE"],
    spendingAgency: "Department of Defense",
    color: "#2563eb",
    colorMuted: "rgba(37,99,235,0.12)",
    colorBorder: "rgba(37,99,235,0.3)",
    naicsCodes: ["336411", "336414", "334511", "541715"],
  },
  {
    id: "darpa",
    name: "DARPA",
    abbr: "DARPA",
    samAgencies: ["DEFENSE ADVANCED RESEARCH PROJECTS AGENCY"],
    spendingAgency: "Department of Defense",
    color: "#7c3aed",
    colorMuted: "rgba(124,58,237,0.12)",
    colorBorder: "rgba(124,58,237,0.3)",
    naicsCodes: ["541715", "541511", "541512", "541519"],
  },
  {
    id: "mda",
    name: "Missile Defense",
    abbr: "MDA",
    samAgencies: ["MISSILE DEFENSE AGENCY"],
    spendingAgency: "Department of Defense",
    color: "#dc2626",
    colorMuted: "rgba(220,38,38,0.12)",
    colorBorder: "rgba(220,38,38,0.3)",
    naicsCodes: ["336414", "336415", "334511"],
  },
  {
    id: "socom",
    name: "SOCOM",
    abbr: "SOCOM",
    samAgencies: ["UNITED STATES SPECIAL OPERATIONS COMMAND"],
    spendingAgency: "Department of Defense",
    color: "#b91c1c",
    colorMuted: "rgba(185,28,28,0.12)",
    colorBorder: "rgba(185,28,28,0.3)",
    naicsCodes: ["541512", "334290", "561612"],
  },
  {
    id: "disa",
    name: "DISA",
    abbr: "DISA",
    samAgencies: ["DEFENSE INFORMATION SYSTEMS AGENCY"],
    spendingAgency: "Department of Defense",
    color: "#0891b2",
    colorMuted: "rgba(8,145,178,0.12)",
    colorBorder: "rgba(8,145,178,0.3)",
    naicsCodes: ["541512", "541511", "334290", "541519"],
  },
  {
    id: "dla",
    name: "DLA",
    abbr: "DLA",
    samAgencies: ["DEFENSE LOGISTICS AGENCY"],
    spendingAgency: "Department of Defense",
    color: "#059669",
    colorMuted: "rgba(5,150,105,0.12)",
    colorBorder: "rgba(5,150,105,0.3)",
    naicsCodes: ["561210", "336992", "332994"],
  },
];

export function getBranchById(id: string): Branch {
  return BRANCHES.find((b) => b.id === id) ?? BRANCHES[0];
}

export function getBranchSamFilter(branch: Branch): string[] {
  if (branch.id === "all") return [];
  return branch.samAgencies;
}
