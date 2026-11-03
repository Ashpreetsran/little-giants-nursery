import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";

const templates = [".env.dev", ".env.prod", ".env.cloudflare", ".env.cloudflare-dns"];

function readReference(reference) {
  return new Promise((resolve, reject) => {
    const child = spawn("op", ["read", reference], { stdio: "ignore" });
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`1Password read failed${signal ? ` with signal ${signal}` : ` with exit code ${code}`}`));
    });
  });
}

let count = 0;
for (const template of templates) {
  const source = await readFile(new URL(`../${template}`, import.meta.url), "utf8");
  for (const line of source.split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 1) throw new Error(`${template}: malformed environment reference line`);
    const key = line.slice(0, separator);
    const reference = line.slice(separator + 1);
    if (!reference.startsWith("op://")) throw new Error(`${template}: ${key} is not a 1Password reference`);
    try {
      await readReference(reference);
    } catch {
      throw new Error(`${template}: 1Password reference for ${key} does not resolve`);
    }
    count += 1;
  }
}

console.log(`1Password reference contract passed for ${count} fields across ${templates.length} templates`);
console.log("Reference values were discarded without being printed");
