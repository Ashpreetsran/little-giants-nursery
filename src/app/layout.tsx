import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { CookieConsent } from "@/components/cookie-consent";
import { GoogleTagManager } from "@/components/google-tag-manager";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { siteConfig } from "@/lib/site";
import "./globals.css";

const amatic = localFont({
  src: "./fonts/amatic-bold.woff2",
  display: "swap",
  preload: true,
  variable: "--font-display",
});

const josefin = localFont({
  src: "./fonts/josefin-sans-regular.woff2",
  display: "swap",
  variable: "--font-body",
});

const isReviewDeployment = process.env.NEXT_PUBLIC_PREVIEW_DEPLOYMENT === "true";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "Little Giants Nursery",
    template: "%s",
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.name }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  formatDetection: { telephone: false, email: false, address: false },
  category: "childcare",
  robots: isReviewDeployment
    ? { index: false, follow: false, nocache: true }
    : {
        index: true,
        follow: true,
        googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
      },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#89dbe6",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB">
      <body className={`${amatic.variable} ${josefin.variable}`}>
        <a className="skip-link" href="#main-content">Skip to main content</a>
        <GoogleTagManager />
        <SiteHeader />
        <div id="main-content" tabIndex={-1}>{children}</div>
        <SiteFooter />
        <CookieConsent />
      </body>
    </html>
  );
}
