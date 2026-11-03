import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BrainCircuit, Check, HeartHandshake, MapPin, Quote, ShieldCheck, Sparkles } from "lucide-react";
import { ButtonLink } from "@/components/button-link";
import { JsonLd } from "@/components/json-ld";
import { addressText, locations } from "@/content/locations";
import { getSitePage, socialCardName } from "@/content/site-pages";
import { nurseryNode, organizationNode, websiteNode } from "@/lib/schema";
import { absoluteAssetUrl, siteConfig, testimonials } from "@/lib/site";

const page = getSitePage([])!;
const socialImage = absoluteAssetUrl(`/og/${socialCardName(page)}.jpg`);

export const metadata: Metadata = {
  title: page.title,
  description: page.description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_GB",
    siteName: siteConfig.name,
    title: "Day nurseries in Uxbridge and Woodley",
    description:
      "Ofsted-rated Good early years care in Uxbridge, and a second nursery opening soon on Headley Road in Woodley, Reading.",
    url: siteConfig.url,
    images: [{ url: socialImage, width: 1200, height: 630, alt: page.heading }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Day nurseries in Uxbridge and Woodley",
    description: "Nurturing curious, confident learners at Little Giants Nursery.",
    images: [socialImage],
  },
};

const groupSchema = {
  "@context": "https://schema.org",
  "@graph": [organizationNode(), websiteNode(), ...locations.map(nurseryNode)],
};

export default function Home() {
  return (
    <main>
      <JsonLd data={groupSchema} />

      <section className="home-hero">
        <div className="shell home-hero__grid">
          <div className="home-hero__copy">
            <p className="eyebrow"><Sparkles aria-hidden="true" size={16} /> {siteConfig.name}</p>
            <h1>Day nurseries in <span>Uxbridge and Woodley</span></h1>
            <p className="home-hero__intro">
              STEM and Montessori early years care for babies, toddlers, and preschoolers. Ofsted rated Good in Uxbridge, with a second nursery opening soon in Woodley, Reading.
            </p>
            <div className="hero-actions">
              {locations.map((location) => (
                <ButtonLink
                  href={`/nurseries/${location.slug}`}
                  key={location.slug}
                  variant={location.status === "open" ? "primary" : "secondary"}
                >
                  {location.status === "open" ? `Our ${location.shortName} nursery` : `${location.shortName}: opening soon`}
                </ButtonLink>
              ))}
            </div>
            <ul className="hero-checks" aria-label="Nursery highlights">
              <li><Check aria-hidden="true" size={17} /> Ofsted Good in Uxbridge</li>
              <li><Check aria-hidden="true" size={17} /> Babies, toddlers, and preschool</li>
              <li><Check aria-hidden="true" size={17} /> STEM and Montessori curriculum</li>
              <li><Check aria-hidden="true" size={17} /> Meals and nappies included</li>
              <li><Check aria-hidden="true" size={17} /> New nursery opening in Woodley</li>
            </ul>
          </div>

          <div className="home-hero__visual">
            <div className="home-hero__image">
              <Image
                alt="The spacious, light-filled interior of Little Giants Nursery in Uxbridge"
                fetchPriority="high"
                fill
                loading="eager"
                sizes="(max-width: 900px) 100vw, 50vw"
                src="/images/source/about-us-12-img-9437.jpg"
              />
            </div>
            <div className="hero-scribble" aria-hidden="true">En avant!</div>
          </div>
        </div>
        <div className="home-hero__wave" aria-hidden="true" />
      </section>

      <section className="rooms-section">
        <div className="shell">
          <div className="section-heading section-heading--row">
            <div>
              <p className="eyebrow">Our nurseries</p>
              <h2>Find your nearest Little Giants</h2>
            </div>
            <p>Both settings follow the same curriculum, the same key-person approach, and the same standards.</p>
          </div>
          <div className="room-grid">
            {locations.map((location, index) => (
              <Link
                className={`room-card room-card--${index === 0 ? "aqua" : "peach"}`}
                href={`/nurseries/${location.slug}`}
                key={location.slug}
              >
                <div className="room-card__image">
                  <Image alt={location.heroAlt} fill sizes="(max-width: 800px) 100vw, 400px" src={location.heroImage} />
                </div>
                <div className="room-card__copy">
                  <span><MapPin aria-hidden="true" /></span>
                  <h3>{location.shortName}</h3>
                  <p>{location.status === "open" ? "Open now" : "Opening soon"} &middot; {addressText(location)}</p>
                  <strong>See this nursery <ArrowRight aria-hidden="true" size={18} /></strong>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="trust-strip">
        <div className="shell trust-strip__grid">
          <div><ShieldCheck aria-hidden="true" /><span><strong>Ofsted Good</strong> in every inspection area at Uxbridge</span></div>
          <div><HeartHandshake aria-hidden="true" /><span><strong>A named key person</strong> for every child</span></div>
          <div><BrainCircuit aria-hidden="true" /><span><strong>STEM and Montessori</strong> woven through the day</span></div>
          <div><MapPin aria-hidden="true" /><span><strong>Two settings</strong> across London and Berkshire</span></div>
        </div>
      </section>

      <section className="intro-section">
        <div className="shell intro-section__grid">
          <div className="intro-section__image-wrap">
            <div className="intro-section__image">
              <Image
                alt="The Old School House, home to Little Giants Nursery in Uxbridge"
                fill
                sizes="(max-width: 800px) 100vw, 45vw"
                src="/images/source/about-us-15-old-school-house.jpg"
              />
            </div>
            <span className="intro-section__label">The Old School House</span>
          </div>
          <div>
            <p className="eyebrow">A different kind of day nursery</p>
            <h2>Care that feels personal. Learning that feels alive.</h2>
            <p className="lead">
              Children thrive when they feel safe enough to be bold. Our team builds secure relationships first, then fills each day with meaningful choices, imaginative play, practical independence, and questions worth investigating.
            </p>
            <p>
              Inspired by Isambard Kingdom Brunel, our name is a reminder that small people can have giant ideas. Our motto is en avant: keep moving forward. It is what took us from one nursery in Uxbridge to a second in Woodley.
            </p>
            <ButtonLink href="/nurseries/uxbridge/about" variant="text">Our story and approach</ButtonLink>
          </div>
        </div>
      </section>

      <section className="testimonials-section">
        <div className="shell">
          <div className="section-heading section-heading--center">
            <p className="eyebrow">What parents say</p>
            <h2>Kind words from our nursery families</h2>
          </div>
          <div className="testimonial-grid">
            {testimonials.map((testimonial) => (
              <blockquote key={testimonial.name}>
                <Quote aria-hidden="true" />
                <p>{testimonial.quote}</p>
                <footer><strong>{testimonial.name}</strong><span>{testimonial.role}</span></footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      <section className="tour-cta tour-cta--home">
        <div className="shell tour-cta__inner">
          <div>
            <p className="eyebrow">A giant next step</p>
            <h2>Could Little Giants feel right for your family?</h2>
            <p>Pick the nursery nearest you and we will take it from there.</p>
          </div>
          <ButtonLink href="/nurseries" variant="light">Compare our nurseries</ButtonLink>
        </div>
      </section>
    </main>
  );
}
