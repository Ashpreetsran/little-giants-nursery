export type ContentSection = {
  id?: string;
  eyebrow?: string;
  heading: string;
  paragraphs: string[];
  bullets?: string[];
  image?: string;
  imageAlt?: string;
  /** Overlaid on a placeholder photo, e.g. "Coming soon". */
  imageBadge?: string;
};

/**
 * A marketing page's own copy. The slug is relative to nothing: it is the
 * complete path under the site root, so a page can be moved by editing one
 * field rather than by hunting through components.
 */
export type MarketingContent = {
  slug: string[];
  title: string;
  description: string;
  eyebrow: string;
  heading: string;
  intro: string;
  heroImage: string;
  heroAlt: string;
  heroPosition?: string;
  /** Overlaid on a placeholder hero photo, e.g. "Coming soon". */
  heroBadge?: string;
  facts: { value: string; label: string }[];
  sections: ContentSection[];
  quote?: {
    text: string;
    attribution: string;
    href?: string;
  };
  faqs: { question: string; answer: string }[];
  related: { label: string; href: string; text: string }[];
};

/** Kept as the historical name so existing imports read the same. */
export type MarketingPage = MarketingContent;
