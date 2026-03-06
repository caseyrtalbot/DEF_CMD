// Centralized DoD/Defense configuration
// All API clients and routes reference this for consistent defense scoping

/** DoD top-tier agency names as recognized by SAM.gov `deptname` parameter */
export const DOD_AGENCIES = [
  "DEPT OF DEFENSE",
  "DEPT OF THE ARMY",
  "DEPT OF THE NAVY",
  "DEPT OF THE AIR FORCE",
  "DEFENSE LOGISTICS AGENCY",
  "DEFENSE INFORMATION SYSTEMS AGENCY",
  "DEFENSE ADVANCED RESEARCH PROJECTS AGENCY",
  "MISSILE DEFENSE AGENCY",
  "DEFENSE THREAT REDUCTION AGENCY",
  "NATIONAL SECURITY AGENCY",
  "DEFENSE INTELLIGENCE AGENCY",
  "DEFENSE CONTRACT MANAGEMENT AGENCY",
  "DEFENSE HEALTH AGENCY",
  "UNITED STATES SPECIAL OPERATIONS COMMAND",
  "UNITED STATES CYBER COMMAND",
  "SPACE FORCE",
] as const;

/** USASpending.gov uses proper-cased names, not SAM.gov abbreviations */
export const DOD_SPENDING_AGENCY_NAMES = [
  "Department of Defense",
] as const;

/** USASpending.gov agency filter format */
export const DOD_SPENDING_AGENCIES = DOD_SPENDING_AGENCY_NAMES.map((name) => ({
  type: "awarding" as const,
  tier: "toptier" as const,
  name,
}));

/** Defense-relevant NAICS codes with descriptions */
export const DEFENSE_NAICS = [
  { code: "336411", description: "Aircraft Manufacturing" },
  { code: "336414", description: "Guided Missile & Space Vehicle Manufacturing" },
  { code: "336415", description: "Guided Missile & Space Vehicle Parts" },
  { code: "336992", description: "Military Armored Vehicle Manufacturing" },
  { code: "334511", description: "Search, Detection & Navigation Instruments" },
  { code: "334220", description: "Radio & TV Broadcasting Communications Equipment" },
  { code: "334290", description: "Other Communications Equipment" },
  { code: "541330", description: "Engineering Services" },
  { code: "541511", description: "Custom Computer Programming Services" },
  { code: "541512", description: "Computer Systems Design Services" },
  { code: "541519", description: "Other Computer Related Services" },
  { code: "541715", description: "R&D in Physical, Engineering & Life Sciences" },
  { code: "541990", description: "All Other Professional & Technical Services" },
  { code: "561210", description: "Facilities Support Services" },
  { code: "561612", description: "Security Guards & Patrol Services" },
  { code: "611430", description: "Professional & Management Development Training" },
  { code: "928110", description: "National Security" },
] as const;

/** Default NAICS code strings for database preferences */
export const DEFAULT_DEFENSE_NAICS = DEFENSE_NAICS.map((n) => n.code);

/** SAM.gov `deptname` query value — comma-separated for multi-agency search */
export const DOD_DEPT_FILTER = DOD_AGENCIES.join(",");

/** Check if an agency name is a DoD entity */
export function isDodAgency(agencyName: string): boolean {
  const normalized = agencyName.toUpperCase().trim();
  return DOD_AGENCIES.some(
    (dod) =>
      normalized.includes(dod) ||
      dod.includes(normalized) ||
      normalized.includes("DEFENSE") ||
      normalized.includes("MILITARY") ||
      normalized.includes("ARMY") ||
      normalized.includes("NAVY") ||
      normalized.includes("AIR FORCE") ||
      normalized.includes("MARINE") ||
      normalized.includes("SPACE FORCE") ||
      normalized.includes("PENTAGON")
  );
}
