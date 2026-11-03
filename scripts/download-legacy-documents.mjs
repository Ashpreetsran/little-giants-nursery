import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import legacyUrlMigration from "../src/content/legacy-url-migration.json" with { type: "json" };

const projectRoot = path.resolve(import.meta.dirname, "..");

for (const document of legacyUrlMigration.preservedAssets) {
  const response = await fetch(document.source);
  if (!response.ok) {
    throw new Error(`Unable to download ${document.source}: HTTP ${response.status}`);
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  if (!bytes.subarray(0, 5).equals(Buffer.from("%PDF-"))) {
    throw new Error(`Unexpected file signature for ${document.source}`);
  }

  const digest = createHash("sha256").update(bytes).digest("hex");
  if (bytes.length !== document.size || digest !== document.sha256) {
    throw new Error(`Source document changed: ${document.source}`);
  }

  const outputPath = path.join(projectRoot, "public", document.path);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, bytes);
  console.log(`Saved ${document.path} (${bytes.length} bytes)`);
}
