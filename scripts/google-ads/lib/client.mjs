import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/**
 * Minimal Google Ads REST client.
 *
 * There is no shared Ads CLI on this machine, so every script here talks to the
 * REST API directly. Credentials are resolved from 1Password at call time and
 * never written to disk, printed, or passed in argv.
 */
export const account = JSON.parse(
  await readFile(new URL("../../../config/google-ads/account.json", import.meta.url), "utf8"),
);

async function op(reference) {
  const { stdout } = await execFileAsync("op", ["read", reference]);
  return stdout.trim();
}

let credentials;
async function loadCredentials() {
  if (credentials) return credentials;
  const vault = account.onePasswordItem;
  const [developerToken, clientId, clientSecret, refreshToken] = await Promise.all([
    op(`${vault}/google_ads_developer_token`),
    op(`${vault}/oauth_client_id`),
    op(`${vault}/oauth_client_secret`),
    op(`${vault}/refresh_token`),
  ]);
  credentials = { developerToken, clientId, clientSecret, refreshToken };
  return credentials;
}

let accessToken;
async function getAccessToken() {
  if (accessToken) return accessToken;
  const { clientId, clientSecret, refreshToken } = await loadCredentials();
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!response.ok) {
    // Never echo the body: it can contain the client secret on some failures.
    throw new Error(`OAuth token exchange failed with ${response.status}. Check ${account.onePasswordItem}.`);
  }
  accessToken = (await response.json()).access_token;
  return accessToken;
}

export async function ads(path, init = {}) {
  const { developerToken } = await loadCredentials();
  const response = await fetch(`https://googleads.googleapis.com/${account.apiVersion}/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${await getAccessToken()}`,
      "developer-token": developerToken,
      // Without the manager account the developer token reads as unapproved.
      "login-customer-id": account.loginCustomerId,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`${path} returned ${response.status}\n${JSON.stringify(body, null, 2)}`);
  }
  return body;
}

export async function search(query, customerId = account.customerId) {
  const rows = [];
  let pageToken;
  do {
    const body = await ads(`customers/${customerId}/googleAds:search`, {
      method: "POST",
      body: JSON.stringify({ query, ...(pageToken ? { pageToken } : {}) }),
    });
    rows.push(...(body.results ?? []));
    pageToken = body.nextPageToken;
  } while (pageToken);
  return rows;
}

export async function mutate(operations, { validateOnly = false, customerId = account.customerId } = {}) {
  return ads(`customers/${customerId}/googleAds:mutate`, {
    method: "POST",
    body: JSON.stringify({ mutateOperations: operations, validateOnly, responseContentType: "RESOURCE_NAME_ONLY" }),
  });
}

export function resource(customerId, type, id) {
  return `customers/${customerId}/${type}/${id}`;
}
