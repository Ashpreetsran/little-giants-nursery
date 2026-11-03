import { JsonLd } from "@/components/json-ld";
import { getSitePage } from "@/content/site-pages";
import { breadcrumbNode, webPageNode } from "@/lib/schema";

/**
 * Structured data for the standalone app routes (careers, privacy, cookies).
 * Everything else flows through the catch-all, which builds the same graph.
 */
export function PageSchema({ slug, type = "WebPage" }: { slug: string[]; type?: "ContactPage" | "WebPage" }) {
  const page = getSitePage(slug);
  if (!page) return null;

  return (
    <JsonLd data={{
      "@context": "https://schema.org",
      "@graph": [webPageNode(page, type), breadcrumbNode(page)],
    }} />
  );
}
