import legacyUrlMigration from "@/content/legacy-url-migration.json";

const destinations = new Map(legacyUrlMigration.redirects.map(({ source, destination }) => [source, destination]));

export function createLegacyRedirectHandler(source: string) {
  const destination = destinations.get(source);
  if (!destination) throw new Error(`No legacy redirect is configured for ${source}`);

  return function GET(request: Request) {
    const queryStart = request.url.indexOf("?");
    const rawQuery = queryStart === -1 ? "" : request.url.slice(queryStart);

    return new Response(null, {
      status: 301,
      headers: {
        "Cache-Control": "public, max-age=86400",
        Location: `${destination}${rawQuery}`,
      },
    });
  };
}
