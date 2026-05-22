export type EdgeSessionPayload = {
  userId?: string;
  role?: string;
  email?: string;
  authType?: "student" | "admin" | "staff";
  exp?: number;
  [key: string]: unknown;
};

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SESSION_SECRET must be configured with at least 32 characters in production");
    }
    return "development-session-secret-must-be-overridden";
  }
  return secret;
}

function base64UrlToBytes(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function base64UrlToString(input: string) {
  return new TextDecoder().decode(base64UrlToBytes(input));
}

async function hmacSha256(input: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(input)));
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) {
    diff |= a[index] ^ b[index];
  }
  return diff === 0;
}

export async function verifySessionToken(token: string): Promise<EdgeSessionPayload | null> {
  try {
    const [encodedHeader, encodedPayload, encodedSignature] = token.split(".");
    if (!encodedHeader || !encodedPayload || !encodedSignature) return null;

    const header = JSON.parse(base64UrlToString(encodedHeader)) as { alg?: string };
    if (header.alg !== "HS256") return null;

    const expectedSignature = await hmacSha256(`${encodedHeader}.${encodedPayload}`);
    const actualSignature = base64UrlToBytes(encodedSignature);
    if (!timingSafeEqual(expectedSignature, actualSignature)) return null;

    const payload = JSON.parse(base64UrlToString(encodedPayload)) as EdgeSessionPayload;
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
