import { NextRequest, NextResponse } from "next/server";
import { getEntityByUei, searchEntities } from "@/lib/api/sam-entities";

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;

    const uei = params.get("uei");
    if (uei) {
      const entity = await getEntityByUei(uei);
      if (!entity) {
        return NextResponse.json(
          { error: `Entity not found for UEI: ${uei}` },
          { status: 404 }
        );
      }
      return NextResponse.json(entity);
    }

    const q = params.get("q");
    if (q) {
      const limit = parseInt(params.get("limit") ?? "25", 10);
      const offset = parseInt(params.get("offset") ?? "0", 10);
      const result = await searchEntities(q, limit, offset);
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: "Provide either uei or q query parameter" },
      { status: 400 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
