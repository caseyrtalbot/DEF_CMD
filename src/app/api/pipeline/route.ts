import { NextRequest, NextResponse } from "next/server";
import { getPipelineItems, createPipelineItem } from "@/lib/db";
import type { PipelineStage } from "@/lib/types";

export async function GET() {
  try {
    const items = getPipelineItems();
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
      stage?: PipelineStage;
    };

    if (!body.opportunityId) {
      return NextResponse.json(
        { error: "opportunityId is required" },
        { status: 400 }
      );
    }

    const item = createPipelineItem(body.opportunityId, body.stage);
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
