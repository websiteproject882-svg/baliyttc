import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: "Direct registration is disabled. Use Firebase sign-in flow instead." },
    { status: 410 }
  );
}
