import type {
  Opportunity,
  NaicsCode,
  PlaceOfPerformance,
  PointOfContact,
  SearchFilters,
  PaginatedResponse,
} from "@/lib/types";

const BASE_URL = "https://govconapi.com/api/v1/opportunities/search";

function getApiKey(): string {
  const key = process.env.GOVCON_API_KEY;
  if (!key) {
    throw new Error("GOVCON_API_KEY environment variable is not set");
  }
  return key;
}

// --- Raw GovCon API response types ---

interface GovConOpportunity {
  notice_id: string;
  title: string;
  notice_type: string;
  notice_base_type: string;
  agency: string;
  naics: string[];
  psc: string[];
  posted_date: string;
  response_deadline: string | null;
  sam_url: string | null;
  ui_link: string | null;
  description_text: string | null;
  solicitation_number: string | null;
  set_aside_type: string | null;
  set_aside_description: string | null;
  organization_type: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  contact_fax: string | null;
  contact_title: string | null;
  primary_contact_type: string | null;
  secondary_contact_name: string | null;
  secondary_contact_email: string | null;
  performance_city_name: string | null;
  performance_state_code: string | null;
  performance_state_name: string | null;
  performance_country_code: string | null;
  performance_country_name: string | null;
  performance_zip: string | null;
  resource_links_array: string[] | null;
  award_number: string | null;
  awardee_name: string | null;
  award_amount: number | null;
  award_date: string | null;
  active: string | null;
}

interface GovConSearchResponse {
  data: GovConOpportunity[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    has_next: boolean;
  };
}

// --- Normalization ---

function normalizeType(noticeType: string): Opportunity["type"] {
  switch (noticeType) {
    case "Presolicitation":
      return "presolicitation";
    case "Combined Synopsis/Solicitation":
      return "combined";
    case "Award Notice":
      return "award";
    case "Solicitation":
    default:
      return "solicitation";
  }
}

/** Extract service branch from dot-separated agency path */
function extractAgency(agencyPath: string): string {
  const parts = agencyPath.split(".");
  // Show service branch (2nd segment) rather than "DEPT OF DEFENSE" for every entry
  if (parts.length > 1) return parts[1].trim();
  return parts[0]?.trim() ?? "Unknown";
}

function extractOffice(agencyPath: string): string | null {
  const parts = agencyPath.split(".");
  if (parts.length <= 2) return null;
  return parts[parts.length - 1]?.trim() ?? null;
}

function normalizePlaceOfPerformance(
  raw: GovConOpportunity
): PlaceOfPerformance | null {
  if (!raw.performance_city_name && !raw.performance_state_code) return null;
  return {
    city: raw.performance_city_name ?? null,
    state: raw.performance_state_code ?? null,
    zip: raw.performance_zip ?? null,
    country: raw.performance_country_code ?? null,
  };
}

function normalizeContacts(raw: GovConOpportunity): PointOfContact[] {
  const contacts: PointOfContact[] = [];
  if (raw.contact_name) {
    contacts.push({
      type: raw.primary_contact_type ?? "primary",
      name: raw.contact_name,
      email: raw.contact_email ?? null,
      phone: raw.contact_phone ?? null,
    });
  }
  if (raw.secondary_contact_name) {
    contacts.push({
      type: "secondary",
      name: raw.secondary_contact_name,
      email: raw.secondary_contact_email ?? null,
      phone: null,
    });
  }
  return contacts;
}

function normalizeNaics(codes: string[]): NaicsCode[] {
  return (codes ?? []).map((code) => ({ code, description: "" }));
}

function normalizeOpportunity(raw: GovConOpportunity): Opportunity {
  return {
    id: raw.notice_id,
    title: raw.title,
    solicitationNumber: raw.solicitation_number ?? null,
    type: normalizeType(raw.notice_type ?? raw.notice_base_type),
    postedDate: raw.posted_date,
    responseDeadline: raw.response_deadline ?? null,
    agency: extractAgency(raw.agency),
    office: extractOffice(raw.agency),
    naicsCodes: normalizeNaics(raw.naics),
    pscCodes: raw.psc ?? [],
    setAside: raw.set_aside_description ?? raw.set_aside_type ?? null,
    classificationCode: raw.psc?.[0] ?? null,
    placeOfPerformance: normalizePlaceOfPerformance(raw),
    pointOfContact: normalizeContacts(raw),
    resourceLinks: raw.resource_links_array ?? [],
    description: raw.description_text ?? null,
    samUrl: raw.sam_url ?? raw.ui_link ?? null,
  };
}

// --- Query builder ---

function buildSearchParams(
  filters: SearchFilters,
  limit: number,
  offset: number
): URLSearchParams {
  const params = new URLSearchParams();
  params.set("limit", String(limit));
  params.set("offset", String(offset));

  if (filters.keywords) {
    params.set("keywords", filters.keywords);
  }
  if (filters.naicsCodes?.length) {
    if (filters.naicsCodes.length === 1) {
      params.set("naics", filters.naicsCodes[0]);
    } else {
      params.set("naics_multiple", filters.naicsCodes.join(","));
    }
  }
  if (filters.agencies?.length) {
    params.set("agency", filters.agencies[0]);
  }
  if (filters.setAsides?.length) {
    params.set("set_aside", filters.setAsides[0]);
  }
  if (filters.psc) {
    params.set("psc", filters.psc);
  }
  if (filters.state) {
    params.set("state", filters.state);
  }
  if (filters.opportunityType) {
    params.set("notice_type", filters.opportunityType);
  }
  if (filters.postedFrom) {
    params.set("posted_after", filters.postedFrom);
  }
  if (filters.dueBefore) {
    params.set("due_before", filters.dueBefore);
  }
  if (filters.sortBy) {
    params.set("sort_by", filters.sortBy);
  }
  if (filters.sortOrder) {
    params.set("sort_order", filters.sortOrder);
  }

  return params;
}

// --- Public API ---

export async function searchOpportunities(
  filters: SearchFilters,
  limit = 25,
  offset = 0
): Promise<PaginatedResponse<Opportunity>> {
  const params = buildSearchParams(filters, limit, offset);
  const url = `${BASE_URL}?${params.toString()}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `GovCon API error: ${response.status} ${response.statusText} — ${body}`
    );
  }

  const data: GovConSearchResponse = await response.json();
  const opportunities = data.data.map(normalizeOpportunity);
  const total = data.pagination.total;

  return {
    data: opportunities,
    total,
    page: Math.floor(offset / limit) + 1,
    limit,
    hasMore: data.pagination.has_next,
  };
}
