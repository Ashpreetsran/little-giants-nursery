"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { clsx } from "clsx";

type ButtonLinkProps = {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "light" | "text";
  className?: string;
  external?: boolean;
};

const eyLogEnquiryHostname = "littlegiantsnursery.eylog.co.uk";

function pushEnquiryLinkClick(href: string) {
  const w = window as typeof window & { dataLayer?: unknown[] };
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({ event: "eylog_enquiry_click", enquiry_url: href });
}

export function ButtonLink({
  href,
  children,
  variant = "primary",
  className,
  external = href.startsWith("http"),
}: ButtonLinkProps) {
  const classes = clsx("button-link", `button-link--${variant}`, className);
  const newWindow = href.startsWith("http");
  const isEyLogEnquiry = href.includes(eyLogEnquiryHostname);
  const content = (
    <>
      <span>{children}</span>
      <ArrowUpRight aria-hidden="true" size={18} strokeWidth={2.4} />
    </>
  );

  if (external) {
    return (
      <a
        className={classes}
        href={href}
        onClick={isEyLogEnquiry ? () => pushEnquiryLinkClick(href) : undefined}
        rel={newWindow ? "noreferrer" : undefined}
        target={newWindow ? "_blank" : undefined}
      >
        {content}
      </a>
    );
  }

  return (
    <Link className={classes} href={href}>
      {content}
    </Link>
  );
}
