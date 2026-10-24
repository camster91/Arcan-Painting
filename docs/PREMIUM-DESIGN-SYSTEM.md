# Arcan premium design system

## Design direction

Build on the client-approved minimal homepage prototype. Deep navy, warm ivory and restrained brass support Arcan's existing identity. Darken the overall treatment through deliberate dark sections and stronger contrast while leaving project photography and typography room to breathe.

The audience is homeowners, designers and project teams planning substantial residential renovations, complete interiors and commercial work. Painting remains a core service. The public service language is **Premium Painting**, **High-end Wallpaper** and **Luxury Finishes**. Avoid budget positioning, invented quality statistics and language that implies the owner personally performs the work.

The existing logo remains the source of truth. A separate request explores replacing its tagline; do not treat an unselected logo concept as approved artwork.

## Foundations

Use scoped CSS custom properties inside the premium marketing shell. Keep the admin CRM and existing unrelated routes isolated from these styles.

| Role | Implemented value | Usage |
| --- | --- | --- |
| Ink / primary navy | `#152b38` | Headings, navigation, primary controls |
| Deep surface | `#152b38` | Dark hero or feature sections |
| Raised dark surface | `#203946` | Subtle panel separation |
| Warm paper | `#f2efe7` | Reading surfaces, light text on dark |
| Brass accent | `#c4ab76` | Small accents on dark surfaces; verify contrast before text use |
| Muted on light | `#53616a` | Supporting copy |
| Muted on dark | `#d5d9d4` | Supporting copy on dark surfaces |
| Border | Context-specific | Quiet dividers, input outlines and card boundaries |

These are design roles, not permission to create a new colour for every section. Validate actual colour pairings for WCAG AA text contrast.

- Display typography: restrained editorial serif, with occasional italics rather than whole paragraphs.
- Body and controls: clear sans serif. Body copy should normally be 15–17px; useful metadata should remain at least 11–12px.
- Content width: one shared desktop container and consistent gutters.
- Spacing scale: use a small reusable scale, with larger section spacing on desktop and reduced spacing on mobile.
- Buttons and links: square or subtly rounded, clearly focusable, with a minimum 44px interaction target.
- Motion: short, one-time opacity/position transitions. Honour reduced-motion preferences. Do not hide content when JavaScript or animation loading fails.

## Component contracts

| Component | Responsibility |
| --- | --- |
| `PremiumShell` | Scoped theme, skip link, responsive navigation, footer, contact and social destinations |
| `ButtonLink` | Shared primary, secondary and text-link variants; consistent focus and hover states |
| `SectionHeading` | Eyebrow, meaningful heading and optional supporting copy |
| `ProjectGrid` | Real project photos, concise captions and links to prepared project pages |
| `PremiumInquiry` | Accessible enquiry flow using the existing contact API; pending/error/success states and privacy-safe redirects |
| `ServicePage` | Reusable service detail template driven by `src/data/premiumSite.js` |

Keep presentation and content separate. Use semantic headings, reusable variants and data-driven repeated sections rather than copying complete homepage markup into each new route.

## Page preparation

Existing service URLs should remain stable:

- `/interior-painting` — Premium Painting
- `/wallpaper-services` — High-end Wallpaper
- `/specialty-finishes` — Luxury Finishes
- `/commercial-painting` — Commercial Interiors
- `/exterior-painting` — Exterior Painting

Prepare selected-work pages using the two documented project records. Do not invent client names, locations, dates, budgets, project results or material brands. A design-system route may demonstrate foundations and component states; keep internal demonstration pages out of search indexing and public navigation.

A useful expanded homepage sequence is hero, positioning, service overview, selected work, wallpaper feature, approach, review destination and enquiry. Give each section a specific purpose; avoid repeated slogans or multiple identical photographs used only to fill space.

## Asset and evidence rules

`premiumSite.js` references two real Arcan assets copied from the approved prototype:

- `/hero/PXL_20251018_142500065-1400.webp`: completed dining room with patterned walls, pink seating and a set table.
- `/hero/IMG-20260212-WA0016-1400.webp`: residential staircase with dark treads, white risers and painted railings.

These are portrait photographs. Compose and crop them deliberately, with mobile and desktop framing checked independently. Do not label wallcovering imagery as Venetian plaster.

The Luxury Finishes and Exterior Painting records intentionally have `image: null`. Their page templates must render a graceful text-first layout, not a broken image or invented work photograph. Venetian plaster remains proposed service positioning pending scope confirmation and authentic imagery.

Social destinations are sourced from existing `Footer.jsx` and `publicSeo.js`; the Google Maps review destination is sourced from `GoogleReviewsSection.jsx`. Repository presence establishes continuity, not a fresh external verification. Validate destinations before production release. Use accessible labels and `rel="noopener noreferrer"` for links opening a new tab.

Link to Google reviews without publishing a rating, review count or copied testimonial until the underlying evidence is verified. Do not reuse the legacy component's relative review dates or unverified review claims.

## Acceptance and release checks

- Check representative 320px, 390px, 768px, 1024px, 1440px and wide desktop layouts for overflow, image crops and readable copy.
- Test keyboard navigation, menu open/close, visible focus, project links, enquiry validation and failure states.
- Preserve the existing API contract, attribution and privacy controls. Do not send real test enquiries.
- Keep personal details out of URLs and logs. Maintain a useful contact fallback if JavaScript fails.
- Verify page titles, canonical URLs, heading structure and indexability for prepared pages.
- Run repository build and test gates, plus relevant type and lint checks.
- Maintain the existing disabled GitHub deployment policy. A review branch or draft PR is not a production release.
- Release only through the reviewed hosting process, with the previous artifact available for rollback.

This document specifies the design system and review expectations; it does not certify that all implementation or production checks have passed.
