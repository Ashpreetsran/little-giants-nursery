import type { MetadataRoute } from "next";
import { pathFor, sitePages } from "@/content/site-pages";
import { siteConfig } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const updated = new Date("2026-09-21T00:00:00.000Z");
  return sitePages.map((page) => ({
    url: new URL(pathFor(page), siteConfig.url).toString().replace(/\/$/, page.slug.length === 0 ? "/" : ""),
    lastModified: updated,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
}
