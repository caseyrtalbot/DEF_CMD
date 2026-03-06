import type { FederalRegisterDocument } from "@/lib/types";

const BASE_URL = "https://www.federalregister.gov/api/v1/documents.json";

const DEFENSE_AGENCY_SLUGS = [
  "defense-department",
  "defense-acquisition-regulations-system",
];

const REQUESTED_FIELDS = [
  "document_number",
  "title",
  "type",
  "abstract",
  "publication_date",
  "agencies",
  "html_url",
  "pdf_url",
  "comments_close_on",
  "significant",
];

interface FrAgency {
  name?: string;
  slug?: string;
}

interface FrDocument {
  document_number?: string;
  title?: string;
  type?: string;
  abstract?: string;
  publication_date?: string;
  agencies?: FrAgency[];
  html_url?: string;
  pdf_url?: string;
  comments_close_on?: string;
  significant?: boolean;
}

interface FrSearchResponse {
  count: number;
  results: FrDocument[];
}

// FR API uses abbreviated type codes for filtering, but returns full names in results
const TYPE_TO_FR_CODE: Record<string, string> = {
  rule: "RULE",
  proposed_rule: "PRORULE",
  notice: "NOTICE",
  presidential_document: "PRESDOCU",
};

function toFrTypeCode(input: string): string {
  const lower = input.toLowerCase().replace(/\s+/g, "_");
  return TYPE_TO_FR_CODE[lower] ?? input.toUpperCase();
}

function normalizeDocumentType(
  raw: string | undefined
): FederalRegisterDocument["type"] {
  const lower = (raw ?? "").toLowerCase();
  if (lower === "rule") return "rule";
  if (lower === "proposed rule") return "proposed_rule";
  if (lower === "presidential document") return "presidential_document";
  return "notice";
}

function normalizeDocument(raw: FrDocument): FederalRegisterDocument {
  return {
    id: raw.document_number ?? "",
    documentNumber: raw.document_number ?? "",
    title: raw.title ?? "",
    type: normalizeDocumentType(raw.type),
    abstractText: raw.abstract ?? null,
    publicationDate: raw.publication_date ?? "",
    agencies: (raw.agencies ?? []).map((a) => a.name ?? "Unknown"),
    htmlUrl: raw.html_url ?? "",
    pdfUrl: raw.pdf_url ?? null,
    commentsDue: raw.comments_close_on ?? null,
    significantRule: raw.significant ?? false,
  };
}

function buildSearchParams(
  agencySlugs: string[],
  type?: string,
  dateFrom?: string,
  keyword?: string,
  perPage = 50,
  page = 1
): URLSearchParams {
  const params = new URLSearchParams();

  for (const slug of agencySlugs) {
    params.append("conditions[agencies][]", slug);
  }

  if (type) {
    params.append("conditions[type][]", toFrTypeCode(type));
  }

  if (dateFrom) {
    params.set("conditions[publication_date][gte]", dateFrom);
  }

  if (keyword) {
    params.set("conditions[term]", keyword);
  }

  for (const field of REQUESTED_FIELDS) {
    params.append("fields[]", field);
  }

  params.set("per_page", String(perPage));
  params.set("page", String(page));

  return params;
}

export async function searchDocuments(
  type?: string,
  dateFrom?: string,
  keyword?: string,
  agencySlugs: string[] = DEFENSE_AGENCY_SLUGS,
  perPage = 50,
  page = 1
): Promise<FederalRegisterDocument[]> {
  const params = buildSearchParams(
    agencySlugs,
    type,
    dateFrom,
    keyword,
    perPage,
    page
  );
  const url = `${BASE_URL}?${params.toString()}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Federal Register API error: ${response.status} ${response.statusText}`
    );
  }

  const data: FrSearchResponse = await response.json();
  return (data.results ?? []).map(normalizeDocument);
}
