import type { ContractAward, PaginatedResponse } from "@/lib/types";

const BASE_URL = "https://api.sam.gov/contract-awards/v1/search";

function getApiKey(): string {
  const key = process.env.SAM_GOV_API_KEY;
  if (!key) {
    throw new Error("SAM_GOV_API_KEY environment variable is not set");
  }
  return key;
}

/** Convert ISO date string (YYYY-MM-DD) to SAM.gov format (MM/DD/YYYY) */
function toSamDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${month}/${day}/${year}`;
}

/**
 * Build SAM.gov date range: [MM/DD/YYYY,MM/DD/YYYY]
 * Omitting a bound leaves it open-ended.
 */
function toDateRange(from?: string, to?: string): string | null {
  if (!from && !to) return null;
  const fromPart = from ? toSamDate(from) : "";
  const toPart = to ? toSamDate(to) : "";
  return `[${fromPart},${toPart}]`;
}

export interface ContractAwardFilters {
  departmentCode?: string;
  agencies?: string[];
  naicsCode?: string;
  vendorName?: string;
  dateSignedFrom?: string; // ISO YYYY-MM-DD
  dateSignedTo?: string;   // ISO YYYY-MM-DD
}

// --- Raw SAM.gov Contract Awards response types ---

interface SamCodeName {
  code?: string;
  name?: string;
}

interface SamContractId {
  piid?: string;
  modificationNumber?: string;
  subtier?: SamCodeName;
}

interface SamContractingInfo {
  contractingDepartment?: SamCodeName;
  contractingSubtier?: SamCodeName;
  contractingOffice?: SamCodeName;
}

interface SamFederalOrganization {
  contractingInformation?: SamContractingInfo;
}

interface SamAcquisitionData {
  naicsCode?: string;
  productOrServiceCode?: string;
  typeOfSetAside?: SamCodeName;
  extentCompeted?: SamCodeName;
  descriptionOfRequirement?: string;
}

interface SamCoreData {
  federalOrganization?: SamFederalOrganization;
  acquisitionData?: SamAcquisitionData;
}

interface SamDates {
  dateSigned?: string;
}

interface SamDollars {
  actionObligation?: number;
  baseAndAllOptionsValue?: number;
}

interface SamAwardDetails {
  dates?: SamDates;
  dollars?: SamDollars;
}

interface SamAwardeeHeader {
  awardeeName?: string;
  legalBusinessName?: string;
}

interface SamAwardeeUEI {
  uniqueEntityId?: string;
  cageCode?: string;
}

interface SamAwardeeData {
  awardeeHeader?: SamAwardeeHeader;
  awardeeUEIInformation?: SamAwardeeUEI;
}

interface SamAwardSummaryItem {
  contractId?: SamContractId;
  coreData?: SamCoreData;
  awardDetails?: SamAwardDetails;
  awardeeData?: SamAwardeeData;
}

interface SamContractSearchResponse {
  totalRecords?: number;
  awardSummary?: SamAwardSummaryItem[];
}

// --- Normalization ---

function normalizeAward(raw: SamAwardSummaryItem): ContractAward {
  const contracting =
    raw.coreData?.federalOrganization?.contractingInformation;
  const acquisition = raw.coreData?.acquisitionData;
  const dollars = raw.awardDetails?.dollars;
  const awardee = raw.awardeeData;

  return {
    id: raw.contractId?.piid ?? "",
    piid: raw.contractId?.piid ?? "",
    agencyName: contracting?.contractingDepartment?.name ?? "Unknown",
    subAgencyName: contracting?.contractingSubtier?.name ?? null,
    vendorName:
      awardee?.awardeeHeader?.legalBusinessName ??
      awardee?.awardeeHeader?.awardeeName ??
      "Unknown",
    vendorUei: awardee?.awardeeUEIInformation?.uniqueEntityId ?? null,
    awardAmount: dollars?.baseAndAllOptionsValue ?? 0,
    obligatedAmount: dollars?.actionObligation ?? 0,
    signedDate: raw.awardDetails?.dates?.dateSigned ?? "",
    naicsCode: acquisition?.naicsCode ?? null,
    psc: acquisition?.productOrServiceCode ?? null,
    setAside: acquisition?.typeOfSetAside?.name ?? null,
    competitionType: acquisition?.extentCompeted?.name ?? null,
    description: acquisition?.descriptionOfRequirement ?? null,
  };
}

// --- Query builder ---

function buildSearchParams(
  filters: ContractAwardFilters,
  limit: number,
  offset: number
): URLSearchParams {
  const params = new URLSearchParams();
  params.set("api_key", getApiKey());
  params.set("limit", String(Math.min(limit, 100))); // API max is 100
  params.set("offset", String(offset));

  // Prefer department code (e.g. 9700 for DoD) over text-based name filter
  if (filters.departmentCode) {
    params.set("contractingDepartmentCode", filters.departmentCode);
  } else if (filters.agencies?.length) {
    params.set("contractingDepartmentName", filters.agencies[0]);
  }

  if (filters.naicsCode) {
    params.set("naicsCode", filters.naicsCode);
  }
  if (filters.vendorName) {
    params.set("awardeeLegalBusinessName", filters.vendorName);
  }

  const dateRange = toDateRange(filters.dateSignedFrom, filters.dateSignedTo);
  if (dateRange) {
    params.set("dateSigned", dateRange);
  }

  return params;
}

// --- Public API ---

/** Parse SAM.gov throttle response for reset time */
function parseThrottleInfo(body: string): string {
  const match = body.match(
    /nextAccessTime[^"]*"?:?\s*"?(\d{4}-\w{3}-\d{2}[^"]*)/i
  );
  return match ? ` (resets ${match[1].trim()})` : "";
}

export async function searchContractAwards(
  filters: ContractAwardFilters,
  limit = 25,
  offset = 0
): Promise<PaginatedResponse<ContractAward>> {
  const params = buildSearchParams(filters, limit, offset);
  const url = `${BASE_URL}?${params.toString()}`;

  const response = await fetch(url);

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    const resetInfo = response.status === 429 ? parseThrottleInfo(body) : "";
    throw new Error(
      `SAM.gov Contract Awards API error: ${response.status} ${response.statusText}${resetInfo}`
    );
  }

  const data: SamContractSearchResponse = await response.json();
  const awards = (data.awardSummary ?? []).map(normalizeAward);
  const total = data.totalRecords ?? 0;

  return {
    data: awards,
    total,
    page: Math.floor(offset / limit) + 1,
    limit,
    hasMore: offset + limit < total,
  };
}
