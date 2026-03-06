import { NextRequest, NextResponse } from "next/server";
import { searchTopics } from "@/lib/api/sbir";

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;

    const keyword = params.get("keyword") ?? undefined;
    const agency = params.get("agency") ?? "Department of Defense";
    const status = params.get("status") ?? undefined;

    const topics = await searchTopics(keyword, agency, status);
    return NextResponse.json({ data: topics });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
