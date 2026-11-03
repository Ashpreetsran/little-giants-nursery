"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { siteConfig } from "@/lib/site";
import type { ConsentChoice } from "@/components/cookie-consent";

const storageKey = "little-giants-cookie-consent-v2";

export function GoogleTagManager() {
  const [consent, setConsent] = useState<ConsentChoice | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setConsent(window.localStorage.getItem(storageKey) as ConsentChoice | null);
    });
    const update = (event: Event) => setConsent((event as CustomEvent<ConsentChoice>).detail);
    window.addEventListener("little-giants-consent", update);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("little-giants-consent", update);
    };
  }, []);

  if (consent !== "granted") return null;

  return (
    <>
      <Script id="little-giants-gtm" strategy="afterInteractive">
        {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${siteConfig.gtmId}');`}
      </Script>
      <iframe
        aria-hidden="true"
        className="gtm-frame"
        height="0"
        src={`https://www.googletagmanager.com/ns.html?id=${siteConfig.gtmId}`}
        tabIndex={-1}
        title="Google Tag Manager"
        width="0"
      />
    </>
  );
}
