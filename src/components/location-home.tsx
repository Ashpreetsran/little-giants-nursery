import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Baby,
  Blocks,
  BookOpen,
  BrainCircuit,
  Check,
  HeartHandshake,
  Leaf,
  MapPin,
  Quote,
  ShieldCheck,
  Sparkles,
  Telescope,
  Utensils,
} from "lucide-react";
import { ButtonLink } from "@/components/button-link";
import { mapUrl, type NurseryLocation } from "@/content/locations";
import { pageHref, roomLinksFor, testimonials } from "@/lib/site";

const curriculumCards = [
  { icon: HeartHandshake, title: "Care", text: "Secure relationships and individual care help children feel ready to explore." },
  { icon: BrainCircuit, title: "Cognition", text: "Hands-on experiences build thinking, reasoning, language, and problem-solving." },
  { icon: Blocks, title: "Continuity", text: "Thoughtful next steps help learning connect and deepen over time." },
  { icon: Telescope, title: "Curiosity", text: "Rich spaces and responsive adults keep children's questions alive." },
];

const trustIcons = {
  shield: ShieldCheck,
  utensils: Utensils,
  leaf: Leaf,
  pin: MapPin,
} as const;

/**
 * A setting's landing page. Every location-specific value comes from the
 * NurseryLocation record, and sections that depend on evidence a new setting
 * does not have yet - an Ofsted grade, parent quotes, photographs of its own
 * rooms - are omitted rather than borrowed from the other nursery.
 */
