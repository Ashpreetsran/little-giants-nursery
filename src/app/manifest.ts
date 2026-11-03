import type { MetadataRoute } from "next";

import { getSitePage } from "@/content/site-pages";
import { siteConfig } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  const home = getSitePage([])!;
  return {
    name: siteConfig.name,
    short_name: "Little Giants",
    description: home.description,
    start_url: "/",
    display: "standalone",
    background_color: "#fffaf2",
    theme_color: "#89dbe6",
    icons: [{ src: "/icon.png", sizes: "256x256", type: "image/png" }],
  };
}
