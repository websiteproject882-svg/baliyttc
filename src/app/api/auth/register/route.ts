import { NextRequest } from "next/server";
import { requireSameOrigin } from "@/lib/authz";
import { jsonWithRequestId } from "@/lib/security";

export async function POST(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) return sameOriginResponse;

  return jsonWithRequestId(
    { error: "Direct registration is disabled. Use Firebase sign-in flow instead." },
    { status: 410 },
    request,
  );
}
