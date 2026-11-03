import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock3, MapPin, Phone } from "lucide-react";
import { ButtonLink } from "@/components/button-link";
import { addressText, locations } from "@/content/locations";

/** The group-level list of settings, linked from the "Our nurseries" menu. */
export function NurseriesIndex() {
  return (
    <main>
      <section className="contact-hero">
        <div className="shell contact-hero__grid">
          <div>
            <p className="eyebrow">Our nurseries</p>
            <h1>Two nurseries, one approach</h1>
            <p className="lead">
              Little Giants runs an Ofsted-rated Good nursery in Uxbridge and is opening a second setting in Woodley, Reading. Both follow the same STEM and Montessori curriculum, the same key-person approach, and the same standards.
            </p>
            <p>
              Pick the setting nearest you to see its rooms, fees, and enquiry details. The nurseries are run as one team, so a question asked at either will reach someone who can answer it.
            </p>
          </div>
          <div className="contact-hero__image">
            <Image
              alt="Montessori-style wooden learning materials arranged on open shelves"
              fetchPriority="high"
              fill
              loading="eager"
              sizes="(max-width: 800px) 100vw, 45vw"
              src="/images/source/home-page-12-unsplash-image-p-4lnpp2uvk.jpg"
            />
          </div>
        </div>
      </section>

      <section className="rooms-section">
        <div className="shell">
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
                  <h2>{location.shortName}</h2>
                  <p>{location.status === "open" ? "Open now" : "Opening soon"} &middot; {addressText(location)}</p>
                  <strong>See this nursery <ArrowRight aria-hidden="true" size={18} /></strong>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="getting-here-section">
        <div className="shell">
          <div className="section-heading section-heading--center">
            <p className="eyebrow">At a glance</p>
            <h2>How the two settings compare</h2>
          </div>
          <div className="travel-grid">
            {locations.map((location) => (
              <article key={location.slug}>
                <MapPin aria-hidden="true" />
                <h3>{location.shortName}</h3>
                <p>{addressText(location)}</p>
                <p>
                  <Clock3 aria-hidden="true" size={16} /> {location.hours}
                </p>
                {location.phoneDisplay ? (
                  <p><Phone aria-hidden="true" size={16} /> {location.phoneDisplay}</p>
                ) : (
                  <p>Phone line being set up. Enquiries by email for now.</p>
                )}
                <p>{location.ofsted ? `Ofsted ${location.ofsted.rating}, ${location.ofsted.inspected}` : "Not yet inspected: the setting has not opened."}</p>
              </article>
            ))}
          </div>
          <div className="centered-action">
            <ButtonLink href={`/nurseries/${locations[0].slug}/contact`} variant="secondary">Contact our Uxbridge nursery</ButtonLink>
          </div>
        </div>
      </section>
    </main>
  );
}
