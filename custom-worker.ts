import { edgeRedirectFor, isPreviewHostname } from "./src/lib/edge-redirect";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore The OpenNext worker is generated before Wrangler bundles this entry point.
import openNextHandler from "./.open-next/worker.js";

function withPreviewIndexingGuard(response: Response, hostname: string) {
  if (!isPreviewHostname(hostname)) return response;
  const headers = new Headers(response.headers);
  headers.set("X-Robots-Tag", "noindex, nofollow");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

const worker = {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const url = new URL(request.url);
    const redirect = edgeRedirectFor(request.url);

    if (redirect) {
      return withPreviewIndexingGuard(new Response(null, {
        status: redirect.status,
        headers: {
          "Cache-Control": "private, no-store",
          Location: redirect.location,
          "Referrer-Policy": "strict-origin-when-cross-origin",
          "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
          "X-Content-Type-Options": "nosniff",
        },
      }), url.hostname);
    }

    const response = await openNextHandler.fetch(request, env, ctx);
    return withPreviewIndexingGuard(response, url.hostname);
  },
};

export default worker;
