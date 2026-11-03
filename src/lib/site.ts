import hostnames from "@/content/hostnames.json";
import { locations, type LocationSlug, type NurseryLocation } from "@/content/locations";
import { getSitePage, pathFor } from "@/content/site-pages";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? `https://${hostnames.canonical}`;
const assetUrl = process.env.NEXT_PUBLIC_ASSET_URL ?? siteUrl;

/**
 * Brand-level configuration only. Anything that differs between settings -
 * phone, address, hours, Ofsted, enquiry URL - lives in src/content/locations.ts
 * so a second nursery is a data change rather than a search-and-replace.
 */
export const siteConfig = {
  name: "Little Giants Nursery",
  legalName: "Little Giants Nursery Ltd",
  url: siteUrl,
  assetUrl,
  description:
    "An Ofsted-rated Good STEM and Montessori day nursery in Uxbridge, with a second nursery opening soon in Woodley, Reading.",
  /** Group-level mailbox. Settings may override it in their own config. */
  email: "info@littlegiantsnursery.org",
  instagram: "https://www.instagram.com/littlegiantsnursery/",
  companyNumber: "11736746",
  gtmId: process.env.NEXT_PUBLIC_GTM_ID ?? "GTM-K5K5F4L4",
} as const;

/** The setting used for group-level pages, where no location is in context. */
export const defaultLocation: NurseryLocation =
  locations.find((location) => location.status === "open") ?? locations[0];

export type NavItem = {
  label: string;
  href: string;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

/**
 * Resolve a page within a setting, or null when the setting has no such page.
 * There is deliberately no fallback to the other nursery: each setting's pages
 * only ever lead to its own pages, so Woodley's menu simply omits the curriculum,
 * Ofsted, food, and SEND pages it does not have yet.
 */
export function pageHref(location: LocationSlug, segments: string[], fragment = "") {
  const page = getSitePage(["nurseries", location, ...segments]);
  return page ? `${pathFor(page)}${fragment}` : null;
}

function presentItems(items: { label: string; href: string | null }[]): NavItem[] {
  return items.filter((item): item is NavItem => item.href !== null);
}

export function navigationFor(location: NurseryLocation = defaultLocation): NavGroup[] {
  const here = location.slug;
  const groups: NavGroup[] = [
    {
      label: "Our nurseries",
      items: [
        ...locations.map((entry) => ({
          label: entry.navLabel,
          href: `/nurseries/${entry.slug}`,
        })),
        { label: "Compare our nurseries", href: "/nurseries" },
      ],
    },
    {
      label: "Discover",
      items: presentItems([
        { label: "About us", href: pageHref(here, ["about"]) },
        { label: "Why families choose us", href: pageHref(here, ["about"], "#why-little-giants") },
        { label: "Our Ofsted report", href: pageHref(here, ["ofsted"]) },
        { label: "Rooms and gardens", href: pageHref(here, ["nursery-environment"]) },
      ]),
    },
    {
      label: "Learning",
      items: presentItems([
        { label: "Our curriculum", href: pageHref(here, ["curriculum"]) },
        { label: "STEM learning", href: pageHref(here, ["curriculum", "stem"]) },
        { label: "Montessori-inspired learning", href: pageHref(here, ["curriculum", "montessori"]) },
      ]),
    },
    {
      label: "Rooms",
      items: presentItems([
        { label: "Babies", href: pageHref(here, ["rooms", "babies"]) },
        { label: "Toddlers", href: pageHref(here, ["rooms", "toddlers"]) },
        { label: "Preschool", href: pageHref(here, ["rooms", "preschool"]) },
      ]),
    },
    {
      label: "For parents",
      items: presentItems([
        { label: "Starting nursery", href: pageHref(here, ["starting-nursery"]) },
        { label: "Fees and funding", href: pageHref(here, ["fees-funding"]) },
        { label: "Food and nutrition", href: pageHref(here, ["food-nutrition"]) },
        { label: "SEND and inclusion", href: pageHref(here, ["send-inclusion"]) },
      ]),
    },
  ];
  return groups.filter((group) => group.items.length > 0);
}

export function footerLinksFor(location: NurseryLocation = defaultLocation) {
  const here = location.slug;
  return presentItems([
    { label: "Our nurseries", href: "/nurseries" },
    { label: "About", href: pageHref(here, ["about"]) },
    { label: "Curriculum", href: pageHref(here, ["curriculum"]) },
    { label: "Fees and funding", href: pageHref(here, ["fees-funding"]) },
    { label: "Starting nursery", href: pageHref(here, ["starting-nursery"]) },
    { label: "Careers", href: "/careers" },
    { label: "Contact", href: pageHref(here, ["contact"]) },
    { label: "Privacy", href: "/privacy" },
    { label: "Cookies", href: "/cookies" },
  ]);
}

/**
 * Room cards for a setting's landing page. Uxbridge shows its own rooms. Woodley
 * has not been fitted out, so it uses generic photography and marks the baby
 * room "Coming soon" rather than passing off another building's rooms as its own.
 */
export function roomLinksFor(location: NurseryLocation = defaultLocation) {
  const openingSoon = location.status === "opening-soon";
  const rooms = [
    {
      title: "Babies",
      href: pageHref(location.slug, ["rooms", "babies"]),
      description: "Warm relationships, familiar routines, and sensory discovery.",
      image: openingSoon ? "/images/woodley/baby-room-wide.jpg" : "/images/source/about-us-07-img-9433.jpg",
      imageAlt: openingSoon
        ? "An illustrative baby room with a soft play mat, wooden toys, and low shelves"
        : "A calm baby area with soft seating, books, and sensory toys",
      badge: openingSoon ? "Coming soon" : undefined,
      colour: "peach",
    },
    {
      title: "Toddlers",
      href: pageHref(location.slug, ["rooms", "toddlers"]),
      description: "Language-rich play, growing independence, and room to explore.",
      image: openingSoon ? "/images/source/home-page-08-unsplash-image-m0yrv0gxkv8.jpg" : "/images/source/about-us-03-img-9338.jpg",
      imageAlt: openingSoon
        ? "A young child exploring the world through a toy telescope"
        : "A bright toddler room with role play areas and open-ended resources",
      badge: undefined,
      colour: "aqua",
    },
    {
      title: "Preschool",
      href: pageHref(location.slug, ["rooms", "preschool"]),
      description: "Confidence, curiosity, and the skills for a happy start at school.",
      image: openingSoon ? "/images/source/home-page-07-unsplash-image-93s6atwrwm0.jpg" : "/images/source/about-us-13-img-9438.jpg",
      imageAlt: openingSoon
        ? "A preschool child reading a picture book independently"
        : "The preschool room with books, small tables, and natural light",
      badge: undefined,
      colour: "lime",
    },
  ] as const;
  return rooms.flatMap((room) => (room.href ? [{ ...room, href: room.href }] : []));
}

export const testimonials = [
  {
    quote:
      "Little Giants Nursery is the most lovely place we could wish for. Our daughter loves her nursery, and so do we.",
    name: "Anna",
    role: "Parent",
  },
  {
    quote:
      "The staff are kind and genuinely caring. We feel incredibly lucky to have found Little Giants Nursery.",
    name: "Laura",
    role: "Parent",
  },
  {
    quote:
      "A fantastic and caring nursery that our son loves. The staff are brilliant and kind.",
    name: "Jack",
    role: "Parent",
  },
] as const;

export function absoluteUrl(pathname: string) {
  return new URL(pathname, siteConfig.url).toString();
}

export function absoluteAssetUrl(pathname: string) {
  return new URL(pathname, siteConfig.assetUrl).toString();
}
