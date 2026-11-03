"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Clock3, MapPin, Menu, Phone, X } from "lucide-react";
import { addressSummary, locationForPath } from "@/content/locations";
import { defaultLocation, navigationFor } from "@/lib/site";

export function SiteHeader() {
  const pathname = usePathname();
  // Group-level pages have no setting of their own, so they show the open one.
  const location = locationForPath(pathname ?? "/") ?? defaultLocation;
  const navigation = useMemo(() => navigationFor(location), [location]);
  const contactHref = `/nurseries/${location.slug}/contact`;
  const contactLabel = location.status === "open" ? "Book a tour" : "Register interest";
  const headerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const [headerHidden, setHeaderHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openDesktopGroup, setOpenDesktopGroup] = useState<string | null>(null);

  useEffect(() => {
    document.body.classList.toggle("menu-open", menuOpen);
    return () => document.body.classList.remove("menu-open");
  }, [menuOpen]);

  useEffect(() => {
    const desktopQuery = window.matchMedia("(min-width: 1101px)");
    const closeAtDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) setMenuOpen(false);
    };
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      requestAnimationFrame(() => menuButtonRef.current?.focus());
    };

    desktopQuery.addEventListener("change", closeAtDesktop);
    if (menuOpen) window.addEventListener("keydown", closeWithEscape);
    return () => {
      desktopQuery.removeEventListener("change", closeAtDesktop);
      window.removeEventListener("keydown", closeWithEscape);
    };
  }, [menuOpen]);

  useEffect(() => {
    let lastScrollY = Math.max(window.scrollY, 0);
    let directionTravel = 0;
    let frame: number | null = null;

    const updateHeader = () => {
      const currentScrollY = Math.max(window.scrollY, 0);
      const delta = currentScrollY - lastScrollY;
      const navigationActive = menuOpen || openDesktopGroup !== null;
      const headerHasFocus = headerRef.current?.contains(document.activeElement) ?? false;

      if (navigationActive || headerHasFocus || currentScrollY <= 64) {
        directionTravel = 0;
        setHeaderHidden(false);
      } else if (delta > 0) {
        directionTravel = directionTravel < 0 ? delta : directionTravel + delta;
        if (directionTravel >= 24) {
          directionTravel = 0;
          setHeaderHidden(true);
        }
      } else if (delta < 0) {
        directionTravel = directionTravel > 0 ? delta : directionTravel + delta;
        if (directionTravel <= -8) {
          directionTravel = 0;
          setHeaderHidden(false);
        }
      }

      lastScrollY = currentScrollY;
      frame = null;
    };

    const handleScroll = () => {
      if (frame === null) frame = window.requestAnimationFrame(updateHeader);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (frame !== null) window.cancelAnimationFrame(frame);
    };
  }, [menuOpen, openDesktopGroup]);

  return (
    <header
      className={`site-header${headerHidden ? " site-header--hidden" : ""}${menuOpen ? " site-header--menu-open" : ""}`}
      onFocusCapture={() => setHeaderHidden(false)}
      ref={headerRef}
    >
      <div className="utility-bar">
        <div className="shell utility-bar__inner">
          <span><MapPin aria-hidden="true" size={15} /> {addressSummary(location)}</span>
          <span><Clock3 aria-hidden="true" size={15} /> {location.hours}</span>
          {location.phoneHref ? (
            <a href={`tel:${location.phoneHref}`}><Phone aria-hidden="true" size={15} /> {location.phoneDisplay}</a>
          ) : (
            <a href={`mailto:${location.email}`}><Phone aria-hidden="true" size={15} /> {location.email}</a>
          )}
        </div>
      </div>

      <div className="shell header-main">
        <Link className="brand" href="/" aria-label="Little Giants Nursery home">
          <Image
            src="/images/brand/little-giants-logo.png"
            alt="Little Giants Nursery, Brunel"
            width={512}
            height={512}
            loading="eager"
            sizes="(max-width: 600px) 50px, (max-width: 850px) 60px, (max-width: 1100px) 68px, 72px"
          />
        </Link>

        <nav className="desktop-nav" aria-label="Main navigation">
          {navigation.map((group) => (
            <div
              className={`nav-group ${openDesktopGroup === group.label ? "nav-group--open" : ""}`}
              key={group.label}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpenDesktopGroup(null);
              }}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  setOpenDesktopGroup(null);
                  event.currentTarget.querySelector("button")?.focus();
                }
              }}
            >
              <button
                aria-controls={`desktop-nav-${group.label.toLowerCase().replaceAll(" ", "-")}`}
                aria-expanded={openDesktopGroup === group.label}
                aria-haspopup="true"
                className="nav-group__trigger"
                onClick={() => {
                  setHeaderHidden(false);
                  setOpenDesktopGroup((value) => value === group.label ? null : group.label);
                }}
                type="button"
              >
                {group.label}
                <ChevronDown aria-hidden="true" size={16} />
              </button>
              <div className="nav-dropdown" id={`desktop-nav-${group.label.toLowerCase().replaceAll(" ", "-")}`}>
                {group.items.map((item) => (
                  <Link href={item.href} key={item.href} onClick={() => setOpenDesktopGroup(null)} prefetch={false}>{item.label}</Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="header-actions">
          <Link className="header-contact" href={contactHref}>{contactLabel}</Link>
          <button
            aria-controls="mobile-navigation"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="menu-toggle"
            onClick={() => {
              setHeaderHidden(false);
              setOpenDesktopGroup(null);
              setMenuOpen((value) => !value);
            }}
            ref={menuButtonRef}
            type="button"
          >
            {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div className="mobile-menu mobile-menu--open" id="mobile-navigation">
          <nav className="shell mobile-menu__inner" aria-label="Mobile navigation">
            {navigation.map((group) => (
              <details key={group.label}>
                <summary>{group.label}<ChevronDown aria-hidden="true" size={18} /></summary>
                <div>
                  {group.items.map((item) => (
                    <Link href={item.href} key={item.href} onClick={() => setMenuOpen(false)} prefetch={false}>{item.label}</Link>
                  ))}
                </div>
              </details>
            ))}
            <Link className="mobile-menu__contact" href={contactHref} onClick={() => setMenuOpen(false)}>
              {location.status === "open" ? "Book a nursery tour" : `Register your interest in ${location.shortName}`}
            </Link>
            {location.phoneHref ? (
              <a className="mobile-menu__phone" href={`tel:${location.phoneHref}`} onClick={() => setMenuOpen(false)}>
                Call {location.phoneDisplay}
              </a>
            ) : (
              <a className="mobile-menu__phone" href={`mailto:${location.email}`} onClick={() => setMenuOpen(false)}>
                Email {location.email}
              </a>
            )}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
