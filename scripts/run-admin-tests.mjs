import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join, relative } from "node:path";

const testDir = join(process.cwd(), "src", "test");
const exactFiles = new Set([
  "rbac.test.ts",
  "middleware-session-roles.test.ts",
]);

const files = readdirSync(testDir)
  .filter((file) => {
    return (
      /^admin-.*\.test\.ts$/.test(file) ||
      /^auth-.*\.test\.ts$/.test(file) ||
      exactFiles.has(file)
    );
  })
  .sort()
  .map((file) => relative(process.cwd(), join(testDir, file)).replace(/\\/g, "/"));

if (files.length === 0) {
  console.error("No admin regression tests found.");
  process.exit(1);
}

console.log(`Running ${files.length} admin regression test files`);

const result = spawnSync(
  process.execPath,
  ["node_modules/vitest/vitest.mjs", "run", ...files],
  {
    stdio: "inherit",
    shell: false,
  },
);

process.exit(result.status ?? 1);
