import { afterEach, describe, expect, it } from "vitest";
import { localeFromPathname, localeFromUrl, withLocalePath } from "../lib/localized-path";
import { buildPublicUrl, getPublicBaseUrl } from "../lib/public-url";

const originalBaseUrl = process.env.NEXT_PUBLIC_BASE_URL;

afterEach(() => {
  process.env.NEXT_PUBLIC_BASE_URL = originalBaseUrl;
});

describe("localized path helpers", () => {
  it("adds the active locale to app paths", () => {
    expect(withLocalePath("/app/dashboard", "de")).toBe("/de/app/dashboard");
    expect(withLocalePath("admin/overview", "es")).toBe("/es/admin/overview");
  });

  it("does not double-prefix already localized paths", () => {
    expect(withLocalePath("/fr/app/dashboard", "de")).toBe("/fr/app/dashboard");
  });

  it("leaves external and protocol links untouched", () => {
    expect(withLocalePath("https://example.com/app/dashboard", "id")).toBe("https://example.com/app/dashboard");
    expect(withLocalePath("mailto:info@baliyttc.com", "id")).toBe("mailto:info@baliyttc.com");
    expect(withLocalePath("tel:+6281999333327", "id")).toBe("tel:+6281999333327");
  });

  it("falls back to the default locale for unknown locales", () => {
    expect(withLocalePath("/app/dashboard", "xx")).toBe("/en/app/dashboard");
  });

  it("extracts supported locales from paths and URLs", () => {
    expect(localeFromPathname("/de/admin/login")).toBe("de");
    expect(localeFromPathname("/unknown/admin/login")).toBe("en");
    expect(localeFromUrl("https://baliyttc.com/es/login")).toBe("es");
    expect(localeFromUrl("/fr/staff/login")).toBe("fr");
    expect(localeFromUrl("not a url")).toBe("en");
  });
});

describe("public URL helpers", () => {
  it("falls back to the production domain when no base URL is configured", () => {
    delete process.env.NEXT_PUBLIC_BASE_URL;
    expect(getPublicBaseUrl()).toBe("https://baliyttc.com");
  });

  it("normalizes the public base URL", () => {
    process.env.NEXT_PUBLIC_BASE_URL = "https://baliyttc.com/";
    expect(getPublicBaseUrl()).toBe("https://baliyttc.com");
  });

  it("builds localized absolute URLs", () => {
    process.env.NEXT_PUBLIC_BASE_URL = "https://baliyttc.com/";
    expect(buildPublicUrl("/app/dashboard")).toBe("https://baliyttc.com/en/app/dashboard");
    expect(buildPublicUrl("admin/leads", "de")).toBe("https://baliyttc.com/de/admin/leads");
    expect(buildPublicUrl("/", "fr")).toBe("https://baliyttc.com/fr");
  });

  it("does not double-prefix localized paths or unsupported locales", () => {
    process.env.NEXT_PUBLIC_BASE_URL = "https://baliyttc.com/";
    expect(buildPublicUrl("/fr/app/dashboard", "de")).toBe("https://baliyttc.com/fr/app/dashboard");
    expect(buildPublicUrl("/app/dashboard", "xx")).toBe("https://baliyttc.com/en/app/dashboard");
  });

  it("passes through external absolute URLs", () => {
    process.env.NEXT_PUBLIC_BASE_URL = "https://baliyttc.com/";
    expect(buildPublicUrl("https://payments.example.com/checkout", "de")).toBe("https://payments.example.com/checkout");
  });
});
