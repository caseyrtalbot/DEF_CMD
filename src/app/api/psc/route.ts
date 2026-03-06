import { NextRequest, NextResponse } from "next/server";
import { searchPSCCodes } from "@/lib/api/psc";

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;

    const searchText = params.get("searchText") ?? undefined;
    const code = params.get("code") ?? undefined;

    const codes = await searchPSCCodes(searchText, code);
    return NextResponse.json({ data: codes });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
