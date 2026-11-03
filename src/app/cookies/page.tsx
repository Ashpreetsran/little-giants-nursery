import type { Metadata } from "next";
import { PageSchema } from "@/components/page-schema";
import { absoluteAssetUrl, absoluteUrl, siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Cookie Policy | Little Giants Nursery",
  description: "How Little Giants Nursery uses essential storage and optional analytics cookies on this website.",
  alternates: { canonical: "/cookies" },
  openGraph: {
    type: "website",
    locale: "en_GB",
    siteName: siteConfig.name,
    title: "Cookie Policy | Little Giants Nursery",
    description: "How Little Giants Nursery uses essential storage and optional analytics cookies.",
    url: absoluteUrl("/cookies"),
    images: [{ url: absoluteAssetUrl("/og/cookies.jpg"), width: 1200, height: 630, alt: "Little Giants Nursery cookie policy" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cookie Policy | Little Giants Nursery",
    description: "How Little Giants Nursery uses essential storage and optional analytics cookies.",
    images: [absoluteAssetUrl("/og/cookies.jpg")],
  },
};

export default function CookiesPage() {
  return (
    <main className="legal-page">
      <PageSchema slug={["cookies"]} />
      <header className="legal-hero"><div className="shell"><p className="eyebrow">Your choices</p><h1>Cookie policy</h1><p>Last updated 16 September 2026</p></div></header>
      <article className="shell legal-copy">
        <section><h2>What are cookies?</h2><p>Cookies and similar browser storage help a website remember information. Some are required for a requested feature. Others help an organisation understand how a site is used.</p></section>
        <section><h2>Our consent preference</h2><p>We store your optional cookie choice in your browser under the key <code>little-giants-cookie-consent-v2</code>. This keeps the banner from appearing on every page. The value is not used to identify you. We ask again when the purposes covered by your choice change.</p></section>
        <section><h2>Optional analytics and advertising measurement</h2><p>If you accept optional cookies, the site loads Google Tag Manager container {siteConfig.gtmId}. Google Analytics helps us understand site use. Microsoft Advertising Universal Event Tracking helps us measure which adverts lead to successful website enquiries and clicks on enquiry, telephone, and email links. These services may use cookies and process page visits, click identifiers, general device details, and approximate location.</p><p>Our conversion events do not include the names, email addresses, phone numbers, messages, or childcare details entered in enquiry forms. An enquiry link click does not mean an enquiry has been completed on EyLog.</p><p>If you decline, the website does not load the Tag Manager container through normal JavaScript use. You can still use the website and contact the nursery. See <a href="https://policies.google.com/privacy">Google’s privacy policy</a> and <a href="https://privacy.microsoft.com/privacystatement">Microsoft’s privacy statement</a> for how these providers process information.</p></section>
        <section><h2>Changing your choice</h2><p>Use Cookie settings in the footer to reopen the choice banner. Withdrawing consent reloads the page so optional tracking stops. You can also clear this site’s cookies in your browser to remove existing identifiers.</p></section>
        <section><h2>Third-party links</h2><p>The site links to services such as Ofsted, Google Maps, Instagram, EyLog, and official childcare-support tools. Those sites have their own cookie and privacy practices when you choose to open them.</p></section>
      </article>
    </main>
  );
}
