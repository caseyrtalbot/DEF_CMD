import { NextRequest, NextResponse } from "next/server";
import { searchDocuments } from "@/lib/api/federal-register";

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;

    const type = params.get("type") ?? undefined;
    const dateFrom = params.get("dateFrom") ?? undefined;
    const keyword = params.get("keyword") ?? undefined;
    const perPage = parseInt(params.get("perPage") ?? "50", 10);
    const page = parseInt(params.get("page") ?? "1", 10);

    const documents = await searchDocuments(
      type,
      dateFrom,
      keyword,
      undefined,
      perPage,
      page
    );

    return NextResponse.json({ data: documents });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
