"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Camera, Clock3, Mail, MapPin, Phone } from "lucide-react";
import { CookieSettingsButton } from "@/components/cookie-consent";
import { addressLines, locationForPath, locations } from "@/content/locations";
import { defaultLocation, footerLinksFor, siteConfig } from "@/lib/site";

export function SiteFooter() {
  const pathname = usePathname();
  const active = locationForPath(pathname ?? "/");
  // Group-level pages list every setting; a setting's own pages lead with it.
  const shown = active ? [active] : locations;
  const primary = active ?? defaultLocation;
  const footerLinks = footerLinksFor(primary);

  return (
    <footer className="site-footer">
      <div className="site-footer__curve" aria-hidden="true" />
      <div className="shell footer-grid">
        <div className="footer-brand">
          <Link href="/" aria-label="Little Giants Nursery home">
            <Image src="/images/brand/little-giants-logo.png" alt="" width={512} height={512} />
          </Link>
          <p>
            A warm, ambitious STEM and Montessori nursery for families in{" "}
            {shown.map((location) => location.shortName).join(" and ")}.
          </p>
          <a className="footer-social" href={siteConfig.instagram} rel="noreferrer" target="_blank">
            <Camera aria-hidden="true" size={20} /> Follow us on Instagram
          </a>
        </div>

        <div>
          <h2>{shown.length === 1 ? "Come and see us" : "Our nurseries"}</h2>
          <div className="footer-locations">
            {shown.map((location) => (
              <div className="footer-location" key={location.slug}>
                {shown.length > 1 ? <h3>{location.shortName}</h3> : null}
                <address className="footer-contact">
                  {/*
                    Each row is a flex container, so the icon and the text must be
                    its only two children. Loose text nodes become separate flex
                    items and break the alignment.
                  */}
                  <span><MapPin aria-hidden="true" /><span>{addressLines(location).join(", ")}</span></span>
                  <span><Clock3 aria-hidden="true" /><span>{location.hours}</span></span>
                  {location.phoneHref ? (
                    <a href={`tel:${location.phoneHref}`}><Phone aria-hidden="true" /><span>{location.phoneDisplay}</span></a>
                  ) : null}
                  <a href={`mailto:${location.email}`}><Mail aria-hidden="true" /><span>{location.email}</span></a>
                </address>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2>Explore</h2>
          <nav className="footer-links" aria-label="Footer navigation">
            {footerLinks.map((item) => <Link href={item.href} key={item.href} prefetch={false}>{item.label}</Link>)}
            {primary.ofsted ? (
              <a href={primary.ofsted.provider} rel="noreferrer" target="_blank">Ofsted provider page</a>
            ) : null}
            <CookieSettingsButton />
          </nav>
        </div>
      </div>

      <div className="shell footer-legal">
        <p>© {new Date().getFullYear()} {siteConfig.name}</p>
        <p>Owned and operated under licence by Goldstar Express Ltd. Company No. {siteConfig.companyNumber}.</p>
      </div>
    </footer>
  );
}
