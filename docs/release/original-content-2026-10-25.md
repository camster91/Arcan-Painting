# Original site reconciliation — 25 October 2026

Compared the retained Node origin at 82.180.129.200 (HTTPS certificate checked for arcanpainting.ca) with the live Cloudflare site, current source and baseline commit `56d307f5a805ad0b5cb8aef9819b49db63677d34`. The original public `/api/gallery?limit=100` returned all 70 records from its static collection. Original HTML, sitemap, gallery metadata and image contact sheets were inspected. No original hosting or database was changed.

## Image evidence

All 70 full-size images and 70 thumbnails exist in the repository. HTTP GET and SHA-256 comparisons verified all 140 files byte-for-byte across the retained origin, repository and live Cloudflare assets. The gap was discovery: the premium UI exposed a small selected-work subset. The `/projects` archive now makes every original file browsable, preserving original asset URLs, with filters, progressive loading, full-size viewing, keyboard navigation and no-JavaScript links.

All 70 originals were visually reviewed. New captions describe visible subjects and do not inherit the legacy AI-generated dates, quality scores, locations or unsupported materials. Work in progress, surface preparation and video stills are distinguished from project photographs; the outdoor gathering is in Archive rather than presented as a completed exterior project. Video files were not available in the original library: the `_video.webp` assets are still images and are labelled as such. Original raster files are unchanged; existing sideways images are corrected with CSS in the viewer. The floral wallpaper feature matches the original PXL_20260213_210915996 image. Real existing exterior and bar derivatives now illustrate their service pages.

## Content disposition

Retained all five service URLs, selected project pages, telephone/email, verified Instagram/Google destinations and current verified Google reviews. Restored six general FAQ topics: timing, weather, colour, furniture/floor protection, materials and estimate requests. Restored preparation/application/final review in the process and about copy. Restored useful original homepage fragments: `#services`, `#portfolio`, `#process`, `#faq`, `#contact`. Updated llms.txt to point to the work, approach and questions.

Did not restore stock imagery, unverified material/service scope, guarantees, pricing, years/customer counts, credentials, dated review claims or unsupported service-area lists. These are not established facts merely because they appeared in legacy components. The old Facebook destination could not be freshly verified and the old LinkedIn destination was unavailable to verification; neither was added as a verified social destination. The current Google review snapshot is newer than the legacy review block and remains intact.

## Verification and boundaries

Inventory test proves exact coverage of every original full-size file and corresponding thumbnail. Local browser checks cover all 70 image links/thumbnail loads, each category, full-size rotated image containment at mobile/landscape/desktop, keyboard/focus, no-JavaScript access, restored FAQ/anchors, and the existing public-site checks at five widths. Final checks and deployment identities are recorded in the release PR comment.

This is a public image/content restoration. It does not activate callback forms or notifications, change the pending inbox verification, replace the original logo, or migrate authenticated CRM data. The separate transparent-logo deliverable remains unmodified in output/brand.