export function LocationHome({ location }: { location: NurseryLocation }) {
  const { home } = location;
  const rooms = roomLinksFor(location);
  // A setting only links to its own pages, never to the other nursery's.
  const href = (...segments: string[]) => pageHref(location.slug, segments);
  const contactHref = href("contact") ?? "/nurseries";
  const environmentHref = href("nursery-environment");
  const aboutHref = href("about");
  const curriculumLinks = [
    { label: "Explore STEM", href: href("curriculum", "stem") },
    { label: "Explore Montessori", href: href("curriculum", "montessori") },
  ].filter((link): link is { label: string; href: string } => link.href !== null);
  const curriculumHref = href("curriculum");
  const ofstedHref = href("ofsted");
  const enquiryLabel = location.status === "open" ? "Book a nursery tour" : "Register your interest";

  return (
    <main>
      <section className="home-hero">
        <div className="shell home-hero__grid">
          <div className="home-hero__copy">
            <p className="eyebrow"><Sparkles aria-hidden="true" size={16} /> {location.name}</p>
            <h1>{home.headingLead} <span>{home.headingHighlight}</span></h1>
            <p className="home-hero__intro">{home.intro}</p>
            <div className="hero-actions">
              <ButtonLink href={contactHref}>{enquiryLabel}</ButtonLink>
              {environmentHref ? <ButtonLink href={environmentHref} variant="secondary">Explore our nursery</ButtonLink> : null}
            </div>
            <ul className="hero-checks" aria-label="Nursery highlights">
              {home.highlights.map((highlight) => (
                <li key={highlight}><Check aria-hidden="true" size={17} /> {highlight}</li>
              ))}
            </ul>
          </div>

          <div className="home-hero__visual">
            <div className="home-hero__image">
              <Image
                alt={location.heroAlt}
                fetchPriority="high"
                fill
                loading="eager"
                sizes="(max-width: 900px) 100vw, 50vw"
                src={location.heroImage}
              />
            </div>
            {location.ofsted ? (
              <a className="ofsted-float" href={location.ofsted.report} rel="noreferrer" target="_blank">
                <Image src="/images/source/ofsted-good-provider.jpg" alt="Ofsted Good Provider" width={639} height={639} sizes="(max-width: 900px) 88px, 112px" />
                <span>Rated {location.ofsted.rating}<br />{location.ofsted.inspected}</span>
              </a>
            ) : null}
            <div className="hero-scribble" aria-hidden="true">En avant!</div>
          </div>
        </div>
        <div className="home-hero__wave" aria-hidden="true" />
      </section>

      <section className="trust-strip">
        <div className="shell trust-strip__grid">
          {home.trust.map((point) => {
            const Icon = trustIcons[point.icon];
            return (
              <div key={point.strong}>
                <Icon aria-hidden="true" />
                <span><strong>{point.strong}</strong> {point.text}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="intro-section">
        <div className="shell intro-section__grid">
          <div className="intro-section__image-wrap">
            <div className="intro-section__image">
              <Image alt={home.story.imageAlt} fill sizes="(max-width: 800px) 100vw, 45vw" src={home.story.image} />
            </div>
            {home.story.imageLabel ? <span className="intro-section__label">{home.story.imageLabel}</span> : null}
          </div>
          <div>
            <p className="eyebrow">{home.story.eyebrow}</p>
            <h2>{home.story.heading}</h2>
            <p className="lead">{home.story.lead}</p>
            <p>{home.story.body}</p>
            {aboutHref ? <ButtonLink href={aboutHref} variant="text">Our story and approach</ButtonLink> : null}
          </div>
        </div>
      </section>

      <section className="rooms-section">
        <div className="shell">
          <div className="section-heading section-heading--row">
            <div>
              <p className="eyebrow">A place for every stage</p>
              <h2>Growing rooms for growing minds</h2>
            </div>
            <p>Each room has its own rhythm, resources, and next steps, connected by the same warm approach.</p>
          </div>
          <div className="room-grid">
            {rooms.map((room) => (
              <Link className={`room-card room-card--${room.colour}`} href={room.href} key={room.href}>
                <div className="room-card__image">
                  <Image alt={room.imageAlt} fill sizes="(max-width: 800px) 100vw, 400px" src={room.image} />
                  {room.badge ? <span className="image-badge">{room.badge}</span> : null}
                </div>
                <div className="room-card__copy">
                  <span>{room.title === "Babies" ? <Baby aria-hidden="true" /> : room.title === "Toddlers" ? <Blocks aria-hidden="true" /> : <BookOpen aria-hidden="true" />}</span>
                  <h3>{room.title}</h3>
                  <p>{room.description}</p>
                  <strong>Explore the room <ArrowRight aria-hidden="true" size={18} /></strong>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="curriculum-feature">
        <div className="shell curriculum-feature__grid">
          <div className="curriculum-feature__copy">
            <p className="eyebrow">Our bespoke curriculum</p>
            <h2>Montessori independence meets playful STEM</h2>
            <p className="lead">
              Children choose, concentrate, build, test, wonder, and try again. Educators add language, knowledge, and challenge without taking ownership away from the learner.
            </p>
            {curriculumLinks.length > 0 ? (
              <div className="curriculum-links">
                {curriculumLinks.map((link) => <ButtonLink href={link.href} key={link.href} variant="light">{link.label}</ButtonLink>)}
              </div>
            ) : null}
          </div>
          <div className="curriculum-mosaic">
            <div className="curriculum-mosaic__large">
              <Image alt="A small-world investigation with animals, natural materials, and vehicles" fill sizes="(max-width: 800px) 100vw, 600px" src="/images/derived/about-us-14-img-9421-landscape.jpg" />
            </div>
            <div className="curriculum-mosaic__small">
              <Image alt="Colourful numbers and loose parts arranged for hands-on maths" fill sizes="(max-width: 800px) 45vw, 16vw" src="/images/source/about-us-08-img-9177.jpg" />
            </div>
            <div className="curriculum-mosaic__small">
              <Image alt="Open shelves with Montessori-inspired learning materials" fill sizes="(max-width: 800px) 45vw, 16vw" src="/images/source/home-page-12-unsplash-image-p-4lnpp2uvk.jpg" />
            </div>
          </div>
        </div>
      </section>

      <section className="four-cs-section">
        <div className="shell">
          <div className="section-heading section-heading--center">
            <p className="eyebrow">The building blocks of our day</p>
            <h2>Four C’s, one confident child</h2>
            <p>Our simple framework keeps care and learning connected.</p>
          </div>
          <div className="four-cs-grid">
            {curriculumCards.map(({ icon: Icon, title, text }, index) => (
              <article key={title}>
                <span className="four-cs-grid__number">0{index + 1}</span>
                <Icon aria-hidden="true" />
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
          {curriculumHref ? <div className="centered-action"><ButtonLink href={curriculumHref} variant="secondary">Explore our curriculum</ButtonLink></div> : null}
        </div>
      </section>

      {location.ofsted ? (
        <section className="ofsted-section">
          <div className="shell ofsted-section__grid">
            <div className="ofsted-section__badge">
              <Image src="/images/source/ofsted-good-provider.jpg" alt="Ofsted Good Provider" width={639} height={639} sizes="(max-width: 800px) 220px, 347px" />
            </div>
            <div>
              <p className="eyebrow">Independent reassurance</p>
              <h2>Good in every inspection area</h2>
              <p className="lead">
                Our {location.ofsted.inspected} Ofsted report describes children arriving happy, interesting activities linked to their interests, strong parent partnerships, and effective safeguarding.
              </p>
              <ul className="check-list check-list--columns">
                <li><Check aria-hidden="true" size={18} /> Quality of education: {location.ofsted.rating}</li>
                <li><Check aria-hidden="true" size={18} /> Behaviour and attitudes: {location.ofsted.rating}</li>
                <li><Check aria-hidden="true" size={18} /> Personal development: {location.ofsted.rating}</li>
                <li><Check aria-hidden="true" size={18} /> Leadership and management: {location.ofsted.rating}</li>
              </ul>
              <div className="hero-actions">
                {ofstedHref ? <ButtonLink href={ofstedHref} variant="light">What Ofsted found</ButtonLink> : null}
                <ButtonLink href={location.ofsted.report} variant="text">Read the full report</ButtonLink>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {home.gallery.length > 0 ? (
        <section className="gallery-section">
          <div className="shell">
            <div className="section-heading section-heading--row">
              <div><p className="eyebrow">Inside Little Giants</p><h2>A nursery made for discovery</h2></div>
              {environmentHref ? <ButtonLink href={environmentHref} variant="text">See rooms and gardens</ButtonLink> : null}
            </div>
            <div className="gallery-grid">
              {home.gallery.map((item, index) => (
                <div className={`gallery-grid__item gallery-grid__item--${index + 1}`} key={item.src}>
                  <Image alt={item.alt} fill sizes="(max-width: 700px) 100vw, 33vw" src={item.src} />
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {home.showTestimonials ? (
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
      ) : null}

      <section className="location-section">
        <div className="shell location-section__grid">
          <div>
            <p className="eyebrow">{home.place.eyebrow}</p>
            <h2>{home.place.heading}</h2>
            <p className="lead">{home.place.lead}</p>
            <address>
              {location.address.line1}<br />
              {location.address.line2 ? <>{location.address.line2}, </> : null}{location.address.locality}
              {location.address.postTown ? <>, {location.address.postTown}</> : null}
              {location.address.postalCode ? <><br />{location.address.postalCode}</> : null}
            </address>
            <div className="hero-actions">
              <ButtonLink href={contactHref}>{enquiryLabel}</ButtonLink>
              <ButtonLink href={mapUrl(location)} variant="text">Get directions</ButtonLink>
            </div>
          </div>
          <div className="location-card">
            <Image alt={home.place.cardImageAlt} fill sizes="(max-width: 800px) 100vw, 45vw" src={home.place.cardImage} />
            <div><MapPin aria-hidden="true" /><span>{location.address.locality}<br /><small>{location.address.postTown ?? location.address.region}</small></span></div>
          </div>
        </div>
      </section>

      <section className="tour-cta tour-cta--home">
        <div className="shell tour-cta__inner">
          <div>
            <p className="eyebrow">A giant next step</p>
            <h2>Could Little Giants feel right for your family?</h2>
            <p>
              {location.status === "open"
                ? "Come and meet us. We will show you around and answer the questions that matter to you."
                : "Register your interest and we will contact you with opening dates, fees, and visit times as soon as they are confirmed."}
            </p>
          </div>
          <ButtonLink href={contactHref} variant="light">{enquiryLabel}</ButtonLink>
        </div>
      </section>
    </main>
  );
}
