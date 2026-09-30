# Search presence review — 2026-09-29

Scope: arcanpainting.ca, the Google Business Profile and Instagram, and the luxury
painting market from Toronto north to Barrie.

## What could and could not be checked

| Source | Result |
| --- | --- |
| Ahrefs (site explorer, rank tracker, GSC) | "Insufficient plan" for every ranking endpoint. No keyword or traffic data was available. |
| Google results / Business Profile | Automated fetches are blocked. Rankings below come from the owner's own check, not a tool. |
| Instagram (`@arcanpaint`) | Blocked (HTTP 429). Not reviewed. |
| Live site | Fetched. |

Owner-reported (chat with Gerardo, 2026-09-29): the Google Business Profile ranks 3rd in
the local pack in his area. Another business, "Luxurious Professional Painting", ranks 2nd
for "luxury painting". Gerardo's own view: the site does not read as luxury and does not
contain the words "luxury painting".

## Findings

1. **Location URLs were indexed with a bad title.** Google has `arcanpainting.ca/commercial-painting/vaughan`
   in its index, and the live page's `<title>` is "Page Not Found | Arcan Painting" even
   though the content renders. Cause: `getPublicSeo()` only knew the five service roots.
   Fixed in this branch (real title, still noindex, covered by a test).
2. **No page targets "luxury painting".** Added `/luxury-painting-gta` plus market pages
   (`/luxury-painting/<market>`). The market pages are noindexed and out of the sitemap
   until each service area is approved (`approved` flag in `src/data/markets.js`).
3. **Competitors that own the luxury/decorative-finish searches in Toronto:** Chromatist
   (decorative plaster, Forest Hill / Rosedale / Bridle Path), Sigma Painting (Venetian
   plaster and limewash pages), Paint Club, Artelime, Venetian Plaster Toronto. In Barrie:
   705 Painters (luxury residential), Fitch Painting, CertaPro (Richmond Hill & Vaughan).
   Most run one dedicated page per finish. Arcan needs the same: a Venetian plaster page
   and a limewash page are the next content wins.
4. **The family/founder story in Google's snippet** (founder from Argentina, "ARCAN" =
   Argentina + Canada) is not on the current site and is not in the proof register. It
   was not used. It would make strong brand copy if Gerardo confirms and approves it.

## Actions that need Gerardo (cannot be done from code)

- Google Business Profile: confirm the primary category and add secondary ones (for
  example painter, wallpaper installer), add service areas, add real project photos, and
  ask happy clients for reviews. Post the new luxury work.
- Instagram: post real project photos with location and finish in the caption; link the
  profile to `/luxury-painting-gta`.
- Give read access to Search Console and the Business Profile so rankings can be tracked.
- Approve the facts in `PROOF_REGISTER.md` (Venetian plaster/limewash offered, service areas).

## Next content (recommended order)

1. Venetian plaster page and limewash page (one page per finish, real photos).
2. Approve and switch on the Toronto, Vaughan, Richmond Hill and Markham market pages.
3. Extend to Aurora, Newmarket, Bradford and Barrie once approved.
4. Real before/after project photos on each market page.
