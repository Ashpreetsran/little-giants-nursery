import type { Metadata } from "next";
import Image from "next/image";
import { GraduationCap, Heart, MapPin, Sprout, Users } from "lucide-react";
import { ButtonLink } from "@/components/button-link";
import { PageSchema } from "@/components/page-schema";
import { absoluteAssetUrl, absoluteUrl, siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Nursery Jobs and Careers | Little Giants Nursery",
  description:
    "Early years careers at Little Giants Nursery in Uxbridge and our new Woodley setting near Reading. Training, progression, and a supportive team culture.",
  alternates: { canonical: "/careers" },
  openGraph: {
    type: "website",
    locale: "en_GB",
    siteName: siteConfig.name,
    title: "Nursery Jobs and Careers | Little Giants Nursery",
    description: "Build your early years career with a friendly, ambitious nursery team in Uxbridge or Woodley.",
    url: absoluteUrl("/careers"),
    images: [{ url: absoluteAssetUrl("/og/careers.jpg"), width: 1200, height: 630, alt: "Build an early years career at Little Giants Nursery" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nursery Jobs and Careers | Little Giants Nursery",
    description: "Build your early years career with Little Giants Nursery.",
    images: [absoluteAssetUrl("/og/careers.jpg")],
  },
};

const benefits = [
  { icon: Users, title: "A close team", text: "Work with people who share ideas, notice effort, and care about doing the job well." },
  { icon: GraduationCap, title: "Training and support", text: "Build your early years knowledge through regular development and practical guidance." },
  { icon: Sprout, title: "Room to progress", text: "Develop new responsibilities as your confidence, qualifications, and experience grow." },
  { icon: MapPin, title: "Easy to reach", text: "Bus connections, a location near Brunel University, and parking at the nursery." },
];

export default function CareersPage() {
  return (
    <main>
      <PageSchema slug={["careers"]} />
      <section className="page-hero careers-hero">
        <div className="shell page-hero__grid">
          <div className="page-hero__copy">
            <p className="eyebrow">Join Little Giants</p>
            <h1>Build an early years career with Little Giants</h1>
            <p className="page-hero__intro">If you love helping children feel capable, curious, and cared for, we would be pleased to hear what you could bring to our team.</p>
            <div className="hero-actions">
              <ButtonLink href={`mailto:${siteConfig.email}?subject=Careers%20at%20Little%20Giants`}>Email your CV</ButtonLink>
              <ButtonLink href="/nurseries" variant="text">Meet Little Giants</ButtonLink>
            </div>
          </div>
          <div className="page-hero__image-wrap">
            <div className="page-hero__image careers-hero__image">
              <Image alt="Little Giants team members presenting STEM learning at an early years careers fair" fetchPriority="high" fill loading="eager" sizes="(max-width: 900px) 100vw, 48vw" src="/images/source/careers-01-078f1332-d17d-4ead-bdbb-fb3c29631231-jpg.jpg" />
            </div>
          </div>
        </div>
      </section>

      <section className="career-intro">
        <div className="shell narrow-copy">
          <Heart aria-hidden="true" />
          <p className="eyebrow">Purposeful work</p>
          <h2>Bring energy, kindness, and a willingness to learn</h2>
          <p className="lead">We value educators who take children’s ideas seriously, work well with families, reflect on their practice, and support the people around them.</p>
          <p>Our team blends STEM, Montessori-inspired practice, the EYFS, and individual care. You do not need to arrive knowing everything. You do need to be curious, dependable, and committed to safeguarding children.</p>
        </div>
      </section>

      <section className="career-benefits">
        <div className="shell">
          <div className="section-heading section-heading--center"><p className="eyebrow">Why work with us</p><h2>A team that wants you to grow</h2></div>
          <div className="career-benefits__grid">
            {benefits.map(({ icon: Icon, title, text }) => <article key={title}><Icon aria-hidden="true" /><h3>{title}</h3><p>{text}</p></article>)}
          </div>
        </div>
      </section>

      <section className="career-apply">
        <div className="shell career-apply__inner">
          <div>
            <p className="eyebrow">Introduce yourself</p>
            <h2>Interested in joining the team?</h2>
            <p>Send your CV and a short note about the role or training opportunity you are looking for. Please do not send DBS documents, identity documents, or sensitive health information by email.</p>
          </div>
          <ButtonLink href={`mailto:${siteConfig.email}?subject=Careers%20at%20Little%20Giants`} variant="light">Email {siteConfig.email}</ButtonLink>
        </div>
      </section>
    </main>
  );
}
