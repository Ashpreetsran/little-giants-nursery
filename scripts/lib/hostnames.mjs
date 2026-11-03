import { readFileSync } from "node:fs";

const hostnames = JSON.parse(
  readFileSync(new URL("../../src/content/hostnames.json", import.meta.url), "utf8"),
);

export const canonicalHostname = hostnames.canonical;
export const apexHostname = hostnames.apex;
export const stagingHostname = hostnames.staging;
export const workersDevPreviewHostname = hostnames.workersDevPreview;

export const canonicalOrigin = `https://${canonicalHostname}`;
export const stagingOrigin = `https://${stagingHostname}`;
export const workersDevPreviewOrigin = `https://${workersDevPreviewHostname}`;

export function isPreviewOrigin(origin) {
  return origin === stagingOrigin || origin === workersDevPreviewOrigin;
}
