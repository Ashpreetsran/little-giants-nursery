import type { LocationSlug } from "./locations";
import type { MarketingContent } from "./page-types";
import { uxbridgePages } from "./pages/uxbridge";
import { woodleyPages } from "./pages/woodley";

/**
 * How a page's body is rendered. Everything except "standalone" and
 * "group-home" is produced by the src/app/[...slug] catch-all.
 */
export type PageTemplate =
  | "group-home"
  | "nurseries-index"
  | "location-home"
  | "location-contact"
  | "marketing"
  | "standalone";

export type SitePage = {
  /** Complete path segments. An empty array is the site root. */
  slug: string[];
  template: PageTemplate;
  location?: LocationSlug;
  title: string;
  description: string;
  /** Short heading used for breadcrumbs and social card alt text. */
  heading: string;
  priority: number;
  changeFrequency: "weekly" | "monthly" | "yearly";
  content?: MarketingContent;
};

function marketing(content: MarketingContent, location: LocationSlug): SitePage {
  const section = content.slug[2];
  return {
    slug: content.slug,
    template: "marketing",
    location,
    title: content.title,
    description: content.description,
    heading: content.heading,
    priority: section === "rooms" || section === "curriculum" ? 0.8 : 0.7,
    changeFrequency: "monthly",
    content,
  };
}

export const sitePages: SitePage[] = [
  {
    slug: [],
    template: "group-home",
    title: "Day Nurseries in Uxbridge and Woodley | Little Giants",
    description:
      "An Ofsted-rated Good STEM and Montessori day nursery in Uxbridge, with a second nursery opening soon in Woodley, Reading. Babies, toddlers, and preschool.",
    heading: "Little Giants Nursery",
    priority: 1,
    changeFrequency: "weekly",
  },
  {
    slug: ["nurseries"],
    template: "nurseries-index",
    title: "Our Nurseries in Uxbridge and Woodley | Little Giants",
    description:
      "Find your nearest Little Giants nursery: our Ofsted Good setting in Uxbridge, and our new nursery opening soon on Headley Road in Woodley, Reading.",
    heading: "Our nurseries",
    priority: 0.9,
    changeFrequency: "monthly",
  },

  {
    slug: ["nurseries", "uxbridge"],
    template: "location-home",
    location: "uxbridge",
    title: "Nursery in Uxbridge | STEM and Montessori | Little Giants",
    description:
      "An Ofsted-rated Good STEM and Montessori nursery in Uxbridge for babies, toddlers, and preschool children, in The Old School House on Hillingdon Road.",
    heading: "A STEM and Montessori nursery in Uxbridge",
    priority: 1,
    changeFrequency: "weekly",
  },
  ...uxbridgePages.map((content) => marketing(content, "uxbridge")),
  {
    slug: ["nurseries", "uxbridge", "contact"],
    template: "location-contact",
    location: "uxbridge",
    title: "Book a Nursery Tour in Uxbridge | Little Giants",
    description:
      "Book a personal tour of Little Giants Nursery near Brunel University. Ask about places, sessions, funding, and parking at our Uxbridge setting.",
    heading: "Visit Little Giants Nursery in Uxbridge",
    priority: 0.9,
    changeFrequency: "monthly",
  },

  {
    slug: ["nurseries", "woodley"],
    template: "location-home",
    location: "woodley",
    title: "Nursery in Woodley, Reading | Opening Soon | Little Giants",
    description:
      "A new STEM and Montessori day nursery opening soon at Astra House on Headley Road in Woodley, Reading, for babies, toddlers, and preschool children.",
    heading: "A new nursery opening soon in Woodley",
    priority: 0.9,
    changeFrequency: "weekly",
  },
  ...woodleyPages.map((content) => marketing(content, "woodley")),
  {
    slug: ["nurseries", "woodley", "contact"],
    template: "location-contact",
    location: "woodley",
    title: "Register Your Interest in Woodley | Little Giants Nursery",
    description:
      "Register your interest in our new Woodley nursery on Headley Road, Reading. Be first to hear about opening dates, fees, places, and visits.",
    heading: "Register your interest in our Woodley nursery",
    priority: 0.9,
    changeFrequency: "monthly",
  },

  {
    slug: ["careers"],
    template: "standalone",
    title: "Nursery Jobs and Careers | Little Giants Nursery",
    description:
      "Early years careers at Little Giants Nursery in Uxbridge and our new Woodley setting near Reading. Training, progression, and a supportive team culture.",
    heading: "Careers at Little Giants",
    priority: 0.5,
    changeFrequency: "monthly",
  },
  {
    slug: ["privacy"],
    template: "standalone",
    title: "Privacy Policy | Little Giants Nursery",
    description: "How Little Giants Nursery collects, uses, stores, and protects personal information.",
    heading: "Privacy policy",
    priority: 0.2,
    changeFrequency: "yearly",
  },
  {
    slug: ["cookies"],
    template: "standalone",
    title: "Cookie Policy | Little Giants Nursery",
    description: "The cookies Little Giants Nursery uses, why they are used, and how to change your choice.",
    heading: "Cookie policy",
    priority: 0.2,
    changeFrequency: "yearly",
  },
];

/** Pages rendered by the src/app/[...slug] catch-all. */
export const catchAllTemplates: PageTemplate[] = [
  "nurseries-index",
  "location-home",
  "location-contact",
  "marketing",
];

export const catchAllPages = sitePages.filter((page) => catchAllTemplates.includes(page.template));

const sitePageMap = new Map(sitePages.map((page) => [page.slug.join("/"), page]));

export function getSitePage(slug: string[]): SitePage | undefined {
  return sitePageMap.get(slug.join("/"));
}

export function pathFor(page: Pick<SitePage, "slug">) {
  return page.slug.length === 0 ? "/" : `/${page.slug.join("/")}`;
}

/** Social card file stem, matching public/og/<stem>.jpg. */
export function socialCardName(page: Pick<SitePage, "slug">) {
  return page.slug.length === 0 ? "home" : page.slug.join("-");
}
