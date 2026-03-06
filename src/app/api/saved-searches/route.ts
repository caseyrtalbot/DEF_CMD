import { NextRequest, NextResponse } from "next/server";
import {
  getSavedSearches,
  createSavedSearch,
  deleteSavedSearch,
} from "@/lib/db";
import type { SearchFilters } from "@/lib/types";

export async function GET() {
  try {
    const searches = getSavedSearches();
    return NextResponse.json(searches);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      name?: string;
      filters?: SearchFilters;
    };

    if (!body.name || !body.filters) {
      return NextResponse.json(
        { error: "name and filters are required" },
        { status: 400 }
      );
    }

    const search = createSavedSearch(body.name, body.filters);
    return NextResponse.json(search, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = (await request.json()) as { id?: string };

    if (!body.id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    deleteSavedSearch(body.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
