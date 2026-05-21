import { NextRequest, NextResponse } from "next/server";

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export function getClientIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function applySecurityHeaders(response: NextResponse) {
  if (!response.headers.get("X-Request-Id")) {
    response.headers.set("X-Request-Id", crypto.randomUUID());
  }
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");

  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  }

  return response;
}

export function rateLimit(params: {
  key: string;
  limit: number;
  windowMs: number;
}) {
  const now = Date.now();
  const current = buckets.get(params.key);

  if (!current || current.resetAt <= now) {
    buckets.set(params.key, {
      count: 1,
      resetAt: now + params.windowMs,
    });
    return {
      allowed: true,
      remaining: params.limit - 1,
      resetAt: now + params.windowMs,
    };
  }

  if (current.count >= params.limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: current.resetAt,
    };
  }

  current.count += 1;
  buckets.set(params.key, current);

  return {
    allowed: true,
    remaining: Math.max(params.limit - current.count, 0),
    resetAt: current.resetAt,
  };
}

export function createRateLimitResponse(message = "Too many requests", retryAfterSeconds = 60) {
  const response = NextResponse.json({ error: message }, { status: 429 });
  response.headers.set("Retry-After", String(retryAfterSeconds));
  return response;
}

export function getRequestId(request: NextRequest) {
  return request.headers.get("x-request-id") || crypto.randomUUID();
}

export function withRequestId(response: NextResponse, request: NextRequest | string) {
  const requestId = typeof request === "string" ? request : getRequestId(request);
  response.headers.set("X-Request-Id", requestId);
  return response;
}

export function jsonWithRequestId(
  body: unknown,
  init: ResponseInit | undefined,
  request: NextRequest | string,
) {
  const response = NextResponse.json(body, init);
  return withRequestId(response, request);
}

export function applyDeprecationHeaders(
  response: NextResponse,
  details: {
    replacement?: string;
    sunset?: string;
    message?: string;
  },
) {
  response.headers.set("X-API-Deprecated", "true");
  if (details.replacement) {
    response.headers.set("X-API-Replacement", details.replacement);
  }
  if (details.sunset) {
    response.headers.set("Sunset", details.sunset);
  }
  if (details.message) {
    response.headers.set("Warning", `299 - "${details.message}"`);
  }
  return response;
}

export const LEGACY_API_SUNSET = "Mon, 31 Aug 2026 23:59:59 GMT";

export function logLegacyRouteAccess(
  request: NextRequest,
  details: {
    route: string;
    replacement?: string;
  },
) {
  const requestId = getRequestId(request);
  console.warn("[legacy-route-hit]", {
    requestId,
    method: request.method,
    path: request.nextUrl.pathname,
    route: details.route,
    replacement: details.replacement ?? null,
    sunset: LEGACY_API_SUNSET,
  });
  return requestId;
}

export function logApiError(
  context: string,
  error: unknown,
  request: NextRequest,
  extra?: Record<string, unknown>,
) {
  const requestId = getRequestId(request);
  console.error(`[${context}]`, {
    requestId,
    method: request.method,
    path: request.nextUrl.pathname,
    error: error instanceof Error ? error.message : String(error),
    ...extra,
  });
  return requestId;
}

export function requireSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const protocol = request.headers.get("x-forwarded-proto") || request.nextUrl.protocol.replace(":", "");

  if (!origin || !host) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let originUrl: URL;
  try {
    originUrl = new URL(origin);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const expectedOrigin = `${protocol}://${host}`;
  if (originUrl.origin !== expectedOrigin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return null;
}
