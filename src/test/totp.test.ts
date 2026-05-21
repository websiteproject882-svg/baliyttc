import { describe, expect, it } from "vitest";
import { generateSync } from "otplib";
import { generateTotpSecret, verifyTotpToken } from "../lib/totp";

describe("totp helpers", () => {
  it("generates a secret and verifies a valid token", () => {
    const { secret, otpauthUrl } = generateTotpSecret("admin@baliyttc.com");
    const token = generateSync({ secret });

    expect(secret.length).toBeGreaterThan(10);
    expect(otpauthUrl.startsWith("otpauth://totp/")).toBe(true);
    expect(verifyTotpToken(secret, token)).toBe(true);
    expect(verifyTotpToken(secret, "000000")).toBe(false);
  });
});
