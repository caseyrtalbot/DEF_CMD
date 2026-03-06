import { NextRequest, NextResponse } from "next/server";
import {
  getSpendingByAgency,
  getSpendingByNaics,
  getSpendingOverTime,
  getSpendingBySubAgency,
} from "@/lib/api/usaspending";
import { DOD_SPENDING_AGENCIES } from "@/lib/dod-config";

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;

    const view = params.get("view") ?? "agency";
    const startDate = params.get("startDate") ?? "2025-10-01";
    const endDate =
      params.get("endDate") ?? new Date().toISOString().split("T")[0];
    const page = parseInt(params.get("page") ?? "1", 10);
    const group = (params.get("group") ?? "month") as
      | "month"
      | "quarter"
      | "fiscal_year";

    const timePeriods = [
      { start_date: startDate, end_date: endDate },
    ];

    switch (view) {
      case "agency": {
        // Show DoD sub-agency breakdown instead of all federal agencies
        const result = await getSpendingBySubAgency(timePeriods, DOD_SPENDING_AGENCIES, page);
        return NextResponse.json(result);
      }
      case "naics": {
        // Scope NAICS spending to DoD agencies
        const result = await getSpendingByNaics(timePeriods, page, 10, DOD_SPENDING_AGENCIES);
        return NextResponse.json(result);
      }
      case "time": {
        // Scope spending-over-time to DoD agencies
        const result = await getSpendingOverTime(timePeriods, group, page, 12, DOD_SPENDING_AGENCIES);
        return NextResponse.json(result);
      }
      default:
        return NextResponse.json(
          { error: `Invalid view: ${view}. Use agency, naics, or time.` },
          { status: 400 }
        );
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
