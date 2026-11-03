export type LocationSlug = "uxbridge" | "woodley";

export type PostalAddress = {
  line1: string;
  line2?: string;
  locality: string;
  /** Royal Mail post town, where it differs from the locality. */
  postTown?: string;
  region: string;
  /** Absent until the setting's postcode is confirmed. Never guess one. */
  postalCode?: string;
  country: string;
};

export type TrustPoint = {
  icon: "shield" | "utensils" | "leaf" | "pin";
  strong: string;
  text: string;
};

/** Everything the setting's own landing page renders. */
export type LocationHomeContent = {
  headingLead: string;
  headingHighlight: string;
  intro: string;
  /** Short factual highlights beside the hero. */
  highlights: string[];
  trust: TrustPoint[];
  story: {
    eyebrow: string;
    heading: string;
    lead: string;
    body: string;
    image: string;
    imageAlt: string;
    imageLabel?: string;
  };
  place: {
    eyebrow: string;
    heading: string;
    lead: string;
    cardImage: string;
    cardImageAlt: string;
  };
  gallery: { src: string; alt: string }[];
  /** Parent quotes only belong on a setting that has actually had families. */
  showTestimonials: boolean;
};

export type NurseryLocation = {
  slug: LocationSlug;
  /** Full legal-ish setting name, used in titles and schema. */
  name: string;
  /** How the setting is referred to in running copy. */
  shortName: string;
  /** How the setting appears in the "Our nurseries" menu. */
  navLabel: string;
  status: "open" | "opening-soon";
  /** Absent while the opening date is still unconfirmed. */
  openingDate?: string;
  /** Null while the setting has no phone line yet; every tel link hides. */
  phoneDisplay: string | null;
  phoneHref: string | null;
  email: string;
  enquiryUrl: string;
  address: PostalAddress;
  /** Absent until the postcode is confirmed; derive, do not estimate. */
  geo?: { latitude: number; longitude: number };
  hours: string;
  openingHours: { dayOfWeek: string[]; opens: string; closes: string }[];
  areaServed: string[];
  mapQuery: string;
  ofsted?: { provider: string; report: string; rating: string; inspected: string };
  foundingDate?: string;
  team: { name: string; role: string; image: string; alt: string }[];
  travel: { icon: "bus" | "train" | "car"; title: string; text: string }[];
  heroImage: string;
  heroAlt: string;
  images: string[];
  home: LocationHomeContent;
};

