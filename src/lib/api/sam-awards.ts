import type { Award, PaginatedResponse } from "@/lib/types";

const BASE_URL = "https://api.sam.gov/opportunities/v2/search";

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

export interface AwardSearchFilters {
  naicsCode?: string;
  agency?: string;
  vendor?: string;
  postedFrom?: string;
  postedTo?: string;
}

interface SamAwardData {
  noticeId?: string;
  title?: string;
  solicitationNumber?: string;
  department?: string;
  office?: string;
  postedDate?: string;
  responseDeadLine?: string;
  typeOfSetAside?: string;
  naicsCode?: { code?: string }[];
  description?: string;
  awardNumber?: string;
  awardAmount?: number | string;
  awardee?: {
    name?: string;
    ueiSAM?: string;
  };
  award?: {
    amount?: number | string;
    date?: string;
    number?: string;
    lineItemNumber?: string;
    awardee?: {
      name?: string;
      ueiSAM?: string;
    };
  };
}

interface SamSearchResponse {
  totalRecords: number;
  opportunitiesData: SamAwardData[];
}

function normalizeAward(raw: SamAwardData): Award {
  const awardee = raw.award?.awardee ?? raw.awardee;
  const rawAmount = raw.award?.amount ?? raw.awardAmount;
  const amount = typeof rawAmount === "string" ? parseFloat(rawAmount) : (rawAmount ?? 0);

  return {
    id: raw.noticeId ?? "",
    piid: raw.award?.number ?? raw.awardNumber ?? raw.solicitationNumber ?? "",
    agencyId: "",
    agencyName: raw.department ?? "",
    vendorName: awardee?.name ?? "",
    vendorUei: awardee?.ueiSAM ?? null,
    awardAmount: amount,
    obligatedAmount: amount,
    signedDate: raw.award?.date ?? raw.postedDate ?? "",
    effectiveDate: raw.postedDate ?? "",
    completionDate: raw.responseDeadLine ?? null,
    naicsCode: raw.naicsCode?.[0]?.code ?? null,
    competitionType: null,
    setAside: raw.typeOfSetAside ?? null,
    contractType: null,
    description: raw.description ?? null,
  };
}

export async function searchAwards(
  filters: AwardSearchFilters,
  limit = 25,
  offset = 0
): Promise<PaginatedResponse<Award>> {
  const params = new URLSearchParams();
  params.set("api_key", getApiKey());
  params.set("limit", String(limit));
  params.set("offset", String(offset));
  params.set("ptype", "a"); // award type only

  if (filters.naicsCode) {
    params.set("naicsCode", filters.naicsCode);
  }
  if (filters.agency) {
    params.set("deptname", filters.agency);
  }
  if (filters.vendor) {
    params.set("title", filters.vendor);
  }
  if (filters.postedFrom) {
    params.set("postedFrom", toSamDate(filters.postedFrom));
  }
  if (filters.postedTo) {
    params.set("postedTo", toSamDate(filters.postedTo));
  }

  const url = `${BASE_URL}?${params.toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `SAM.gov Awards API error: ${response.status} ${response.statusText}`
    );
  }

  const data: SamSearchResponse = await response.json();
  const awards = (data.opportunitiesData ?? []).map(normalizeAward);
  const total = data.totalRecords ?? 0;

  return {
    data: awards,
    total,
    page: Math.floor(offset / limit) + 1,
    limit,
    hasMore: offset + limit < total,
  };
}
