"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const storageKey = "little-giants-cookie-consent-v2";

export type ConsentChoice = "granted" | "denied";

function notifyConsent(choice: ConsentChoice) {
  window.dispatchEvent(new CustomEvent<ConsentChoice>("little-giants-consent", { detail: choice }));
}

export function CookieConsent() {
  const dialogRef = useRef<HTMLElement>(null);
  const focusOnOpenRef = useRef(false);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const existing = window.localStorage.getItem(storageKey) as ConsentChoice | null;
    const frame = window.requestAnimationFrame(() => {
      if (existing) notifyConsent(existing);
      else setVisible(true);
    });

    const open = () => {
      returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      focusOnOpenRef.current = true;
      setVisible(true);
    };
    window.addEventListener("little-giants-open-cookie-settings", open);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("little-giants-open-cookie-settings", open);
    };
  }, []);

  useEffect(() => {
    if (!visible || !focusOnOpenRef.current) return;
    focusOnOpenRef.current = false;
    const frame = window.requestAnimationFrame(() => dialogRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [visible]);

  function close() {
    setVisible(false);
    const returnFocus = returnFocusRef.current;
    returnFocusRef.current = null;
    if (returnFocus) window.requestAnimationFrame(() => returnFocus.focus());
  }

  function choose(choice: ConsentChoice) {
    const wasGranted = window.localStorage.getItem(storageKey) === "granted";
    window.localStorage.setItem(storageKey, choice);
    notifyConsent(choice);
    close();
    if (wasGranted && choice === "denied") window.location.reload();
  }

  if (!visible) return null;

  return (
    <section
      aria-label="Cookie preferences"
      className="cookie-banner"
      onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        close();
      }}
      ref={dialogRef}
      role="dialog"
      tabIndex={-1}
    >
      <div>
        <strong>A quick word about cookies</strong>
        <p>
          We use optional Google Analytics and Microsoft Advertising cookies to understand site use and measure which adverts lead to enquiries. You can accept or decline them. Read our{" "}
          <Link href="/cookies">cookie policy</Link>.
        </p>
      </div>
      <div className="cookie-banner__actions">
        <button className="cookie-button cookie-button--secondary" onClick={() => choose("denied")} type="button">
          Decline
        </button>
        <button className="cookie-button" onClick={() => choose("granted")} type="button">
          Accept optional cookies
        </button>
      </div>
    </section>
  );
}

export function CookieSettingsButton() {
  return (
    <button
      className="footer-text-button"
      onClick={() => window.dispatchEvent(new Event("little-giants-open-cookie-settings"))}
      type="button"
    >
      Cookie settings
    </button>
  );
}
