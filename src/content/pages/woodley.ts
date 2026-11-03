import type { MarketingContent } from "../page-types";

/**
 * Copy for the Woodley setting, which is opening soon. Nothing here may claim
 * an inspection outcome, a staff team, or a start date the nursery does not yet
 * have. Photography is deliberately generic, and placeholder room photos carry a
 * "Coming soon" badge, so no image implies a room that has not been fitted out.
 * These pages never mention or link to the other nursery.
 */
export const woodleyPages: MarketingContent[] = [
  {
    slug: ["nurseries", "woodley", "rooms", "babies"],
    title: "Baby Nursery in Woodley, Reading | Little Giants",
    description:
      "Settled, unhurried baby care coming soon to Headley Road in Woodley. Key-person relationships, your baby's own routine, and daily updates for Reading families.",
    eyebrow: "Babies",
    heading: "Baby care in Woodley, built around your routine",
    intro:
      "Our Woodley baby room is being prepared for babies from a few months old, with small group sizes, a named key person, and a day that follows your baby's sleep and feeding rhythm rather than a timetable.",
    heroImage: "/images/woodley/baby-room-wide.jpg",
    heroAlt: "An illustrative baby room with a soft play mat, wooden toys, low shelves, and cots in a quiet corner",
    heroBadge: "Coming soon",
    facts: [
      { value: "Opening soon", label: "Woodley, Reading" },
      { value: "1:3", label: "Statutory ratio under two" },
      { value: "51 weeks", label: "Planned yearly opening" },
    ],
    sections: [
      {
        eyebrow: "Settling in",
        heading: "One familiar adult who knows your baby well",
        paragraphs: [
          "Every baby is assigned a key person before their first full day. That educator learns the small signals that matter, the tired cue, the hungry cue, the particular way your baby likes to be held, and becomes the person who greets you at the door each morning.",
          "Because Woodley is a new setting, families joining at the start will help shape the room's routines. We would far rather build around the babies actually in the room than follow a fixed timetable.",
        ],
        bullets: [
          "A named key person from the first settling session",
          "Your baby's home sleep and feeding pattern followed, not overwritten",
          "Daily written and photo updates through our parent app",
          "Nappies, milk, and weaning food discussed individually before the start date",
        ],
      },
      {
        eyebrow: "The room",
        heading: "Space to roll, pull up, and reach for things",
        paragraphs: [
          "Babies learn with their whole bodies. The Woodley baby room is being set up with floor-level play, low mirrors, natural materials, and treasure baskets that reward curiosity rather than switch it off with lights and sounds.",
          "Sensory play, singing, board books, and time outdoors run through every day. The aim is not to accelerate babies through milestones but to give each one the confidence to try the next thing when they are ready.",
        ],
        image: "/images/woodley/baby-room-sensory.jpg",
        imageAlt: "An illustrative treasure basket of natural objects beside wooden stacking rings and a fabric book",
        imageBadge: "Coming soon",
      },
      {
        eyebrow: "For working parents",
        heading: "A drop-off that works on the way to Reading",
        paragraphs: [
          "Headley Road sits in the middle of Woodley, which makes the nursery a practical stop for parents heading towards Thames Valley Park, Winnersh Triangle, or Reading and Twyford stations.",
          "Returning to work after parental leave is a big transition for parents as well as babies. We plan settling sessions around your return date and keep in close contact during the first weeks.",
        ],
      },
    ],
    faqs: [
      {
        question: "What age can babies start at the Woodley nursery?",
        answer:
          "We plan to take babies from a few months old. Because the setting is opening soon, exact start ages and available days are agreed individually, so tell us the date you need and we will confirm what we can offer.",
      },
      {
        question: "Can you follow my baby's existing sleep and feeding routine?",
        answer:
          "Yes. We record your baby's routine before the first day and follow it, adjusting only in conversation with you as your baby changes.",
      },
      {
        question: "How will I know what my baby has done today?",
        answer:
          "You receive written and photo updates through our parent app during the day, plus a conversation at pickup with someone who was actually with your baby.",
      },
      {
        question: "Is the Woodley nursery open yet?",
        answer:
          "Not yet. It is opening soon on Headley Road in Woodley. Register your interest now and we will contact you with opening dates, fees, and visit times as soon as they are confirmed.",
      },
    ],
    related: [
      { label: "Toddlers in Woodley", href: "/nurseries/woodley/rooms/toddlers", text: "What changes as your baby becomes a toddler." },
      { label: "Fees and funded hours", href: "/nurseries/woodley/fees-funding", text: "How funding works for babies and younger children." },
      { label: "Register your interest", href: "/nurseries/woodley/contact", text: "Be first to hear about places and opening dates." },
    ],
  },
  {
    slug: ["nurseries", "woodley", "rooms", "toddlers"],
    title: "Toddler Nursery in Woodley, Reading | Little Giants",
    description:
      "A language-rich toddler room opening soon in Woodley. Independence, outdoor play, and gentle routines for toddlers across Earley, Twyford, and Reading.",
    eyebrow: "Toddlers",
    heading: "Toddlers who want to do it themselves",
    intro:
      "Toddlerhood is the age of strong opinions and sudden leaps in language. Our Woodley toddler room is being designed so that determination has somewhere useful to go.",
    heroImage: "/images/source/home-page-08-unsplash-image-m0yrv0gxkv8.jpg",
    heroAlt: "A young child exploring the world through a toy telescope",
    facts: [
      { value: "Opening soon", label: "Woodley, Reading" },
      { value: "1:4", label: "Statutory ratio for two-year-olds" },
      { value: "Daily", label: "Outdoor play in all weathers" },
    ],
    sections: [
      {
        eyebrow: "Independence",
        heading: "Real jobs, not pretend ones",
        paragraphs: [
          "Montessori-inspired practice runs through the toddler day. Child-height shelves, jugs toddlers can actually pour from, hooks they can reach, and coats they are given time to attempt themselves.",
          "This is slower in the moment and much faster over a year. A toddler who is allowed to struggle briefly with a zip becomes a three-year-old who does not need an adult for it at all.",
        ],
        bullets: [
          "Self-serve snack and water within reach",
          "Toileting supported at the child's pace, never on a deadline",
          "Tidy-up built into the rhythm of the day",
          "Choice offered within a predictable structure",
        ],
      },
      {
        eyebrow: "Language",
        heading: "Talking, naming, singing, repeating",
        paragraphs: [
          "The gap between children's vocabularies widens fast between two and three, and it is largely driven by how much adults talk with them. Educators narrate, name, ask genuine questions, and leave room for an answer.",
          "Stories and songs repeat deliberately. Repetition is how toddlers move a word from something they recognise to something they use.",
        ],
        image: "/images/source/home-page-04-unsplash-image-eqltydzrx7u.jpg",
        imageAlt: "A parent and young child sharing a picture book together",
      },
      {
        eyebrow: "Big feelings",
        heading: "Calm adults when things fall apart",
        paragraphs: [
          "Toddlers have more intention than regulation, so frustration is normal and expected. Our approach is to name the feeling, stay nearby, and help the child come back down rather than to remove them from the room.",
          "We tell you honestly about difficult days as well as good ones, and agree consistent responses between home and nursery so your toddler meets the same expectations in both places.",
        ],
      },
    ],
    faqs: [
      {
        question: "Do you help with potty training?",
        answer:
          "Yes, and we follow your lead on timing. We agree an approach with you, keep it consistent through the day, and never make a child feel they have failed at it.",
      },
      {
        question: "How much time do toddlers spend outside?",
        answer:
          "Outdoor play happens every day in all but genuinely unsafe weather. Please send wellies and a waterproof coat.",
      },
      {
        question: "What if my toddler still naps?",
        answer:
          "Nap needs vary enormously at this age. We follow your child's pattern and adjust with you rather than moving everyone onto the same schedule.",
      },
      {
        question: "Which areas will the Woodley nursery serve?",
        answer:
          "The setting is on Headley Road in Woodley and is well placed for families in Woodley, Earley, Charvil, Sonning, Twyford, Winnersh, and central Reading.",
      },
    ],
    related: [
      { label: "Preschool in Woodley", href: "/nurseries/woodley/rooms/preschool", text: "How toddlers move on towards school readiness." },
      { label: "Settling in", href: "/nurseries/woodley/starting-nursery", text: "What the first few weeks actually look like." },
      { label: "Register your interest", href: "/nurseries/woodley/contact", text: "Ask about days, sessions, and opening dates." },
    ],
  },
  {
    slug: ["nurseries", "woodley", "rooms", "preschool"],
    title: "Preschool in Woodley, Reading | Little Giants Nursery",
    description:
      "Preschool and school readiness coming soon to Woodley. Early phonics, number sense, and the independence children need for Reception, near Earley and Twyford.",
    eyebrow: "Preschool",
    heading: "Ready for school, and ready to enjoy it",
    intro:
      "Our Woodley preschool room is for the year or two before Reception, where confidence, concentration, and curiosity matter far more than worksheets.",
    heroImage: "/images/source/home-page-07-unsplash-image-93s6atwrwm0.jpg",
    heroAlt: "A preschool child reading a picture book independently",
    facts: [
      { value: "Opening soon", label: "Woodley, Reading" },
      { value: "EYFS", label: "Curriculum framework" },
      { value: "3 to 5", label: "Preschool age range" },
    ],
    sections: [
      {
        eyebrow: "School readiness",
        heading: "What Reception teachers actually ask for",
        paragraphs: [
          "Teachers in Woodley and Reading primary schools consistently name the same things: children who can listen in a group, manage their own coat and lunch, ask for help, and recover from a setback.",
          "Those are the skills our preschool year is built around. Early reading and number grow naturally alongside them rather than replacing them.",
        ],
        bullets: [
          "Listening and attention in a larger group",
          "Dressing, toileting, and managing belongings independently",
          "Sustained concentration on a chosen activity",
          "Asking an adult for help, in words",
        ],
      },
      {
        eyebrow: "Early literacy and number",
        heading: "Phonics and counting that make sense",
        paragraphs: [
          "Children meet letter sounds through rhyme, story, and play, and practise the fine motor control that writing later depends on: threading, cutting, tweezers, drawing at an easel.",
          "Number sense grows out of real problems. Sharing snack fairly, measuring for a construction, counting how many are missing at registration. Children who understand what a number means are far better placed than children who can only recite the sequence.",
        ],
        image: "/images/source/parent-information-05-unsplash-image-ayh7wwvotc0.jpg",
        imageAlt: "A toddler moving coloured beads along a wooden abacus",
      },
      {
        eyebrow: "Moving on",
        heading: "The handover to your child's primary school",
        paragraphs: [
          "In the final term we prepare a summary of your child's learning and, with your permission, share it with their Reception teacher so the school starts already knowing something about them.",
          "We also practise the mundane parts of school life: lining up, eating lunch in a bigger hall, using a cloakroom peg. Familiarity takes a lot of the fear out of September.",
        ],
      },
    ],
    faqs: [
      {
        question: "Do you teach phonics before school?",
        answer:
          "We introduce letter sounds playfully through rhyme, story, and games. We do not run formal phonics lessons, which is deliberate: Reception teaches a specific scheme and pre-empting it can confuse children.",
      },
      {
        question: "Will you work with our chosen primary school?",
        answer:
          "Yes. With your permission we share a learning summary with your child's Reception teacher and welcome contact from local schools in Woodley, Earley, and Reading.",
      },
      {
        question: "Can we use funded hours for preschool?",
        answer:
          "Funded hours for eligible three and four-year-olds will be available at Woodley. Our fees page explains how funded hours combine with paid sessions.",
      },
      {
        question: "When does the Woodley preschool room open?",
        answer:
          "The Woodley nursery is opening soon on Headley Road. Register your interest and we will confirm opening dates and available preschool places directly with you.",
      },
    ],
    related: [
      { label: "Starting nursery", href: "/nurseries/woodley/starting-nursery", text: "How settling in works before your child's first full day." },
      { label: "Fees and funded hours", href: "/nurseries/woodley/fees-funding", text: "How 15 and 30 funded hours work in practice." },
      { label: "Register your interest", href: "/nurseries/woodley/contact", text: "Ask about preschool places for your child's start date." },
    ],
  },
  {
    slug: ["nurseries", "woodley", "fees-funding"],
    title: "Nursery Fees and Funded Childcare in Woodley | Little Giants",
    description:
      "How nursery fees, 15 and 30 funded hours, Tax-Free Childcare, and Wokingham funded childcare will work at our Woodley setting near Reading.",
    eyebrow: "Fees and funding",
    heading: "Nursery fees and funded childcare in Woodley",
    intro:
      "Childcare is one of the largest costs a family carries, and comparing nurseries is hard when everyone presents their fees differently. Here is how ours will work at Woodley.",
    heroImage: "/images/source/home-page-06-unsplash-image-axc2uwl4cik.jpg",
    heroAlt: "A child moving the hands of a large teaching clock",
    facts: [
      { value: "Opening soon", label: "Woodley, Reading" },
      { value: "15 & 30", label: "Funded hours supported" },
      { value: "Wokingham", label: "Funding authority" },
    ],
    sections: [
      {
        eyebrow: "What a fee includes",
        heading: "One rate, not a list of extras",
        paragraphs: [
          "Our fees include meals, snacks, nappies, wipes, sun cream, and the activities that run through the day. We do not price these separately, because a fee you cannot predict is not much use when you are budgeting.",
          "Woodley fees will be confirmed before the setting opens. Register your interest and we will send them to you directly as soon as they are set, along with the session patterns available.",
        ],
        bullets: [
          "Meals and snacks included",
          "Nappies, wipes, and sun cream included",
          "Activities and outings included",
          "No separate charge for the settling-in sessions",
        ],
      },
      {
        eyebrow: "Funded hours",
        heading: "15 and 30 hours, and how they actually apply",
        paragraphs: [
          "Funded hours cover a set number of hours across 38 weeks of the year. Most families stretch that entitlement across more weeks so the funded amount is the same but the weekly figure is lower.",
          "Funding does not cover meals or consumables, and it does not usually cover a full working day on its own. The honest version is that most working families combine funded hours with paid hours, and we will show you exactly what that looks like for the days you need.",
        ],
        bullets: [
          "Check eligibility and application dates on the official GOV.UK service",
          "Woodley sits in Wokingham Borough for funded childcare purposes",
          "Funding is confirmed termly and must be reconfirmed",
          "Tax-Free Childcare can be used alongside funded hours",
        ],
      },
      {
        eyebrow: "Other support",
        heading: "Tax-Free Childcare and employer schemes",
        paragraphs: [
          "Tax-Free Childcare adds £2 from the government for every £8 you pay in, up to £2,000 per child each year. It is paid into an online account and sent to us directly.",
          "Eligibility rules change, so we always point families at the official checkers rather than quoting rules that may have moved. If something looks unclear for your circumstances, ask us and we will work through it with you.",
        ],
      },
    ],
    quote: {
      text: "Use the government's childcare calculator before committing to a session pattern. It is the only way to compare funded hours, Tax-Free Childcare, and Universal Credit support properly.",
      attribution: "Childcare Choices, GOV.UK",
      href: "https://www.gov.uk/childcare-calculator",
    },
    faqs: [
      {
        question: "What will fees be at the Woodley nursery?",
        answer:
          "Woodley fees are being confirmed ahead of opening. Register your interest and we will send the fee schedule and available session patterns to you directly as soon as they are set.",
      },
      {
        question: "Which council handles funded childcare for Woodley?",
        answer:
          "Woodley is in Wokingham Borough, so funded childcare for the setting is administered through Wokingham Borough Council. Eligibility itself is decided nationally through GOV.UK.",
      },
      {
        question: "Can I use Tax-Free Childcare and funded hours together?",
        answer:
          "Yes. Most families use funded hours for part of the week and pay the remainder, often through a Tax-Free Childcare account.",
      },
      {
        question: "Is there a deposit or registration fee?",
        answer:
          "Registration terms for Woodley will be confirmed with the fee schedule before opening. We will always set them out in writing before you commit to a place.",
      },
    ],
    related: [
      { label: "Starting nursery", href: "/nurseries/woodley/starting-nursery", text: "What happens between accepting a place and day one." },
      { label: "Childcare calculator", href: "https://www.gov.uk/childcare-calculator", text: "Compare funded hours and Tax-Free Childcare officially." },
      { label: "Register your interest", href: "/nurseries/woodley/contact", text: "Ask for the Woodley fee schedule as soon as it is ready." },
    ],
  },
  {
    slug: ["nurseries", "woodley", "starting-nursery"],
    title: "Starting Nursery in Woodley, Reading | Little Giants",
    description:
      "Settling in at our Woodley nursery: how visits, key-person matching, and the first weeks work for families in Woodley, Earley, Twyford, and Reading.",
    eyebrow: "Starting nursery",
    heading: "Starting nursery in Woodley, one step at a time",
    intro:
      "Leaving your child somewhere new for the first time is genuinely hard. Settling is a process we plan with you, not a single morning you are expected to get through.",
    heroImage: "/images/source/home-page-03-unsplash-image-iu3mkdoqxdm.jpg",
    heroAlt: "A child closely observing flowers and plants outdoors",
    facts: [
      { value: "Opening soon", label: "Woodley, Reading" },
      { value: "Key person", label: "Named before day one" },
      { value: "Staged", label: "Settling sessions" },
    ],
    sections: [
      {
        eyebrow: "Before the first day",
        heading: "We learn your child before they arrive",
        paragraphs: [
          "Before a start date we sit down with you and record the practical things: sleep, food, allergies, comfort items, the words your child uses for important things, and what helps when they are upset.",
          "Your child's key person is named at this point, so the adult who greets them on the first morning is someone who already knows their name and something about them.",
        ],
        bullets: [
          "A pre-start conversation about routines and needs",
          "A named key person matched before the first session",
          "A staged settling plan agreed with you",
          "Comfort items welcome for as long as they help",
        ],
      },
      {
        eyebrow: "The first weeks",
        heading: "Short sessions that grow at your child's pace",
        paragraphs: [
          "Settling usually begins with a short visit while you stay, then a short session without you, then gradually longer. Some children are settled in days; others take several weeks, and neither is a problem.",
          "We do not pretend a tearful goodbye did not happen. You get an honest message shortly after drop-off telling you how your child actually is, which is usually within a few minutes of you leaving.",
        ],
      },
      {
        eyebrow: "Joining a new setting",
        heading: "What it means to be part of the first intake",
        paragraphs: [
          "Woodley is a brand new nursery, and the first families through the door have more influence than they would at an established setting. Routines, menus, and the rhythm of the day are shaped around the children who are actually there.",
          "It also means we are open about what is still being finalised. If you ask us something we have not confirmed yet, we will tell you that rather than guess.",
        ],
      },
    ],
    faqs: [
      {
        question: "How long does settling usually take?",
        answer:
          "Anywhere from a few days to several weeks. We plan a staged approach with you and adjust as we go rather than holding to a fixed schedule.",
      },
      {
        question: "Can I stay for the first sessions?",
        answer:
          "Yes. Early settling sessions normally include time with you present, and we reduce that gradually as your child's confidence grows.",
      },
      {
        question: "Will you tell me if my child is upset?",
        answer:
          "Always, and quickly. You get a message shortly after drop-off with an honest update, not a reassuring one.",
      },
      {
        question: "Can we visit the Woodley nursery before it opens?",
        answer:
          "Visits will be arranged as the setting is completed. Register your interest and we will contact you as soon as we can show families round.",
      },
    ],
    related: [
      { label: "Babies in Woodley", href: "/nurseries/woodley/rooms/babies", text: "Settling a baby around a return to work." },
      { label: "The nursery environment", href: "/nurseries/woodley/nursery-environment", text: "The spaces your child will be settling into." },
      { label: "Register your interest", href: "/nurseries/woodley/contact", text: "Start the conversation about a start date." },
    ],
  },
  {
    slug: ["nurseries", "woodley", "nursery-environment"],
    title: "Our Woodley Nursery on Headley Road | Little Giants",
    description:
      "Inside our new Woodley nursery at Astra House, Headley Road: the rooms, outdoor space, and the Reading commuter routes that make drop-off workable.",
    eyebrow: "The setting",
    heading: "A new nursery on Headley Road, Woodley",
    intro:
      "Our new nursery is taking shape at Astra House on Headley Road, in the middle of Woodley and within easy reach of Earley, Charvil, Sonning, Twyford, and Reading.",
    heroImage: "/images/source/home-page-12-unsplash-image-p-4lnpp2uvk.jpg",
    heroAlt: "Montessori-style wooden learning materials arranged on open shelves",
    facts: [
      { value: "Headley Road", label: "Woodley, Reading" },
      { value: "Opening soon", label: "Fit-out under way" },
      { value: "A4 / A3290", label: "Commuter routes nearby" },
    ],
    sections: [
      {
        eyebrow: "The rooms",
        heading: "Separate spaces for babies, toddlers, and preschool",
        paragraphs: [
          "The building is being fitted out with distinct rooms for each age stage, so babies get calm and quiet while preschoolers get room for noisier, more physical play.",
          "Every room is built on the same principles: resources at child height, natural materials, clear areas for different kinds of play, and enough space that children can concentrate without being interrupted.",
        ],
        image: "/images/woodley/baby-room-sleep.jpg",
        imageAlt: "An illustrative baby sleep room with wooden cots, a nursing chair, and soft daylight",
        imageBadge: "Coming soon",
        bullets: [
          "Age-separated rooms rather than one shared space",
          "Child-height, open-access storage",
          "Quiet corners for children who need them",
          "Space designed for sustained, uninterrupted play",
        ],
      },
      {
        eyebrow: "Outdoors",
        heading: "Outdoor time every day",
        paragraphs: [
          "Outdoor provision is part of the design, not an add-on. Children need to move, take sensible physical risks, and be outside in weather that is not perfect.",
          "Details of the outdoor space are being confirmed as the fit-out progresses, and we will show families round as soon as it is safe to do so.",
        ],
      },
      {
        eyebrow: "Getting here",
        heading: "Built around the way Woodley parents actually travel",
        paragraphs: [
          "Parents choose a nursery on the drop-off route as much as on the postcode. Headley Road works for families heading towards Thames Valley Park, Winnersh Triangle, or the A4 and A3290 into Reading.",
          "Twyford and Reading stations are both a short drive, which matters for parents commuting into London on the Elizabeth line or Great Western services.",
        ],
      },
    ],
    faqs: [
      {
        question: "Where exactly is the Woodley nursery?",
        answer:
          "Unit 4, Astra House, 86-88 Headley Road, Woodley, Reading. The full postcode and arrival instructions will be confirmed before opening.",
      },
      {
        question: "Is there parking for drop-off?",
        answer:
          "Parking and drop-off arrangements are being confirmed as part of the fit-out. We will publish clear arrival instructions before the first families start.",
      },
      {
        question: "What will the rooms look like?",
        answer:
          "The rooms are still being fitted out, so the photos on this site are illustrative rather than of the building itself. We will replace them with real photos, and invite registered families to look round, as soon as the rooms are finished.",
      },
      {
        question: "Can I look round before it opens?",
        answer:
          "Yes, once the building is safe for visitors. Register your interest and we will invite you as soon as visits begin.",
      },
    ],
    related: [
      { label: "Preschool in Woodley", href: "/nurseries/woodley/rooms/preschool", text: "How the preschool room will work day to day." },
      { label: "Babies in Woodley", href: "/nurseries/woodley/rooms/babies", text: "How the baby room is being set up." },
      { label: "Register your interest", href: "/nurseries/woodley/contact", text: "Ask to be invited to the first visits." },
    ],
  },
];
