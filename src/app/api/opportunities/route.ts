import { NextRequest, NextResponse } from "next/server";
import { searchOpportunities } from "@/lib/api/govcon-opportunities";
import type { SearchFilters } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;

    const filters: SearchFilters = {};

    const keywords = params.get("keywords");
    if (keywords) filters.keywords = keywords;

    const naicsCodes = params.get("naicsCodes");
    if (naicsCodes) filters.naicsCodes = naicsCodes.split(",");

    // Default to all DoD via agency filter; branch-specific agencies override
    const agencies = params.get("agencies");
    filters.agencies = agencies
      ? agencies.split(",")
      : ["DEPT OF DEFENSE"];

    const setAsides = params.get("setAsides");
    if (setAsides) filters.setAsides = setAsides.split(",");

    const psc = params.get("psc");
    if (psc) filters.psc = psc;

    const state = params.get("state");
    if (state) filters.state = state;

    const type = params.get("type");
    if (type) filters.opportunityType = type;

    const postedFrom = params.get("postedFrom");
    if (postedFrom) filters.postedFrom = postedFrom;

    const dueBefore = params.get("dueBefore");
    if (dueBefore) filters.dueBefore = dueBefore;

    const sortBy = params.get("sortBy");
    if (sortBy) filters.sortBy = sortBy;

    const sortOrder = params.get("sortOrder");
    if (sortOrder === "asc" || sortOrder === "desc") {
      filters.sortOrder = sortOrder;
    }

    const limit = parseInt(params.get("limit") ?? "25", 10);
    const offset = parseInt(params.get("offset") ?? "0", 10);

    const result = await searchOpportunities(filters, limit, offset);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    const status = message.includes("429") ? 429 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
