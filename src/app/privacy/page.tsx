import type { Metadata } from "next";
import Link from "next/link";
import { PageSchema } from "@/components/page-schema";
import { addressText } from "@/content/locations";
import { absoluteAssetUrl, absoluteUrl, defaultLocation, siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Notice | Little Giants Nursery",
  description: "How Little Giants Nursery uses and protects personal information submitted through this website.",
  alternates: { canonical: "/privacy" },
  openGraph: {
    type: "website",
    locale: "en_GB",
    siteName: siteConfig.name,
    title: "Privacy Notice | Little Giants Nursery",
    description: "How Little Giants Nursery uses and protects information submitted through this website.",
    url: absoluteUrl("/privacy"),
    images: [{ url: absoluteAssetUrl("/og/privacy.jpg"), width: 1200, height: 630, alt: "Little Giants Nursery website privacy notice" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Notice | Little Giants Nursery",
    description: "How Little Giants Nursery uses and protects website information.",
    images: [absoluteAssetUrl("/og/privacy.jpg")],
  },
};

export default function PrivacyPage() {
  return (
    <main className="legal-page">
      <PageSchema slug={["privacy"]} />
      <header className="legal-hero"><div className="shell"><p className="eyebrow">Your information</p><h1>Website privacy notice</h1><p>Last updated 12 July 2026</p></div></header>
      <article className="shell legal-copy">
        <section><h2>Who is responsible for your information?</h2><p>Little Giants Nursery is owned and operated under licence by Goldstar Express Ltd, company number {siteConfig.companyNumber}. For questions about this notice, email <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a> or write to {addressText(defaultLocation)}.</p></section>
        <section><h2>Information we collect through this website</h2><p>When you submit a nursery enquiry, we collect the contact details and childcare information you choose to provide, such as your name, email, phone number, your child’s general stage, preferred start, attendance needs, and message.</p><p>Please do not include detailed medical information, identity documents, funding codes, or other sensitive records in the website form. We can arrange a more appropriate way to discuss individual needs.</p></section>
        <section><h2>Why we use it</h2><p>We use enquiry information to respond, discuss availability and services, arrange a tour, and take steps you request before a possible childcare agreement. We may also retain a limited record to manage follow-up, protect the service from misuse, and meet legal obligations.</p></section>
        <section><h2>Who helps us process it</h2><p>The website hosting provider processes requests needed to operate the site. The site no longer hosts its own enquiry form: enquiries are submitted through the nursery&rsquo;s EyLog enquiry form, or sent directly by email or phone, and are processed under those providers&rsquo; own security and data-protection commitments. We do not sell website enquiry data.</p></section>
        <section><h2>How long we keep it</h2><p>Website enquiries are kept only for as long as reasonably needed to respond, manage a potential place, resolve a concern, or meet a legal requirement. If an enquiry becomes a nursery application or contract, the fuller nursery privacy information and retention requirements will apply.</p></section>
        <section><h2>Analytics and cookies</h2><p>Google Tag Manager is loaded only after you accept optional cookies in the website banner. Google Analytics measures site use, and Microsoft Advertising measures which adverts lead to enquiries and contact link clicks. Conversion events do not include the personal or childcare information entered in enquiry forms. You can decline and still use the site. See our <Link href="/cookies">cookie policy</Link> or reopen Cookie settings in the footer.</p></section>
        <section><h2>Your rights</h2><p>Depending on the circumstances, you may have rights to access, correct, erase, restrict, or object to the use of your personal information. Contact us first so we can help. You may also raise a concern with the UK Information Commissioner’s Office.</p></section>
        <section><h2>Children’s information</h2><p>This website is intended for parents, carers, and job applicants. Children should not submit forms themselves. Detailed child records are handled through the nursery’s secure operational processes, not this public contact form.</p></section>
      </article>
    </main>
  );
}
