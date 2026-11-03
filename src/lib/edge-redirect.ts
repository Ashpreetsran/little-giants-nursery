import hostnames from "../content/hostnames.json";
import legacyUrlMigration from "../content/legacy-url-migration.json";

export const canonicalHostname = hostnames.canonical;
export const apexHostname = hostnames.apex;
export const stagingHostname = hostnames.staging;
export const workersDevPreviewHostname = hostnames.workersDevPreview;

const productionHostnames = new Set([apexHostname, canonicalHostname]);
const previewHostnames = new Set([stagingHostname, workersDevPreviewHostname]);
const legacyRedirects = new Map(legacyUrlMigration.redirects.map(({ source, destination }) => [source, destination]));

export function isPreviewHostname(hostname: string) {
  return previewHostnames.has(hostname);
}

export type EdgeRedirect = {
  location: string;
  status: 301;
};

function rawQuery(requestUrl: string) {
  const queryStart = requestUrl.indexOf("?");
  return queryStart === -1 ? "" : requestUrl.slice(queryStart);
}

function canonicalLocation(pathAndQuery: string) {
  return `https://${canonicalHostname}${pathAndQuery}`;
}

export function edgeRedirectFor(requestUrl: string): EdgeRedirect | null {
  const url = new URL(requestUrl);
  const query = rawQuery(requestUrl);
  const normalizedPath = url.pathname !== "/" && url.pathname.endsWith("/")
    ? url.pathname.slice(0, -1)
    : url.pathname;
  const legacyDestination = legacyRedirects.get(normalizedPath);

  if (legacyDestination) {
    const location = `${legacyDestination}${query}`;
    return {
      location: productionHostnames.has(url.hostname) ? canonicalLocation(location) : location,
      status: 301,
    };
  }

  if (productionHostnames.has(url.hostname) && (url.hostname !== canonicalHostname || url.protocol !== "https:")) {
    return {
      location: canonicalLocation(`${url.pathname}${query}`),
      status: 301,
    };
  }

  return null;
}
