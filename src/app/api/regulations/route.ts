import { NextRequest, NextResponse } from "next/server";
import { searchRegulations } from "@/lib/api/regulations";

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;

    const keyword = params.get("keyword") ?? undefined;
    const documentType = params.get("documentType") ?? undefined;
    const agency = params.get("agency") ?? "DOD";
    const pageSize = parseInt(params.get("pageSize") ?? "25", 10);
    const pageNumber = parseInt(params.get("pageNumber") ?? "1", 10);

    const documents = await searchRegulations(
      keyword,
      documentType,
      agency,
      pageSize,
      pageNumber
    );

    return NextResponse.json({ data: documents });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    const status = message.includes("429") ? 429 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
