import { NextRequest, NextResponse } from "next/server";
import { requireSameOrigin } from "@/lib/authz";

export async function POST(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) return sameOriginResponse;

  return NextResponse.json(
    { error: "Direct registration is disabled. Use Firebase sign-in flow instead." },
    { status: 410 }
  );
}
