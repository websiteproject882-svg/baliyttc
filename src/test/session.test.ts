import { beforeEach, describe, expect, it } from "vitest";
import { decrypt, encrypt, sessionMatchesAuthType } from "../lib/session";

describe("session helpers", () => {
  beforeEach(() => {
    process.env.SESSION_SECRET = "12345678901234567890123456789012";
  });

  it("round-trips signed session payloads", async () => {
    const token = await encrypt({
      userId: "user_1",
      role: "STUDENT",
      email: "student@example.com",
      authType: "student",
    });

    const payload = await decrypt(token);

    expect(payload.userId).toBe("user_1");
    expect(payload.authType).toBe("student");
  });

  it("rejects session payloads stored under the wrong auth type", () => {
    expect(sessionMatchesAuthType({ authType: "student" }, "student")).toBe(true);
    expect(sessionMatchesAuthType({ authType: "student" }, "admin")).toBe(false);
    expect(sessionMatchesAuthType({ role: "ADMIN" }, "admin")).toBe(false);
    expect(sessionMatchesAuthType(null, "staff")).toBe(false);
  });
});
