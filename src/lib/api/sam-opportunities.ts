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

/** Map SAM.gov opportunity type codes to our normalized type */
function normalizeType(
  ptype: string
): Opportunity["type"] {
  const typeMap: Record<string, Opportunity["type"]> = {
    p: "presolicitation",
    o: "solicitation",
    k: "combined",
    a: "award",
  };
  return typeMap[ptype?.toLowerCase()] ?? "solicitation";
}

interface SamPointOfContact {
  type?: string;
  fullName?: string;
  email?: string;
  phone?: string;
}

interface SamPlaceOfPerformance {
  city?: { name?: string };
  state?: { code?: string; name?: string };
  zip?: string;
  country?: { code?: string; name?: string };
}

interface SamNaicsCode {
  code?: string;
  description?: string;
}

interface SamOpportunity {
  noticeId?: string;
  title?: string;
  solicitationNumber?: string;
  postedDate?: string;
  type?: string;
  responseDeadLine?: string;
  typeOfSetAside?: string;
  naicsCode?: SamNaicsCode[];
  classificationCode?: { code?: string }[];
  pointOfContact?: SamPointOfContact[];
  placeOfPerformance?: SamPlaceOfPerformance;
  resourceLinks?: string[];
  description?: string;
  department?: string;
  office?: string;
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
  raw: SamNaicsCode[] | undefined
): NaicsCode[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw.map((n) => ({
    code: n.code ?? "",
    description: n.description ?? "",
  }));
}

function normalizeOpportunity(raw: SamOpportunity): Opportunity {
  return {
    id: raw.noticeId ?? "",
    title: raw.title ?? "",
    solicitationNumber: raw.solicitationNumber ?? null,
    type: normalizeType(raw.type ?? ""),
    postedDate: raw.postedDate ?? "",
    responseDeadline: raw.responseDeadLine ?? null,
    agency: raw.department ?? "",
    office: raw.office ?? null,
    naicsCodes: normalizeNaicsCodes(raw.naicsCode),
    setAside: raw.typeOfSetAside ?? null,
    classificationCode: raw.classificationCode?.[0]?.code ?? null,
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
