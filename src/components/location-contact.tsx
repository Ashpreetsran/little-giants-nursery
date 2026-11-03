import Image from "next/image";
import { Bus, Clock3, Mail, MapPin, ParkingCircle, Phone, TrainFront } from "lucide-react";
import { ButtonLink } from "@/components/button-link";
import { addressText, mapUrl, type NurseryLocation } from "@/content/locations";

const travelIcons = {
  bus: Bus,
  train: TrainFront,
  car: ParkingCircle,
} as const;

/**
 * A setting's contact page. Phone links render only where the setting has a
 * number: Woodley has no line yet, so every tel affordance disappears rather
 * than quietly falling back to the Uxbridge number.
 */
export function LocationContact({ location }: { location: NurseryLocation }) {
  const openingSoon = location.status === "opening-soon";
  const hasPhone = Boolean(location.phoneDisplay && location.phoneHref);

  return (
    <main>
      <section className="contact-hero">
        <div className="shell contact-hero__grid">
          <div>
            <p className="eyebrow">{openingSoon ? "Opening soon" : "Come and meet us"}</p>
            <h1>
              {openingSoon
                ? `Register your interest in ${location.shortName}`
                : `Visit Little Giants Nursery in ${location.shortName}`}
            </h1>
            <p className="lead">
              {openingSoon
                ? "Tell us what you need and when you need it. We will come back to you with opening dates, fees, session patterns, and the first chance to look round."
                : "A personal tour gives you time to notice the atmosphere, see the spaces, meet the team, and ask the questions that matter to your family."}
            </p>
            <p>
              {openingSoon
                ? "Registering costs nothing and commits you to nothing. It simply means you hear first, which matters at a new setting where the earliest places go to the families already in touch."
                : "Once you complete our enquiry form, you’ll receive our Parent Information Pack along with a link to book your show-around. It’s the quickest way to get all the details you need and secure your visit."}
            </p>
            <div className="contact-details-list">
              {hasPhone ? (
                <a href={`tel:${location.phoneHref}`}><Phone aria-hidden="true" /><span><small>Call us</small>{location.phoneDisplay}</span></a>
              ) : null}
              <a href={`mailto:${location.email}`}><Mail aria-hidden="true" /><span><small>Email us</small>{location.email}</span></a>
              <div><Clock3 aria-hidden="true" /><span><small>{openingSoon ? "Planned opening hours" : "Opening hours"}</small>{location.hours}</span></div>
              <div><MapPin aria-hidden="true" /><span><small>Find us</small>{addressText(location)}</span></div>
            </div>
          </div>
          <div className="contact-hero__image">
            <Image alt={location.heroAlt} fetchPriority="high" fill loading="eager" sizes="(max-width: 800px) 100vw, 45vw" src={location.heroImage} />
          </div>
        </div>
      </section>

      <section className="contact-form-section" id="enquire">
        <span className="legacy-anchor" id="contact" aria-hidden="true" />
        <div className="shell contact-form-layout">
          <div className="enquiry-panel">
            <p className="eyebrow">Tell us what you need</p>
            <h2>{openingSoon ? "Start your Woodley enquiry" : "Start your nursery enquiry"}</h2>
            <p>
              Complete our enquiry form and the nursery team will come back to you about availability, visits, sessions, and fees.
              {hasPhone ? " Prefer to talk it through? Email or call us directly." : " Prefer to write? Email us directly."}
            </p>
            <div className="enquiry-panel__actions">
              <ButtonLink href={location.enquiryUrl}>Complete the enquiry form</ButtonLink>
              <ButtonLink external href={`mailto:${location.email}`} variant="secondary">Email {location.email}</ButtonLink>
              {hasPhone ? (
                <ButtonLink external href={`tel:${location.phoneHref}`} variant="secondary">Call {location.phoneDisplay}</ButtonLink>
              ) : null}
            </div>
            <p className="enquiry-panel__note">Your details go directly to the nursery team. We do not sell or share enquiries for marketing.</p>
          </div>
          <aside className="form-aside">
            <p className="eyebrow">What happens next?</p>
            <ol>
              <li><span>1</span><div><strong>We read your enquiry</strong><p>The nursery team checks the details and availability you have asked about.</p></div></li>
              <li><span>2</span><div><strong>We get in touch</strong><p>{openingSoon ? "We answer your questions and tell you where the opening timetable has got to." : "We answer your questions and agree a useful time for a nursery visit."}</p></div></li>
              <li><span>3</span><div><strong>{openingSoon ? "You see the nursery" : "You tour the nursery"}</strong><p>{openingSoon ? "As soon as the building is ready for visitors, registered families are invited first." : "See the relevant room, meet educators, and talk through routines, fees, and a possible start."}</p></div></li>
            </ol>
          </aside>
        </div>
      </section>

      <section className="getting-here-section">
        <div className="shell">
          <div className="section-heading section-heading--center">
            <p className="eyebrow">Getting here</p>
            <h2>{location.home.place.heading}</h2>
          </div>
          <div className="travel-grid">
            {location.travel.map((option) => {
              const Icon = travelIcons[option.icon];
              return (
                <article key={option.title}>
                  <Icon aria-hidden="true" />
                  <h3>{option.title}</h3>
                  <p>{option.text}</p>
                </article>
              );
            })}
          </div>
          <div className="centered-action">
            <ButtonLink href={mapUrl(location)} variant="secondary">Open Google Maps</ButtonLink>
          </div>
        </div>
      </section>

      {location.team.length > 0 ? (
        <section className="team-contact-section">
          <div className="shell team-contact-section__grid">
            <div>
              <p className="eyebrow">People, not a call centre</p>
              <h2>Your enquiry reaches the nursery team</h2>
              <p className="lead">
                {location.team.map((member) => member.name.split(" ")[0]).join(" and ")} understand the rooms, routines, and real questions families ask. They will help you work out whether Little Giants is the right fit.
              </p>
            </div>
            <div className="team-mini-grid">
              {location.team.map((member) => (
                <article key={member.name}>
                  <div><Image alt={member.alt} fill sizes="160px" src={member.image} /></div>
                  <h3>{member.name}</h3><p>{member.role}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}
