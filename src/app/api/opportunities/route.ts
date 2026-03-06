import { NextRequest, NextResponse } from "next/server";
import { searchOpportunities } from "@/lib/api/sam-opportunities";
import type { SearchFilters } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;

    const filters: SearchFilters = {};

    const keywords = params.get("keywords");
    if (keywords) filters.keywords = keywords;

    const naicsCodes = params.get("naicsCodes");
    if (naicsCodes) filters.naicsCodes = naicsCodes.split(",");

    const agencies = params.get("agencies");
    if (agencies) filters.agencies = agencies.split(",");

    const setAsides = params.get("setAsides");
    if (setAsides) filters.setAsides = setAsides.split(",");

    const postedFrom = params.get("postedFrom");
    if (postedFrom) filters.postedFrom = postedFrom;

    const postedTo = params.get("postedTo");
    if (postedTo) filters.postedTo = postedTo;

    const type = params.get("type");
    if (type) filters.opportunityType = type;

    const limit = parseInt(params.get("limit") ?? "25", 10);
    const offset = parseInt(params.get("offset") ?? "0", 10);

    const result = await searchOpportunities(filters, limit, offset);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
