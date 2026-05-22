import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { locales } from "../i18n/routing";

const messagesDir = path.resolve(process.cwd(), "src/i18n/messages");
const requiredSections = ["Navigation", "Hero", "FeaturedCourses", "FAQ", "Footer", "HomeCopy"] as const;

describe("i18n configuration", () => {
  it("has a message file and required public sections for every enabled locale", () => {
    for (const locale of locales) {
      const file = path.join(messagesDir, `${locale}.json`);
      expect(fs.existsSync(file), `${locale}.json should exist`).toBe(true);

      const messages = JSON.parse(fs.readFileSync(file, "utf8")) as Record<string, unknown>;
      for (const section of requiredSections) {
        expect(messages[section], `${locale}.json should include ${section}`).toBeTruthy();
      }
    }
  });

  it("enables Indonesian as a first-class routed locale", () => {
    expect(locales).toContain("id");
  });
});
