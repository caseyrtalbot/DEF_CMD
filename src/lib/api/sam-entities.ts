import type {
  Entity,
  NaicsCode,
  PointOfContact,
  PaginatedResponse,
} from "@/lib/types";

const BASE_URL = "https://api.sam.gov/entity-information/v3/entities";
const DEFAULT_SECTIONS = "entityRegistration,coreData";

function getApiKey(): string {
  const key = process.env.SAM_GOV_API_KEY;
  if (!key) {
    throw new Error("SAM_GOV_API_KEY environment variable is not set");
  }
  return key;
}

interface SamNaicsEntry {
  naicsCode?: string;
  naicsDescription?: string;
}

interface SamPointOfContact {
  firstName?: string;
  lastName?: string;
  middleInitial?: string;
  title?: string;
  emailAddress?: string;
  telephoneNumber?: string;
}

interface SamPhysicalAddress {
  city?: string;
  stateOrProvinceCode?: string;
  zipCode?: string;
  countryCode?: string;
}

interface SamEntityData {
  entityRegistration?: {
    ueiSAM?: string;
    cageCode?: string;
    legalBusinessName?: string;
    registrationStatus?: string;
    businessType?: string;
    profitStructure?: string;
  };
  coreData?: {
    physicalAddress?: SamPhysicalAddress;
    naicsCodeList?: SamNaicsEntry[];
    sbaBusinessTypeList?: { sbaBusinessType?: string }[];
    pointOfContactList?: SamPointOfContact[];
    generalInformation?: {
      entityStructureDesc?: string;
      organizationStructureDesc?: string;
    };
  };
}

interface SamEntitiesResponse {
  totalRecords: number;
  entityData: SamEntityData[];
}

function normalizeNaicsCodes(
  raw: SamNaicsEntry[] | undefined
): NaicsCode[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw.map((entry) => ({
    code: entry.naicsCode ?? "",
    description: entry.naicsDescription ?? "",
  }));
}

function normalizePointOfContact(
  raw: SamPointOfContact[] | undefined
): PointOfContact | null {
  if (!raw || !Array.isArray(raw) || raw.length === 0) return null;
  const poc = raw[0];
  const nameParts = [poc.firstName, poc.middleInitial, poc.lastName].filter(
    Boolean
  );
  return {
    type: poc.title ?? "primary",
    name: nameParts.join(" "),
    email: poc.emailAddress ?? null,
    phone: poc.telephoneNumber ?? null,
  };
}

function normalizeSocioeconomicStatuses(
  raw: { sbaBusinessType?: string }[] | undefined
): string[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw
    .map((entry) => entry.sbaBusinessType)
    .filter((s): s is string => s != null);
}

function normalizeEntity(raw: SamEntityData): Entity {
  const reg = raw.entityRegistration;
  const core = raw.coreData;
  const addr = core?.physicalAddress;

  return {
    uei: reg?.ueiSAM ?? "",
    cageCode: reg?.cageCode ?? null,
    legalBusinessName: reg?.legalBusinessName ?? "",
    registrationStatus: reg?.registrationStatus ?? "",
    physicalAddress: {
      city: addr?.city ?? null,
      state: addr?.stateOrProvinceCode ?? null,
      zip: addr?.zipCode ?? null,
      country: addr?.countryCode ?? null,
    },
    naicsCodes: normalizeNaicsCodes(core?.naicsCodeList),
    socioeconomicStatuses: normalizeSocioeconomicStatuses(
      core?.sbaBusinessTypeList
    ),
    businessType: reg?.businessType ?? null,
    profitStructure: reg?.profitStructure ?? null,
    pointOfContact: normalizePointOfContact(core?.pointOfContactList),
  };
}

export async function searchEntities(
  query: string,
  limit = 25,
  offset = 0
): Promise<PaginatedResponse<Entity>> {
  const params = new URLSearchParams();
  params.set("api_key", getApiKey());
  params.set("q", query);
  params.set("includeSections", DEFAULT_SECTIONS);
  params.set("limit", String(limit));
  params.set("offset", String(offset));

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
      `SAM.gov Entity API error: ${response.status} ${response.statusText}${resetInfo}`
    );
  }

  const data: SamEntitiesResponse = await response.json();
  const entities = (data.entityData ?? []).map(normalizeEntity);
  const total = data.totalRecords ?? 0;

  return {
    data: entities,
    total,
    page: Math.floor(offset / limit) + 1,
    limit,
    hasMore: offset + limit < total,
  };
}

export async function getEntityByUei(
  uei: string
): Promise<Entity | null> {
  const params = new URLSearchParams();
  params.set("api_key", getApiKey());
  params.set("ueiSAM", uei);
  params.set("includeSections", DEFAULT_SECTIONS);
  params.set("limit", "1");

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
      `SAM.gov Entity API error: ${response.status} ${response.statusText}${resetInfo}`
    );
  }

  const data: SamEntitiesResponse = await response.json();
  const entities = data.entityData ?? [];

  if (entities.length === 0) return null;

  return normalizeEntity(entities[0]);
}

export async function getEntitiesByNaics(
  naicsCode: string,
  limit = 25,
  offset = 0
): Promise<PaginatedResponse<Entity>> {
  const params = new URLSearchParams();
  params.set("api_key", getApiKey());
  params.set("naicsCode", naicsCode);
  params.set("includeSections", DEFAULT_SECTIONS);
  params.set("limit", String(limit));
  params.set("offset", String(offset));

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
      `SAM.gov Entity API error: ${response.status} ${response.statusText}${resetInfo}`
    );
  }

  const data: SamEntitiesResponse = await response.json();
  const entities = (data.entityData ?? []).map(normalizeEntity);
  const total = data.totalRecords ?? 0;

  return {
    data: entities,
    total,
    page: Math.floor(offset / limit) + 1,
    limit,
    hasMore: offset + limit < total,
  };
}
