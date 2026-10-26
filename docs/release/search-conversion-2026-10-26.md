# SEO, GEO, AEO, marketing and CRO review — 26 October 2026

Five independent specialists reviewed the source and live public site. Findings were reconciled against actual HTML, current Cloudflare responses, the approved brand direction and the known lead-delivery gate. Their heuristic readiness scores are not ranking, AI citation or conversion measurements and are not used as acceptance evidence.

## Implemented

- SEO: removed unsupported Toronto/region coordinate tags. `/quote` remains compatible with HTTP 200, canonicalizes to `/contact`, and is excluded from the sitemap. Metadata descriptions now describe verified work and project conversations. Business schema uses the current transparent logo and verified Google listing; no ratings, address, service-area or unconfirmed materials are added.
- GEO: approved service labels now match in `llms.txt`. Legacy SEO helpers no longer contain unsupported services, a unverified Twitter handle or Toronto assertions. Current SSR pages, sitemap and public crawl access remain available.
- AEO: concise service overviews identify the service and explain what the team reviews, with scope/materials confirmed for the project. No arbitrary word-count expansion, invented credentials or unsupported plaster/limewash claim was added.
- Marketing: aligned the approved core names, clarified Luxury Finishes without inventing material capability, and aligned Commercial Painting labels with its actual URL/title.
- CRO: added a direct homepage hero enquiry path, visible Commercial/Exterior links beneath the three core service cards, a project CTA before the large image, and Email/Call before the optional map on contact pages.
- Measurement: ButtonLink and event handling share a finite public CTA allowlist, including nested icon clicks and known anchors. Contact events carry phone/email categories, without contact values or query strings. Unknown/private/query-bearing destinations and arbitrary labels are excluded.
- Technical performance: font preconnects and year-long immutable caching apply to successful content-hashed JS/CSS/font files. HTML, stable assets and errors retain revalidation behavior. A deployed-browser check now verifies every exported page's bundle references and content types.

## Reconciled findings and limits

The production asset mismatch was observed during an overlapping logo release. A fresh post-release probe found all 24 current modulepreloads HTTP 200 on both production and staging, and the production browser suite passed. The new bundle-integrity test guards subsequent releases; a historical snapshot alone does not establish a persistent current defect.

GPTBot's training opt-out remains unchanged. OAI-SearchBot inherits the public rules, including private-path exclusions. Training opt-out is separate from search access; there is no need to grant training access for this release. Adding a separate blanket bot group could accidentally bypass inherited private-path exclusions and was avoided.

Missing homepage FAQ JSON-LD is not treated as a commercial-site search-appearance defect or a promise of AI citations. Existing accurate service FAQ schema remains. `llms.txt` is a discovery aid, not evidence of indexing or citation. No RSL/IndexNow publication, HSTS account change, fabricated local pages or paid tooling was introduced.

Search engines may retain old snippets until they recrawl; this review does not prove current Search Console ownership, indexed coverage, ranking, AI mentions or conversion uplift. Those require account/field data and observation after release.

Public callback/text-back activation is separately blocked on Cloudflare's unverified info@arcanpainting.ca destination. Contact-only mode, private intake and disabled schedules remain in place. Storage, provider acceptance and inbox delivery must be verified independently before enabling the form. No lead submission or client communication was sent during this review.

Validation and final revision/deployment identities are recorded in the release PR, rather than inferred from this document.
