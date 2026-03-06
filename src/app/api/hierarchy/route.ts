import { NextRequest, NextResponse } from "next/server";
import { searchOrgs, getOrgTree } from "@/lib/api/federal-hierarchy";

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;

    const mode = params.get("mode");
    const limit = parseInt(params.get("limit") ?? "25", 10);
    const offset = parseInt(params.get("offset") ?? "0", 10);

    // Tree mode: fetch children of a parent org
    if (mode === "tree") {
      const rootOrgKey = params.get("rootOrgKey") ?? undefined;
      const result = await getOrgTree(rootOrgKey, limit, offset);
      return NextResponse.json(result);
    }

    // Search mode (default): search orgs by name
    const query = params.get("q");
    if (!query) {
      return NextResponse.json(
        { error: "Provide q query parameter for search, or mode=tree for tree view" },
        { status: 400 }
      );
    }

    const type = params.get("type") ?? undefined;
    const parentId = params.get("parentId") ?? undefined;

    const result = await searchOrgs(query, type, parentId, limit, offset);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
