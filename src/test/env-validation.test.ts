import { afterEach, describe, expect, it } from "vitest";
import { validateRuntimeEnv } from "../lib/env-validation";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("env validation", () => {
  it("fails when required shared env is missing", () => {
    delete process.env.NEXT_PUBLIC_BASE_URL;
    delete process.env.SESSION_SECRET;

    const result = validateRuntimeEnv();
    expect(result.ok).toBe(false);
    expect(result.errors.some((item) => item.includes("NEXT_PUBLIC_BASE_URL"))).toBe(true);
    expect(result.errors.some((item) => item.includes("SESSION_SECRET"))).toBe(true);
  });

  it("warns in non-production when prod-only env is absent", () => {
    process.env = { ...process.env, NODE_ENV: "development" };
    process.env.NEXT_PUBLIC_BASE_URL = "http://localhost:3000";
    process.env.SESSION_SECRET = "12345678901234567890123456789012";
    delete process.env.DATABASE_URL;

    const result = validateRuntimeEnv();
    expect(result.ok).toBe(true);
    expect(result.warnings.some((item) => item.includes("DATABASE_URL"))).toBe(true);
  });

  it("fails when a payment provider is partially configured", () => {
    process.env = { ...process.env, NODE_ENV: "production" };
    process.env.NEXT_PUBLIC_BASE_URL = "https://baliyytc.vercel.app";
    process.env.SESSION_SECRET = "12345678901234567890123456789012";
    process.env.DATABASE_URL = "postgres://db";
    process.env.FIREBASE_PROJECT_ID = "firebase-project";
    process.env.FIREBASE_CLIENT_EMAIL = "firebase@example.com";
    process.env.FIREBASE_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----";
    process.env.RAZORPAY_KEY_ID = "rzp_test_key";
    delete process.env.RAZORPAY_KEY_SECRET;
    delete process.env.RAZORPAY_WEBHOOK_SECRET;

    const result = validateRuntimeEnv();
    expect(result.ok).toBe(false);
    expect(result.errors.some((item) => item.includes("Razorpay is partially configured"))).toBe(true);
  });

  it("fails when production test login is enabled without the explicit override", () => {
    process.env = { ...process.env, NODE_ENV: "production" };
    process.env.NEXT_PUBLIC_BASE_URL = "https://baliyytc.vercel.app";
    process.env.SESSION_SECRET = "12345678901234567890123456789012";
    process.env.DATABASE_URL = "postgres://db";
    process.env.FIREBASE_PROJECT_ID = "firebase-project";
    process.env.FIREBASE_CLIENT_EMAIL = "firebase@example.com";
    process.env.FIREBASE_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----";
    process.env.ENABLE_TEST_LOGIN = "true";
    process.env.ALLOW_PRODUCTION_TEST_LOGIN = "false";

    const result = validateRuntimeEnv();

    expect(result.ok).toBe(false);
    expect(result.errors.some((item) => item.includes("ENABLE_TEST_LOGIN cannot be true"))).toBe(true);
  });

  it("allows production test login only when the explicit override is present", () => {
    process.env = { ...process.env, NODE_ENV: "production" };
    process.env.NEXT_PUBLIC_BASE_URL = "https://baliyytc.vercel.app";
    process.env.SESSION_SECRET = "12345678901234567890123456789012";
    process.env.DATABASE_URL = "postgres://db";
    process.env.FIREBASE_PROJECT_ID = "firebase-project";
    process.env.FIREBASE_CLIENT_EMAIL = "firebase@example.com";
    process.env.FIREBASE_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----";
    process.env.ENABLE_TEST_LOGIN = "true";
    process.env.ALLOW_PRODUCTION_TEST_LOGIN = "true";

    const result = validateRuntimeEnv();

    expect(result.errors.some((item) => item.includes("ENABLE_TEST_LOGIN cannot be true"))).toBe(false);
  });
});
