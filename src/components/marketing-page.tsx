import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Quote, Sparkles } from "lucide-react";
import { ButtonLink } from "@/components/button-link";
import type { NurseryLocation } from "@/content/locations";
import type { MarketingContent } from "@/content/page-types";

export function MarketingPage({ location, page }: { location: NurseryLocation; page: MarketingContent }) {
  const hasCurriculumParent = page.slug[2] === "curriculum" && page.slug.length > 3;
  const locationHref = `/nurseries/${location.slug}`;
  const contactHref = `${locationHref}/contact`;
  const enquiryLabel = location.status === "open" ? "Book a nursery tour" : "Register your interest";
  const hasPhone = Boolean(location.phoneDisplay && location.phoneHref);

  return (
    <main>
      <section className="page-hero">
        <div className="shell page-hero__grid">
          <div className="page-hero__copy">
            <nav className="breadcrumbs" aria-label="Breadcrumb">
              <Link href="/">Home</Link>
              <span aria-hidden="true">/</span>
              <Link href="/nurseries">Our nurseries</Link>
              <span aria-hidden="true">/</span>
              <Link href={locationHref}>{location.shortName}</Link>
              <span aria-hidden="true">/</span>
              {hasCurriculumParent ? (
                <>
                  <Link href={`${locationHref}/curriculum`}>Curriculum</Link>
                  <span aria-hidden="true">/</span>
                </>
              ) : null}
              <span>{page.eyebrow}</span>
            </nav>
            <p className="eyebrow"><Sparkles aria-hidden="true" size={16} /> {page.eyebrow}</p>
            <h1>{page.heading}</h1>
            <p className="page-hero__intro">{page.intro}</p>
            <div className="hero-actions">
              <ButtonLink href={contactHref}>{enquiryLabel}</ButtonLink>
              {hasPhone ? (
                <ButtonLink href={`tel:${location.phoneHref}`} variant="text" external>Call {location.phoneDisplay}</ButtonLink>
              ) : (
                <ButtonLink href={`mailto:${location.email}`} variant="text" external>Email {location.email}</ButtonLink>
              )}
            </div>
          </div>
          <div className="page-hero__image-wrap">
            <div className="page-hero__image">
              <Image
                alt={page.heroAlt}
                fetchPriority="high"
                fill
                loading="eager"
                sizes="(max-width: 900px) 100vw, 48vw"
                src={page.heroImage}
                style={{ objectPosition: page.heroPosition ?? "center" }}
              />
              {page.heroBadge ? <span className="image-badge">{page.heroBadge}</span> : null}
            </div>
            <span className="doodle doodle--sun" aria-hidden="true">✦</span>
            <span className="doodle doodle--loop" aria-hidden="true" />
          </div>
        </div>
      </section>

      <section className="fact-strip" aria-label="Key facts">
        <div className="shell fact-strip__grid">
          {page.facts.map((fact) => (
            <div key={`${fact.value}-${fact.label}`}>
              <strong>{fact.value}</strong>
              <span>{fact.label}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="content-sections">
        {page.sections.map((section, index) => (
          <section
            className={`content-section ${index % 2 === 1 ? "content-section--reverse" : ""} ${section.image ? "" : "content-section--no-image"}`}
            id={section.id}
            key={section.heading}
          >
            <div className="shell content-section__grid">
              <div className="content-section__copy">
                {section.eyebrow ? <p className="eyebrow">{section.eyebrow}</p> : null}
                <h2>{section.heading}</h2>
                {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                {section.bullets ? (
                  <ul className="check-list">
                    {section.bullets.map((bullet) => (
                      <li key={bullet}><Check aria-hidden="true" size={18} />{bullet}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
              {section.image ? (
                <div className="content-section__visual">
                  <div className="content-section__image">
                    <Image
                      alt={section.imageAlt ?? ""}
                      fill
                      sizes="(max-width: 800px) 100vw, 45vw"
                      src={section.image}
                    />
                    {section.imageBadge ? <span className="image-badge">{section.imageBadge}</span> : null}
                  </div>
                  <span aria-hidden="true" className="image-dot-grid" />
                </div>
              ) : null}
            </div>
          </section>
        ))}
      </div>

      {page.quote ? (
        <section className="quote-band">
          <div className="shell quote-band__inner">
            <Quote aria-hidden="true" size={42} />
            <blockquote>
              <p>{page.quote.text}</p>
              <footer>
                {page.quote.href ? (
                  <a href={page.quote.href} rel="noreferrer" target="_blank">{page.quote.attribution}</a>
                ) : page.quote.attribution}
              </footer>
            </blockquote>
          </div>
        </section>
      ) : null}

      <section className="faq-section">
        <div className="shell faq-grid">
          <div>
            <p className="eyebrow">Questions families ask</p>
            <h2>Useful answers before you visit</h2>
            <p>Every child and attendance plan is different. Bring the details that matter to you, and we will give you a clear answer.</p>
            <ButtonLink href={contactHref} variant="secondary">Ask the nursery team</ButtonLink>
          </div>
          <div className="faq-list">
            {page.faqs.map((faq, index) => (
              <details key={faq.question} open={index === 0}>
                <summary>{faq.question}<span aria-hidden="true">+</span></summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="related-section">
        <div className="shell">
          <div className="section-heading section-heading--row">
            <div>
              <p className="eyebrow">Keep exploring</p>
              <h2>Your next useful page</h2>
            </div>
          </div>
          <div className="related-grid">
            {page.related.map((item, index) => {
              const external = item.href.startsWith("http");
              const content = (
                <>
                  <span className="related-card__number">0{index + 1}</span>
                  <h3>{item.label}</h3>
                  <p>{item.text}</p>
                  <span className="related-card__link">Explore <ArrowRight aria-hidden="true" size={18} /></span>
                </>
              );
              return external ? (
                <a className="related-card" href={item.href} key={item.href} rel="noreferrer" target="_blank">{content}</a>
              ) : (
                <Link className="related-card" href={item.href} key={item.href}>{content}</Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="tour-cta">
        <div className="shell tour-cta__inner">
          <div>
            <p className="eyebrow">En avant</p>
            <h2>{location.status === "open" ? "Come and take a look around" : `Be first through the door in ${location.shortName}`}</h2>
            <p>
              {location.status === "open"
                ? "Meet the team, explore the rooms, and talk through the childcare you need."
                : "Register your interest and we will contact you with opening dates, fees, and the first chance to look round."}
            </p>
          </div>
          <ButtonLink href={contactHref} variant="light">{enquiryLabel}</ButtonLink>
        </div>
      </section>
    </main>
  );
}
