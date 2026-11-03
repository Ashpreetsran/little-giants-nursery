import { locations, mapUrl, type NurseryLocation } from "@/content/locations";
import { pathFor, type SitePage } from "@/content/site-pages";
import { absoluteUrl, siteConfig } from "@/lib/site";

export const organizationId = `${siteConfig.url}/#organization`;
export const websiteId = `${siteConfig.url}/#website`;

export function nurseryId(location: NurseryLocation) {
  return `${absoluteUrl(`/nurseries/${location.slug}`)}#nursery`;
}

/**
 * A setting's LocalBusiness node. Fields the setting cannot yet evidence -
 * a postcode, coordinates, a phone line, an Ofsted award - are omitted rather
 * than filled with the other nursery's values.
 */
export function nurseryNode(location: NurseryLocation) {
  const url = absoluteUrl(`/nurseries/${location.slug}`);
  return {
    "@type": "ChildCare",
    "@id": nurseryId(location),
    name: location.name,
    alternateName: `${siteConfig.name} ${location.shortName}`,
    url,
    parentOrganization: { "@id": organizationId },
    logo: absoluteUrl("/images/brand/little-giants-logo.png"),
    image: location.images.map((image) => absoluteUrl(image)),
    email: location.email,
    ...(location.phoneHref ? { telephone: location.phoneHref } : {}),
    priceRange: "££",
    currenciesAccepted: "GBP",
    address: {
      "@type": "PostalAddress",
      streetAddress: [location.address.line1, location.address.line2].filter(Boolean).join(", "),
      addressLocality: location.address.locality,
      addressRegion: location.address.region,
      ...(location.address.postalCode ? { postalCode: location.address.postalCode } : {}),
      addressCountry: location.address.country,
    },
    ...(location.geo
      ? { geo: { "@type": "GeoCoordinates", latitude: location.geo.latitude, longitude: location.geo.longitude } }
      : {}),
    openingHoursSpecification: location.openingHours.map((entry) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: entry.dayOfWeek,
      opens: entry.opens,
      closes: entry.closes,
    })),
    areaServed: location.areaServed,
    sameAs: [siteConfig.instagram, ...(location.ofsted ? [location.ofsted.provider] : [])],
    hasMap: mapUrl(location),
    ...(location.foundingDate ? { foundingDate: location.foundingDate } : {}),
    ...(location.ofsted ? { award: `Ofsted ${location.ofsted.rating}, ${location.ofsted.inspected}` } : {}),
  };
}

export function organizationNode() {
  return {
    "@type": "EducationalOrganization",
    "@id": organizationId,
    name: siteConfig.name,
    legalName: siteConfig.legalName,
    url: siteConfig.url,
    logo: absoluteUrl("/images/brand/little-giants-logo.png"),
    description: siteConfig.description,
    email: siteConfig.email,
    sameAs: [siteConfig.instagram],
    subOrganization: locations.map((location) => ({ "@id": nurseryId(location) })),
    location: locations.map((location) => ({ "@id": nurseryId(location) })),
  };
}

export function websiteNode() {
  return {
    "@type": "WebSite",
    "@id": websiteId,
    url: siteConfig.url,
    name: siteConfig.name,
    description: siteConfig.description,
    publisher: { "@id": organizationId },
    inLanguage: "en-GB",
  };
}

/** Home > Our nurseries > Uxbridge > page, built from the page's own slug. */
export function breadcrumbNode(page: SitePage) {
  const items: { "@type": "ListItem"; position: number; name: string; item: string }[] = [
    { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url },
  ];

  const trail = page.slug;
  let position = 2;
  for (let depth = 1; depth <= trail.length; depth += 1) {
    const segments = trail.slice(0, depth);
    const path = `/${segments.join("/")}`;
    if (path === pathFor(page)) break;
    const ancestor = ancestorName(segments);
    if (!ancestor) continue;
    items.push({ "@type": "ListItem", position, name: ancestor, item: absoluteUrl(path) });
    position += 1;
  }

  items.push({ "@type": "ListItem", position, name: page.heading, item: absoluteUrl(pathFor(page)) });
  return { "@type": "BreadcrumbList", itemListElement: items };
}

function ancestorName(segments: string[]): string | undefined {
  if (segments.length === 1 && segments[0] === "nurseries") return "Our nurseries";
  if (segments.length === 2 && segments[0] === "nurseries") {
    const location = locations.find((entry) => entry.slug === segments[1]);
    return location?.shortName;
  }
  if (segments.length === 3 && segments[2] === "curriculum") return "Curriculum";
  return undefined;
}

export function webPageNode(page: SitePage, type: "WebPage" | "ContactPage" = "WebPage") {
  const url = absoluteUrl(pathFor(page));
  const location = page.location ? locations.find((entry) => entry.slug === page.location) : undefined;
  return {
    "@type": type,
    "@id": `${url}#webpage`,
    url,
    name: page.title,
    description: page.description,
    isPartOf: { "@id": websiteId },
    about: { "@id": location ? nurseryId(location) : organizationId },
  };
}
