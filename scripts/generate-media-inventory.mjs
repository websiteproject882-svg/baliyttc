import { readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const mediaRoot = path.join(root, "public", "media");
const outputFile = path.join(mediaRoot, "media-inventory.json");

const mediaExtensions = new Set([
  ".avif",
  ".gif",
  ".jpeg",
  ".jpg",
  ".mov",
  ".mp4",
  ".pdf",
  ".png",
  ".webm",
  ".webp",
]);

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walk(absolute));
      continue;
    }

    const ext = path.extname(entry.name).toLowerCase();
    if (!mediaExtensions.has(ext)) continue;

    const info = await stat(absolute);
    const relative = path.relative(mediaRoot, absolute).replaceAll(path.sep, "/");
    const publicPath = `/media/${relative}`;
    const section = path.posix.dirname(relative);

    files.push({
      publicPath,
      section,
      filename: entry.name,
      extension: ext.slice(1),
      bytes: info.size,
      updatedAt: info.mtime.toISOString(),
    });
  }

  return files;
}

const files = (await walk(mediaRoot)).sort((a, b) => a.publicPath.localeCompare(b.publicPath));
const grouped = files.reduce((acc, file) => {
  acc[file.section] ||= 0;
  acc[file.section] += 1;
  return acc;
}, {});

await writeFile(
  outputFile,
  `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    totalFiles: files.length,
    sections: grouped,
    files,
  }, null, 2)}\n`,
);

console.log(`Wrote ${files.length} media entries to ${path.relative(root, outputFile)}`);
