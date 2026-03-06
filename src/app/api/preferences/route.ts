import { NextRequest, NextResponse } from "next/server";
import { getPreferences, updatePreferences } from "@/lib/db";
import type { Preferences } from "@/lib/db";

export async function GET() {
  try {
    const preferences = getPreferences();
    return NextResponse.json(preferences);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<Preferences>;
    updatePreferences(body);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
