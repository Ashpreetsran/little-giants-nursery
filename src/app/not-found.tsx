import type { Metadata } from "next";
import Image from "next/image";
import { ButtonLink } from "@/components/button-link";

export const metadata: Metadata = {
  title: "Page Not Found | Little Giants Nursery",
  description: "Return to the Little Giants Nursery website or find the nursery nearest you in Uxbridge or Woodley.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="not-found-page">
      <div className="shell not-found-page__grid">
        <div>
          <p className="eyebrow">404: Page not found</p>
          <h1>That page has wandered off</h1>
          <p className="lead">The address may have changed, or the page may no longer exist. You can return to the nursery homepage or ask our team for help.</p>
          <div className="hero-actions">
            <ButtonLink href="/">Return home</ButtonLink>
            <ButtonLink href="/nurseries" variant="secondary">Find your nearest nursery</ButtonLink>
          </div>
        </div>
        <div className="not-found-page__image">
          <Image
            alt="Colourful numbers and learning materials arranged for play"
            fetchPriority="high"
            fill
            loading="eager"
            sizes="(max-width: 800px) 100vw, 44vw"
            src="/images/source/about-us-08-img-9177.jpg"
          />
        </div>
      </div>
    </main>
  );
}
