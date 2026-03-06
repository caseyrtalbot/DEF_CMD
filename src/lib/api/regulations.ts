import type { RegulationDocument } from "@/lib/types";

const BASE_URL = "https://api.regulations.gov/v4/documents";

function getApiKey(): string | null {
  return process.env.REGULATIONS_GOV_API_KEY ?? null;
}

interface RegApiAttributes {
  documentId?: string;
  title?: string;
  documentType?: string;
  agencyId?: string;
  postedDate?: string;
  commentEndDate?: string;
  numberOfCommentsReceived?: number;
  summary?: string;
  objectId?: string;
}

interface RegApiResource {
  id?: string;
  attributes?: RegApiAttributes;
}

interface RegApiResponse {
  data?: RegApiResource[];
}

function normalizeDocumentType(
  raw: string | undefined
): RegulationDocument["type"] {
  const lower = (raw ?? "").toLowerCase();
  if (lower === "rule") return "Rule";
  if (lower === "proposed rule") return "Proposed Rule";
  if (lower === "notice") return "Notice";
  return "Other";
}

function normalizeDocument(raw: RegApiResource): RegulationDocument {
  const attrs = raw.attributes ?? {};
  const documentId = attrs.documentId ?? raw.id ?? "";

  return {
    id: raw.id ?? "",
    documentId,
    title: attrs.title ?? "",
    type: normalizeDocumentType(attrs.documentType),
    agency: attrs.agencyId ?? "",
    postedDate: attrs.postedDate ?? "",
    commentsDue: attrs.commentEndDate ?? null,
    commentCount: attrs.numberOfCommentsReceived ?? 0,
    summary: attrs.summary ?? null,
    htmlUrl: `https://www.regulations.gov/document/${documentId}`,
  };
}

function buildSearchParams(
  keyword?: string,
  documentType?: string,
  agency = "DOD",
  pageSize = 25,
  pageNumber = 1
): URLSearchParams {
  const params = new URLSearchParams();

  params.set("filter[agencyId]", agency);
  params.set("sort", "-postedDate");
  params.set("page[size]", String(pageSize));
  params.set("page[number]", String(pageNumber));

  if (keyword) {
    params.set("filter[searchTerm]", keyword);
  }

  if (documentType) {
    params.set("filter[documentType]", documentType);
  }

  return params;
}

export async function searchRegulations(
  keyword?: string,
  documentType?: string,
  agency = "DOD",
  pageSize = 25,
  pageNumber = 1
): Promise<RegulationDocument[]> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return [];
  }

  const params = buildSearchParams(
    keyword,
    documentType,
    agency,
    pageSize,
    pageNumber
  );
  const url = `${BASE_URL}?${params.toString()}`;

  const response = await fetch(url, {
    headers: {
      "X-Api-Key": apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Regulations.gov API error: ${response.status} ${response.statusText}`
    );
  }

  const data: RegApiResponse = await response.json();
  return (data.data ?? []).map(normalizeDocument);
}
