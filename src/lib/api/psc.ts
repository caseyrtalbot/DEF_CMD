import type { ProductServiceCode } from "@/lib/types";

const BASE_URL =
  "https://api.sam.gov/prod/locationservices/v1/api/publicPSCDetails";

interface SamPscItem {
  pscCode?: string;
  pscName?: string;
  pscFullName?: string;
  activeInd?: string;
  parentPscCode?: string;
  startDate?: string;
  endDate?: string;
}

interface SamPscResponse {
  productServiceCodeList: SamPscItem[];
}

function normalizeStatus(activeInd?: string): "active" | "inactive" {
  return activeInd?.toUpperCase() === "Y" ? "active" : "inactive";
}

function normalizePsc(raw: SamPscItem): ProductServiceCode {
  return {
    code: raw.pscCode ?? "",
    description: raw.pscFullName ?? raw.pscName ?? "",
    parentCode: raw.parentPscCode ?? null,
    status: normalizeStatus(raw.activeInd),
  };
}

export async function searchPSCCodes(
  searchText?: string,
  code?: string
): Promise<ProductServiceCode[]> {
  const params = new URLSearchParams();
  params.set("status", "Active");
  params.set("limit", "50");
  params.set("offset", "0");

  if (searchText) {
    params.set("searchText", searchText);
  }
  if (code) {
    params.set("pscCode", code);
  }

  const url = `${BASE_URL}?${params.toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `SAM.gov PSC API error: ${response.status} ${response.statusText}`
    );
  }

  const data: SamPscResponse = await response.json();
  const items = data.productServiceCodeList ?? [];

  return items.map(normalizePsc);
}
