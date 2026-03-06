import { NextRequest, NextResponse } from "next/server";
import { getSavedOpportunities, createSavedOpportunity } from "@/lib/db";

export async function GET() {
  try {
    const items = getSavedOpportunities();
    return NextResponse.json(items);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      opportunityId?: string;
      title?: string;
      agency?: string;
      notes?: string;
    };

    if (!body.opportunityId) {
      return NextResponse.json(
        { error: "opportunityId is required" },
        { status: 400 }
      );
    }

    const item = createSavedOpportunity(body.opportunityId, body.title, body.agency, body.notes);
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