export const locations: NurseryLocation[] = [
  {
    slug: "uxbridge",
    name: "Little Giants Nursery, Brunel",
    shortName: "Uxbridge",
    navLabel: "Uxbridge",
    status: "open",
    phoneDisplay: "01895 603 097",
    phoneHref: "+441895603097",
    email: "info@littlegiantsnursery.org",
    enquiryUrl:
      "https://littlegiantsnursery.eylog.co.uk/eyMan/index.php/enquiries/registerEnquiry?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJicmFuY2hfaWQiOiIxIiwiY29tcGFueV9pZCI6IjEifQ.eqAS2ucMEQbC-BiC2TsqYPNX8d_Xktp6QKwJxc0ts0A",
    address: {
      line1: "The Old School House",
      line2: "1 Hillingdon Road",
      locality: "Uxbridge",
      region: "Greater London",
      postalCode: "UB10 0AA",
      country: "GB",
    },
    geo: { latitude: 51.536646, longitude: -0.47103 },
    hours: "Monday to Friday, 7:30am to 6:00pm",
    openingHours: [
      { dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "07:30", closes: "18:00" },
    ],
    areaServed: ["Uxbridge", "Cowley", "Hillingdon", "Ickenham", "West Drayton"],
    mapQuery: "Little Giants Nursery Uxbridge",
    ofsted: {
      provider: "https://reports.ofsted.gov.uk/provider/16/2722578",
      report: "https://files.ofsted.gov.uk/v1/file/50251968",
      rating: "Good",
      inspected: "June 2024",
    },
    foundingDate: "2023",
    team: [
      {
        name: "Vanessa Robinson",
        role: "Nursery Manager",
        image: "/images/source/parent-information-01-capture-photoroom.jpg",
        alt: "Vanessa Robinson, Nursery Manager",
      },
      {
        name: "Julia Gierlasinska",
        role: "Deputy Manager",
        image: "/images/source/parent-information-02-julia.jpg",
        alt: "Julia Gierlasinska, Deputy Manager",
      },
    ],
    travel: [
      {
        icon: "bus",
        title: "By bus",
        text: "A bus stop sits immediately outside the site, with routes serving the surrounding Uxbridge area.",
      },
      {
        icon: "train",
        title: "By Underground",
        text: "Uxbridge station, on the Metropolitan and Piccadilly lines, is around one mile away.",
      },
      {
        icon: "car",
        title: "By car",
        text: "Off-street parking is available at the rear, accessed from Turnpike Lane. Ask for current arrival instructions.",
      },
    ],
    heroImage: "/images/source/about-us-15-old-school-house.jpg",
    heroAlt: "The Old School House, home of Little Giants Nursery in Uxbridge",
    images: [
      "/images/source/about-us-12-img-9437.jpg",
      "/images/source/about-us-15-old-school-house.jpg",
    ],
    home: {
      headingLead: "A STEM and Montessori nursery in",
      headingHighlight: "Uxbridge",
      intro:
        "A warm, ambitious place where babies, toddlers, and preschoolers grow in confidence through care, curiosity, and hands-on discovery.",
      highlights: [
        "Open 51 weeks",
        "7:30am to 6:00pm",
        "Off-street parking",
        "Air conditioned, CCTV-monitored rooms",
        "STEM and Montessori curriculum",
      ],
      trust: [
        { icon: "shield", strong: "Ofsted Good", text: "in every inspection area" },
        { icon: "utensils", strong: "Fresh meals", text: "prepared on site" },
        { icon: "leaf", strong: "Two gardens", text: "including a baby garden" },
        { icon: "pin", strong: "Near Brunel", text: "& Hillingdon Hospital" },
      ],
      story: {
        eyebrow: "A different kind of day nursery",
        heading: "Care that feels personal. Learning that feels alive.",
        lead:
          "Children thrive when they feel safe enough to be bold. Our team builds secure relationships first, then fills each day with meaningful choices, imaginative play, practical independence, and questions worth investigating.",
        body:
          "Inspired by Isambard Kingdom Brunel, our name is a reminder that small people can have giant ideas. Our motto is en avant: keep moving forward.",
        image: "/images/source/about-us-15-old-school-house.jpg",
        imageAlt: "The Old School House, home to Little Giants Nursery in Uxbridge",
        imageLabel: "The Old School House",
      },
      place: {
        eyebrow: "In the heart of Uxbridge",
        heading: "Easy to reach. Lovely to arrive at.",
        lead:
          "Find us at the Old School House on Hillingdon Road, near Brunel University London and Hillingdon Hospital, with a bus stop outside and off-street parking to the rear.",
        cardImage: "/images/source/about-us-15-old-school-house.jpg",
        cardImageAlt: "The Old School House nursery building in Uxbridge",
      },
      gallery: [
        { src: "/images/source/about-us-01-img-9334.jpg", alt: "A bright nursery playroom with natural wood furniture" },
        { src: "/images/source/about-us-06-img-9431.jpg", alt: "A calm nursery room with a play tent and open shelves" },
        { src: "/images/source/about-us-10-img-9163.jpg", alt: "A Dear Zoo story and animal learning invitation" },
        { src: "/images/source/about-us-13-img-9438.jpg", alt: "The preschool room with books and activity tables" },
        { src: "/images/source/about-us-14-img-9421.jpg", alt: "A detailed sensory small-world investigation" },
        { src: "/images/source/about-us-11-img-9436.jpg", alt: "A spacious classroom with child-height resources" },
      ],
      showTestimonials: true,
    },
  },
  {
    slug: "woodley",
    name: "Little Giants Nursery, Woodley",
    shortName: "Woodley",
    navLabel: "Woodley, Reading (opening soon)",
    status: "opening-soon",
    // TODO(woodley): the setting has no phone line yet. Set both fields together
    // when the number exists; every tel link and the schema telephone follow.
    phoneDisplay: null,
    phoneHref: null,
    email: "info.woodley@littlegiantsnursery.org",
    // TODO(woodley): this is the Uxbridge EyLog branch. The token encodes
    // branch_id 1, so Woodley needs its own branch URL before launch.
    enquiryUrl:
      "https://littlegiantsnursery.eylog.co.uk/eyMan/index.php/enquiries/registerEnquiry?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJicmFuY2hfaWQiOiIxIiwiY29tcGFueV9pZCI6IjEifQ.eqAS2ucMEQbC-BiC2TsqYPNX8d_Xktp6QKwJxc0ts0A",
    address: {
      line1: "Unit 4, Astra House",
      line2: "86-88 Headley Road",
      locality: "Woodley",
      postTown: "Reading",
      region: "Berkshire",
      // TODO(woodley): postcode not supplied. Leaving it out keeps a wrong
      // postcode out of the schema, the sitemap copy, and the Business Profile.
      country: "GB",
    },
    // TODO(woodley): derive from the postcode once confirmed, do not estimate.
    hours: "Monday to Friday, 7:30am to 6:00pm",
    openingHours: [
      { dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "07:30", closes: "18:00" },
    ],
    areaServed: [
      "Woodley",
      "Earley",
      "Lower Earley",
      "Twyford",
      "Charvil",
      "Sonning",
      "Winnersh",
      "Hurst",
      "Reading",
      "Wokingham",
    ],
    mapQuery: "Astra House Headley Road Woodley Reading",
    team: [],
    travel: [
      {
        icon: "car",
        title: "By car",
        text: "Headley Road sits in the middle of Woodley, a short drive from the A4 and the A3290, so the nursery works as a stop on the way towards Reading or Thames Valley Park.",
      },
      {
        icon: "train",
        title: "By train",
        text: "Twyford and Reading stations are both a short drive away, which suits families commuting into London on the Elizabeth line or Great Western services.",
      },
      {
        icon: "bus",
        title: "By bus",
        text: "Woodley town centre is served by frequent local buses towards Reading, Earley, and Winnersh.",
      },
    ],
    heroImage: "/images/woodley/montessori-playroom.jpg",
    heroAlt: "Woodley nursery playroom with natural wooden furniture, open shelves, and cosy play spaces",
    images: ["/images/woodley/montessori-playroom.jpg", "/images/woodley/covered-outdoor-play-area.jpg"],
    home: {
      headingLead: "A new nursery opening soon in",
      headingHighlight: "Woodley",
      intro:
        "A new nursery is taking shape at Astra House on Headley Road, bringing a STEM and Montessori approach to families in Woodley, Earley, Twyford, and Reading.",
      highlights: [
        "Babies, toddlers, and preschool",
        "STEM and Montessori curriculum",
        "Headley Road, Woodley",
        "Close to the A4 and A3290",
        "Registering interest now",
      ],
      trust: [
        { icon: "shield", strong: "Key person", text: "named for every child before day one" },
        { icon: "utensils", strong: "Meals included", text: "in the fee, not charged as extras" },
        { icon: "leaf", strong: "Outdoors daily", text: "in all but unsafe weather" },
        { icon: "pin", strong: "Woodley", text: "on the route towards Reading" },
      ],
      story: {
        eyebrow: "Opening soon in Woodley",
        heading: "A brand new nursery, built around Woodley families.",
        lead:
          "Little Giants Woodley is being fitted out from scratch at Astra House, with separate rooms for babies, toddlers, and preschool, natural materials, and resources set at child height.",
        body:
          "Being part of the first intake means real influence over how the rooms run. We would rather shape routines around the children who are actually here than impose a fixed timetable on them.",
        image: "/images/woodley/covered-outdoor-play-area.jpg",
        imageAlt: "Covered outdoor play area at Woodley with a wooden slide, mud kitchen, and planting beds",
        imageLabel: "Headley Road",
      },
      place: {
        eyebrow: "In the middle of Woodley",
        heading: "On the way to work, not a detour from it",
        lead:
          "Parents pick a nursery on the drop-off route as much as on the postcode. Headley Road works for families heading towards Thames Valley Park, Winnersh Triangle, or the A4 and A3290 into Reading, with Twyford and Reading stations both a short drive away.",
        cardImage: "/images/source/home-page-08-unsplash-image-m0yrv0gxkv8.jpg",
        cardImageAlt: "A young child exploring the world through a toy telescope",
      },
      gallery: [],
      showTestimonials: false,
    },
  },
];

const locationMap = new Map(locations.map((location) => [location.slug, location]));

export function getLocation(slug: string): NurseryLocation | undefined {
  return locationMap.get(slug as LocationSlug);
}

export function locationPath(location: NurseryLocation, ...segments: string[]) {
  return ["/nurseries", location.slug, ...segments].join("/");
}

/** The location a pathname belongs to, or undefined for group-level pages. */
export function locationForPath(pathname: string): NurseryLocation | undefined {
  const match = /^\/nurseries\/([^/]+)/.exec(pathname);
  return match ? getLocation(match[1]) : undefined;
}

export function addressLines(location: NurseryLocation) {
  const { line1, line2, locality, postTown, region, postalCode } = location.address;
  return [line1, line2, locality, postTown, region === "Greater London" ? undefined : region, postalCode]
    .filter((part): part is string => Boolean(part));
}

export function addressText(location: NurseryLocation) {
  return addressLines(location).join(", ");
}

/** A short "Uxbridge, UB10 0AA" style label for the header utility bar. */
export function addressSummary(location: NurseryLocation) {
  const { locality, postalCode } = location.address;
  return postalCode ? `${locality}, ${postalCode}` : locality;
}

export function mapUrl(location: NurseryLocation) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.mapQuery)}`;
}
