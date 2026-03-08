import { NextRequest, NextResponse } from "next/server";
import { searchContractAwards } from "@/lib/api/contract-awards";
import { DOD_DEPARTMENT_CODE } from "@/lib/dod-config";
import type { ContractAwardFilters } from "@/lib/api/contract-awards";

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;

    const filters: ContractAwardFilters = {};

    // Default to DoD via department code 9700; override with specific agencies if provided
    const agencies = params.get("agencies");
    if (agencies) {
      filters.agencies = agencies.split(",");
    } else {
      filters.departmentCode = DOD_DEPARTMENT_CODE;
    }

    const naicsCode = params.get("naicsCode");
    if (naicsCode) filters.naicsCode = naicsCode;

    const vendorName = params.get("vendorName");
    if (vendorName) filters.vendorName = vendorName;

    // Default to last 90 days for contract awards
    const today = new Date();
    const ninetyDaysAgo = new Date(today);
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    filters.dateSignedFrom =
      params.get("dateSignedFrom") ??
      ninetyDaysAgo.toISOString().split("T")[0];
    filters.dateSignedTo =
      params.get("dateSignedTo") ??
      today.toISOString().split("T")[0];

    const limit = parseInt(params.get("limit") ?? "25", 10);
    const offset = parseInt(params.get("offset") ?? "0", 10);

    const result = await searchContractAwards(filters, limit, offset);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    const status = message.includes("429") ? 429 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
