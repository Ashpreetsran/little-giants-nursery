import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/json-ld";
import { LocationContact } from "@/components/location-contact";
import { LocationHome } from "@/components/location-home";
import { MarketingPage } from "@/components/marketing-page";
import { NurseriesIndex } from "@/components/nurseries-index";
import { getLocation } from "@/content/locations";
import { catchAllPages, getSitePage, pathFor, socialCardName, type SitePage } from "@/content/site-pages";
import { breadcrumbNode, nurseryNode, webPageNode } from "@/lib/schema";
import { absoluteAssetUrl, absoluteUrl, siteConfig } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return catchAllPages.map((page) => ({ slug: page.slug }));
}

function renderablePage(slug: string[]): SitePage | undefined {
  const page = getSitePage(slug);
  return page && catchAllPages.includes(page) ? page : undefined;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = renderablePage(slug);

  if (!page) return {};

  const pathname = pathFor(page);
  const socialImage = absoluteAssetUrl(`/og/${socialCardName(page)}.jpg`);
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: pathname },
    openGraph: {
      type: "website",
      locale: "en_GB",
      siteName: siteConfig.name,
      title: page.title,
      description: page.description,
      url: absoluteUrl(pathname),
      images: [{ url: socialImage, width: 1200, height: 630, alt: page.heading }],
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.description,
      images: [socialImage],
    },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const page = renderablePage(slug);
  if (!page) notFound();

  const location = page.location ? getLocation(page.location) : undefined;
  const graph: object[] = [
    webPageNode(page, page.template === "location-contact" ? "ContactPage" : "WebPage"),
    breadcrumbNode(page),
  ];

  if (page.template === "location-home" && location) {
    graph.push(nurseryNode(location));
  }

  if (page.template === "marketing" && page.content) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: page.content.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: { "@type": "Answer", text: faq.answer },
      })),
    });
  }

  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@graph": graph }} />
      {page.template === "nurseries-index" ? <NurseriesIndex /> : null}
      {page.template === "location-home" && location ? <LocationHome location={location} /> : null}
      {page.template === "location-contact" && location ? <LocationContact location={location} /> : null}
      {page.template === "marketing" && page.content && location ? (
        <MarketingPage location={location} page={page.content} />
      ) : null}
    </>
  );
}
