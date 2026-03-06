import { NextRequest, NextResponse } from "next/server";
import { searchAwards } from "@/lib/api/sam-awards";
import type { AwardSearchFilters } from "@/lib/api/sam-awards";

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;

    const filters: AwardSearchFilters = {};

    const naicsCode = params.get("naicsCode");
    if (naicsCode) filters.naicsCode = naicsCode;

    const agency = params.get("agency");
    if (agency) filters.agency = agency;

    const vendor = params.get("vendor");
    if (vendor) filters.vendor = vendor;

    // SAM.gov requires date range — default to last 30 days
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    filters.postedFrom = params.get("postedFrom") ?? thirtyDaysAgo.toISOString().split("T")[0];
    filters.postedTo = params.get("postedTo") ?? today.toISOString().split("T")[0];

    const limit = parseInt(params.get("limit") ?? "25", 10);
    const offset = parseInt(params.get("offset") ?? "0", 10);

    const result = await searchAwards(filters, limit, offset);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
