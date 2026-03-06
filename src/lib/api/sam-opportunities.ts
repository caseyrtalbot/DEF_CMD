import type {
  Opportunity,
  NaicsCode,
  PlaceOfPerformance,
  PointOfContact,
  SearchFilters,
  PaginatedResponse,
} from "@/lib/types";

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

/** Map SAM.gov opportunity type string to our normalized type */
function normalizeType(typeStr: string): Opportunity["type"] {
  const lower = typeStr.toLowerCase();
  if (lower.includes("presolicitation")) return "presolicitation";
  if (lower.includes("award")) return "award";
  if (lower.includes("combined")) return "combined";
  if (lower.includes("solicitation")) return "solicitation";
  // Single-letter codes
  const codeMap: Record<string, Opportunity["type"]> = { p: "presolicitation", o: "solicitation", k: "combined", a: "award" };
  return codeMap[lower] ?? "solicitation";
}

interface SamPointOfContact {
  type?: string;
  fullName?: string;
  email?: string;
  phone?: string;
}

interface SamPlaceOfPerformance {
  city?: { code?: string; name?: string };
  state?: { code?: string; name?: string };
  zip?: string;
  country?: { code?: string; name?: string };
}

interface SamAward {
  date?: string;
  number?: string;
  amount?: string;
  awardee?: {
    name?: string;
    ueiSAM?: string;
    cageCode?: string;
  };
}

interface SamOpportunity {
  noticeId?: string;
  title?: string;
  solicitationNumber?: string;
  postedDate?: string;
  type?: string;
  baseType?: string;
  responseDeadLine?: string;
  typeOfSetAside?: string;
  typeOfSetAsideDescription?: string;
  naicsCode?: string;
  naicsCodes?: string[];
  classificationCode?: string;
  pointOfContact?: SamPointOfContact[];
  placeOfPerformance?: SamPlaceOfPerformance;
  resourceLinks?: string[] | null;
  description?: string;
  fullParentPathName?: string;
  organizationType?: string;
  award?: SamAward | null;
  uiLink?: string;
}

interface SamSearchResponse {
  totalRecords: number;
  opportunitiesData: SamOpportunity[];
}

function normalizePlaceOfPerformance(
  raw: SamPlaceOfPerformance | undefined
): PlaceOfPerformance | null {
  if (!raw) return null;
  return {
    city: raw.city?.name ?? null,
    state: raw.state?.code ?? raw.state?.name ?? null,
    zip: raw.zip ?? null,
    country: raw.country?.code ?? raw.country?.name ?? null,
  };
}

function normalizePointOfContact(
  raw: SamPointOfContact[] | undefined
): PointOfContact[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw.map((poc) => ({
    type: poc.type ?? "primary",
    name: poc.fullName ?? "",
    email: poc.email ?? null,
    phone: poc.phone ?? null,
  }));
}

function normalizeNaicsCodes(
  naicsCode?: string,
  naicsCodes?: string[]
): NaicsCode[] {
  const codes = naicsCodes ?? (naicsCode ? [naicsCode] : []);
  return codes.map((code) => ({
    code,
    description: "",
  }));
}

function extractAgency(fullParentPathName?: string): string {
  if (!fullParentPathName) return "Unknown";
  const parts = fullParentPathName.split(".");
  return parts[0]?.trim() ?? "Unknown";
}

function extractOffice(fullParentPathName?: string): string | null {
  if (!fullParentPathName) return null;
  const parts = fullParentPathName.split(".");
  return parts.length > 1 ? parts[parts.length - 1]?.trim() ?? null : null;
}

function normalizeOpportunity(raw: SamOpportunity): Opportunity {
  return {
    id: raw.noticeId ?? "",
    title: raw.title ?? "",
    solicitationNumber: raw.solicitationNumber ?? null,
    type: normalizeType(raw.type ?? raw.baseType ?? ""),
    postedDate: raw.postedDate ?? "",
    responseDeadline: raw.responseDeadLine ?? null,
    agency: extractAgency(raw.fullParentPathName),
    office: extractOffice(raw.fullParentPathName),
    naicsCodes: normalizeNaicsCodes(raw.naicsCode, raw.naicsCodes),
    setAside: raw.typeOfSetAsideDescription ?? raw.typeOfSetAside ?? null,
    classificationCode: raw.classificationCode ?? null,
    placeOfPerformance: normalizePlaceOfPerformance(raw.placeOfPerformance),
    pointOfContact: normalizePointOfContact(raw.pointOfContact),
    resourceLinks: raw.resourceLinks ?? [],
    description: raw.description ?? null,
  };
}

function buildSearchParams(
  filters: SearchFilters,
  limit: number,
  offset: number
): URLSearchParams {
  const params = new URLSearchParams();
  params.set("api_key", getApiKey());
  params.set("limit", String(limit));
  params.set("offset", String(offset));

  if (filters.keywords) {
    params.set("title", filters.keywords);
  }
  if (filters.naicsCodes?.length) {
    params.set("naicsCode", filters.naicsCodes.join(","));
  }
  if (filters.agencies?.length) {
    params.set("deptname", filters.agencies.join(","));
  }
  if (filters.setAsides?.length) {
    params.set("typeOfSetAside", filters.setAsides.join(","));
  }
  if (filters.postedFrom) {
    params.set("postedFrom", toSamDate(filters.postedFrom));
  }
  if (filters.postedTo) {
    params.set("postedTo", toSamDate(filters.postedTo));
  }
  if (filters.opportunityType) {
    params.set("ptype", filters.opportunityType);
  }

  return params;
}

export async function searchOpportunities(
  filters: SearchFilters,
  limit = 25,
  offset = 0
): Promise<PaginatedResponse<Opportunity>> {
  const params = buildSearchParams(filters, limit, offset);
  const url = `${BASE_URL}?${params.toString()}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `SAM.gov Opportunities API error: ${response.status} ${response.statusText}`
    );
  }

  const data: SamSearchResponse = await response.json();
  const opportunities = (data.opportunitiesData ?? []).map(normalizeOpportunity);
  const total = data.totalRecords ?? 0;

  return {
    data: opportunities,
    total,
    page: Math.floor(offset / limit) + 1,
    limit,
    hasMore: offset + limit < total,
  };
}

export async function getOpportunityById(
  noticeId: string
): Promise<Opportunity | null> {
  const params = new URLSearchParams();
  params.set("api_key", getApiKey());
  params.set("noticeid", noticeId);
  params.set("limit", "1");

  const url = `${BASE_URL}?${params.toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `SAM.gov Opportunities API error: ${response.status} ${response.statusText}`
    );
  }

  const data: SamSearchResponse = await response.json();
  const opportunities = data.opportunitiesData ?? [];

  if (opportunities.length === 0) return null;

  return normalizeOpportunity(opportunities[0]);
}
