# Woodley nursery keyword and SERP research

Research date: 21 September 2026
Setting: Unit 4, Astra House, 86-88 Headley Road, Woodley, Reading (opening soon)

## Method

Search volumes are Google Ads figures pulled through the DataForSEO API on 21 September 2026,
twelve-month averages with the monthly series retained. The SERP snapshot is a mobile Google
result for `nursery woodley` from a Reading location. Nothing here is estimated: a keyword with
no figure means Google returned no volume for it, and that is recorded as such rather than guessed.

## Volumes

United Kingdom scope:

| Keyword | Volume | Competition | CPC |
|---|---:|---|---:|
| nursery reading / nurseries in reading | 720 | Medium (51) | £4.26 |
| **nursery woodley / nurseries in woodley** | **110** | **Low (27)** | £5.85 |
| childcare reading | 50 | Medium (60) | £2.02 |
| day nursery reading | 30 | High (69) | £0.53 |
| day nursery woodley, childcare woodley, preschool woodley | no data | - | - |

Reading location scope:

| Keyword | Volume | Competition | CPC |
|---|---:|---|---:|
| nursery near me / nurseries near me | 390 | Medium (57) | £3.41 |
| 30 hours free childcare | 40 | Low (2) | - |
| nursery caversham | 20 | High (68) | £2.01 |
| preschool near me | 20 | High (81) | - |
| nursery twyford | 10 | Low (14) | - |
| nursery winnersh | 10 | - | - |
| nursery wokingham | 10 | High (77) | £11.41 |
| montessori nursery reading | 10 | - | - |
| baby nursery near me | no data | - | - |

Three things follow from this.

**`nursery woodley` is the winnable term.** 110 searches a month at competition index 27 is unusually
soft for childcare, and a dedicated `/nurseries/woodley` page with a real address on Headley Road
should compete for it. It is the single best reason to give Woodley its own page set rather than a
paragraph on the Uxbridge site.

**`nursery near me` is where the volume actually is.** 390 a month in the Reading area, far more than
any town-name term. That is won by the Google Business Profile and proximity, not by page copy.

**Adjacent towns are almost empty.** Twyford, Winnersh, Wokingham and Montessori Reading are 10 a
month each. The ad groups targeting them are kept because they cost nothing when they do not
trigger, but no page should be built for them and no copy should be bent around them. The client's
commuter-corridor instinct is right, but it is a targeting and Business Profile play, not a
content play.

## Who ranks for `nursery woodley`

The result is dominated by a three-result local pack before any organic listing:

| | Setting | Rating |
|---|---|---|
| 1 | Busy Bees, Loddon Vale Centre, Hurricane Way | 4.9 from 12 |
| 2 | Woodley Gardens Day Nursery, 71 Reading Road | 4.1 from 10 |
| 3 | Little Ducklings Day Nursery, Campbell Road | 5.0 from 3 |

Organic results below it:

1. Woodley Gardens Day Nursery - "Woodley Gardens Day Nursery Child Care in Woodley near Reading"
2. Little Bloom Nursery - title is just the brand name, and the meta description is a misconfigured
   LiteSpeed server string, so the listing is effectively unoptimised
3. Busy Bees - "Nursery in Woodley | Childcare in Reading", a location page on a national chain domain
4. Locrating - "The Best 116 Nurseries In Woodley"
5. daynurseries.co.uk - "Find Childcare in Woodley | 969 reviews"
6. Woodley Pre-School
7. A Facebook post in "Real Woodley & Reading Gossip and Chat" asking for nursery recommendations

`People also search for` includes "New nursery woodley" and "Little bloom nursery woodley closed".

## What that means for launch

**The Business Profile decides this, not the website.** The top three results are a local pack, and
the incumbents hold it with 3 to 12 reviews each. That is a low bar. Creating the Woodley Google
Business Profile and getting the first ten genuine reviews is worth more than any further page
work, and it is the one thing only the client can do.

**Directories rank on page one.** Locrating, daynurseries.co.uk, Yell and Cylex all appear.
Listings on those, plus Bing Places, should go out with the Business Profile.

**The competition is beatable organically.** The incumbent at position two has a broken meta
description, and the page-one chain result is a template location page. A page with a real
address, real room detail, honest fees information and a working FAQ block should out-rank both
once it has some age.

**"New nursery" is already a query people type.** Leading the title with "Opening Soon" is a
differentiator rather than a wasted phrase, and matches what people are searching for.

**There is a community angle.** A Facebook post in a local group ranks on page one of Google for
this term. The client posting in Woodley parent groups will do more early on than another page.

## Page architecture

| Route | Primary intent | H1 |
|---|---|---|
| `/nurseries/woodley` | nursery woodley, nursery reading | A new nursery opening soon in Woodley |
| `/nurseries/woodley/rooms/babies` | baby nursery, baby nursery near me | Baby care in Woodley, built around your routine |
| `/nurseries/woodley/rooms/toddlers` | toddler nursery | Toddlers who want to do it themselves |
| `/nurseries/woodley/rooms/preschool` | preschool, preschool near me | Ready for school, and ready to enjoy it |
| `/nurseries/woodley/fees-funding` | nursery fees, 30 hours free childcare | Nursery fees and funded childcare in Woodley |
| `/nurseries/woodley/starting-nursery` | settling into nursery | Starting nursery in Woodley, one step at a time |
| `/nurseries/woodley/nursery-environment` | the setting, parking, getting there | A new nursery on Headley Road, Woodley |
| `/nurseries/woodley/contact` | register interest | Register your interest in our Woodley nursery |

Curriculum, Ofsted, food and SEND are not duplicated for Woodley. They are group-level material and
the Woodley pages link to the Uxbridge versions, which keeps two near-identical pages out of the
index. `npm run verify:live-crawl` enforces globally unique titles and descriptions, so a
copy-paste of the Uxbridge copy would fail the build rather than quietly cannibalise.

## Local entities

Woodley, Headley Road, Astra House, Reading, Wokingham Borough, Earley, Lower Earley, Twyford,
Charvil, Sonning, Winnersh, Caversham, RG5, Thames Valley Park, Winnersh Triangle, the A4, the
A3290, Twyford station, Reading station.

## Still outstanding

- **Postcode.** Not supplied. Until it is, `postalCode` and `geo` are deliberately absent from the
  Woodley `ChildCare` schema, because a wrong postcode would be worse than none for the Business
  Profile match.
- **Phone number.** Not created yet. Every `tel:` link and the schema `telephone` are suppressed
  rather than falling back to the Uxbridge number.
- **EyLog branch.** The Woodley enquiry link currently points at the Uxbridge branch token.
- **Photography.** The Woodley pages use generic early years imagery, not interiors of a building
  that is still being fitted out. Replace once the rooms exist.
