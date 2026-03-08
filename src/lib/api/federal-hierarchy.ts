import type { FederalOrg, PaginatedResponse } from "@/lib/types";

const BASE_URL =
  "https://api.sam.gov/prod/federalorganizations/v1/orgs";

function getApiKey(): string {
  const key = process.env.SAM_GOV_API_KEY;
  if (!key) {
    throw new Error("SAM_GOV_API_KEY environment variable is not set");
  }
  return key;
}

// --- Raw SAM.gov response types ---

interface SamFederalOrg {
  fhorgid?: string;
  fhorgname?: string;
  fhorgtype?: string;
  agencycode?: string;
  fhorgparentorgname?: string;
  fhorgparentorgid?: string;
  fhorglevel?: number;
  status?: string;
}

interface SamOrgListResponse {
  totalrecords?: number;
  orgList?: SamFederalOrg[];
}

// --- Normalization ---

function normalizeOrg(raw: SamFederalOrg): FederalOrg {
  return {
    orgKey: raw.fhorgid ?? "",
    name: raw.fhorgname ?? "",
    code: raw.agencycode ?? "",
    level: raw.fhorglevel ?? 0,
    parentOrgKey: raw.fhorgparentorgid ?? null,
    type: raw.fhorgtype ?? "",
    agencyCode: raw.agencycode ?? null,
  };
}

// --- Public API ---

export async function searchOrgs(
  query: string,
  type?: string,
  parentId?: string,
  limit = 25,
  offset = 0
): Promise<PaginatedResponse<FederalOrg>> {
  const params = new URLSearchParams();
  params.set("api_key", getApiKey());
  params.set("fhorgname", query);
  params.set("status", "ACTIVE");
  params.set("limit", String(limit));
  params.set("offset", String(offset));

  if (type) {
    params.set("fhorgtype", type);
  }
  if (parentId) {
    params.set("fhorgparentorgid", parentId);
  }

  const url = `${BASE_URL}?${params.toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    let resetInfo = "";
    if (response.status === 429) {
      const match = body.match(
        /nextAccessTime[^"]*"?:?\s*"?(\d{4}-\w{3}-\d{2}[^"]*)/i
      );
      resetInfo = match ? ` (resets ${match[1].trim()})` : "";
    }
    throw new Error(
      `SAM.gov Federal Hierarchy API error: ${response.status} ${response.statusText}${resetInfo}`
    );
  }

  const data: SamOrgListResponse = await response.json();
  const orgs = (data.orgList ?? []).map(normalizeOrg);
  const total = data.totalrecords ?? 0;

  return {
    data: orgs,
    total,
    page: Math.floor(offset / limit) + 1,
    limit,
    hasMore: offset + limit < total,
  };
}

export async function getOrgTree(
  rootOrgKey?: string,
  limit = 100,
  offset = 0
): Promise<PaginatedResponse<FederalOrg>> {
  const params = new URLSearchParams();
  params.set("api_key", getApiKey());
  params.set("status", "ACTIVE");
  params.set("limit", String(limit));
  params.set("offset", String(offset));

  if (rootOrgKey) {
    params.set("fhorgparentorgid", rootOrgKey);
  }

  const url = `${BASE_URL}?${params.toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    let resetInfo = "";
    if (response.status === 429) {
      const match = body.match(
        /nextAccessTime[^"]*"?:?\s*"?(\d{4}-\w{3}-\d{2}[^"]*)/i
      );
      resetInfo = match ? ` (resets ${match[1].trim()})` : "";
    }
    throw new Error(
      `SAM.gov Federal Hierarchy API error: ${response.status} ${response.statusText}${resetInfo}`
    );
  }

  const data: SamOrgListResponse = await response.json();
  const flatOrgs = (data.orgList ?? []).map(normalizeOrg);
  const total = data.totalrecords ?? 0;

  // Build tree structure: attach children to their parents
  const orgMap = new Map<string, FederalOrg>();
  const roots: FederalOrg[] = [];

  for (const org of flatOrgs) {
    orgMap.set(org.orgKey, { ...org, children: [] });
  }

  for (const org of orgMap.values()) {
    if (org.parentOrgKey && orgMap.has(org.parentOrgKey)) {
      const parent = orgMap.get(org.parentOrgKey)!;
      parent.children = parent.children ?? [];
      parent.children.push(org);
    } else {
      roots.push(org);
    }
  }

  return {
    data: roots,
    total,
    page: Math.floor(offset / limit) + 1,
    limit,
    hasMore: offset + limit < total,
  };
}
