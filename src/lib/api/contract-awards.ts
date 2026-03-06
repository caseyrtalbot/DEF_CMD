import type { ContractAward, PaginatedResponse } from "@/lib/types";

const BASE_URL = "https://api.sam.gov/prod/contractdata/v1/search";

function getApiKey(): string {
  const key = process.env.SAM_GOV_API_KEY;
  if (!key) {
    throw new Error("SAM_GOV_API_KEY environment variable is not set");
  }
  return key;
}

/** Convert ISO date string (YYYY-MM-DD) to SAM.gov contract data format (MM/DD/YYYY) */
function toSamDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${month}/${day}/${year}`;
}

export interface ContractAwardFilters {
  agencies?: string[];
  naicsCode?: string;
  vendorName?: string;
  dateSignedFrom?: string; // ISO YYYY-MM-DD
  dateSignedTo?: string;   // ISO YYYY-MM-DD
}

interface SamContractAward {
  piid?: string;
  award_amount?: number | string;
  obligated_amount?: number | string;
  date_signed?: string;
  naics_code?: string;
  psc_code?: string;
  vendor_name?: string;
  vendor_uei?: string;
  dept_name?: string;
  sub_agency_name?: string;
  set_aside_type?: string;
  type_of_competition?: string;
  description_of_requirement?: string;
}

interface SamContractSearchResponse {
  recordCount: number;
  data: SamContractAward[];
}

function normalizeAmount(value: number | string | undefined): number {
  if (value === undefined || value === null) return 0;
  if (typeof value === "number") return value;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
}

function normalizeAward(raw: SamContractAward): ContractAward {
  return {
    id: raw.piid ?? "",
    piid: raw.piid ?? "",
    agencyName: raw.dept_name ?? "Unknown",
    subAgencyName: raw.sub_agency_name ?? null,
    vendorName: raw.vendor_name ?? "Unknown",
    vendorUei: raw.vendor_uei ?? null,
    awardAmount: normalizeAmount(raw.award_amount),
    obligatedAmount: normalizeAmount(raw.obligated_amount),
    signedDate: raw.date_signed ?? "",
    naicsCode: raw.naics_code ?? null,
    psc: raw.psc_code ?? null,
    setAside: raw.set_aside_type ?? null,
    competitionType: raw.type_of_competition ?? null,
    description: raw.description_of_requirement ?? null,
  };
}

function buildSearchParams(
  filters: ContractAwardFilters,
  limit: number,
  offset: number
): URLSearchParams {
  const params = new URLSearchParams();
  params.set("api_key", getApiKey());
  params.set("format", "json");
  params.set("limit", String(limit));
  params.set("offset", String(offset));

  if (filters.agencies?.length) {
    params.set("deptname", filters.agencies.join(","));
  }
  if (filters.naicsCode) {
    params.set("naicsCode", filters.naicsCode);
  }
  if (filters.vendorName) {
    params.set("vendor_name", filters.vendorName);
  }
  if (filters.dateSignedFrom) {
    params.set("date_signed_from", toSamDate(filters.dateSignedFrom));
  }
  if (filters.dateSignedTo) {
    params.set("date_signed_to", toSamDate(filters.dateSignedTo));
  }

  return params;
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
    throw new Error(
      `SAM.gov Contract Awards API error: ${response.status} ${response.statusText}`
    );
  }

  const data: SamContractSearchResponse = await response.json();
  const awards = (data.data ?? []).map(normalizeAward);
  const total = data.recordCount ?? 0;

  return {
    data: awards,
    total,
    page: Math.floor(offset / limit) + 1,
    limit,
    hasMore: offset + limit < total,
  };
}
