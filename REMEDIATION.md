# Arcan Painting Remediation Roadmap

Last reconciled: 2026-09-01

Branch: `codex/seo-geo-aeo-cro-staging`  
Status: published; post-launch measurement active

This roadmap supersedes unchecked work in `TODO.md`, historical deployment notes in
`BUGS.md`, and completion claims in `FIXES_SUMMARY.md`. Those files remain historical
evidence; an unchecked historical item is not automatically current or approved work.

## Objective

Prepare an evidence-safe, measurable, accessible, fast, search-discoverable Arcan
Painting website and verify it on a reversible staging environment before requesting
production approval.

## Guardrails

- Do not invent reviews, certifications, insurance, years in business, warranties,
  prices, response times, service areas, or customer outcomes.
- Do not publish production changes, alter DNS, or change customer-visible commercial
  terms without explicit approval.
- Keep city/service routes noindexed until the client approves genuine service areas
  and each page has distinct local evidence.
- Treat analytics as optional and consent-aware: the site must work without a vendor ID.
- A task is complete only when implemented and verified against its acceptance check.

## Baseline evidence

- 51 test files and 150 tests pass.
- Type checking passes.
- Lint passes with 320 pre-existing warnings and no errors.
- Three-run production Lighthouse mobile median after ingress compression:
  performance 86, accessibility 100, best practices 100, SEO 100, FCP 2.3 s,
  LCP 3.8 s, TBT 0 ms, CLS 0, and 660 KiB transferred.
- Production technical/content/CRO audit is stored outside this checkout in the Codex
  audit artifact for 2026-08-28.

## Phase 1 — Technical foundation

- [x] Emit one authoritative metadata set per route.
- [x] Give every indexable public page a unique title, description, canonical, robots
      directive, Open Graph set, and primary H1.
- [x] Remove the hidden duplicate H1/SEO block.
- [x] Mark account, admin, thank-you, and internal states `noindex`.
- [x] Remove `/thank-you` from the sitemap and add useful public pages.
- [x] Use stable, truthful sitemap modification dates.
- [x] Expand truthful PaintingContractor/LocalBusiness schema using only visible facts.
- [x] Add service, breadcrumb, and FAQ schema where it matches visible content.
- [x] Repair footer links so they work from every route.
- [x] Repair the favicon request.
- [x] Add explicit crawler policy for AI search while keeping model-training policy
      independently configurable.
- [x] Add automated tests for metadata, sitemap, robots, schema, and route status.

## Phase 2 — Evidence-safe service content and AEO

- [x] Replace the five near-identical service shells with distinct decision pages.
- [x] Explain scope, surfaces, preparation considerations, timing factors, and what
      information helps the team review an inquiry without making unverified promises.
- [x] Add concise answer-first FAQs unique to each service.
- [x] Add useful internal links between services, homepage proof, contact, and privacy.
- [x] Add a proof register that names business facts requiring client approval.
- [x] Keep unverified location pages noindexed and out of the sitemap.

## Phase 3 — CRO and measurement

- [x] Standardize the primary promise to `Discuss your project` / `Request project review`
      until the product returns a real estimate.
- [x] Fix broken and unsupported homepage copy.
- [x] Track CTA, modal-open, step-complete, validation, submit-success, click-to-call,
      click-to-email, and service-context events through a vendor-neutral event layer.
- [x] Load GA4 only when an approved public measurement ID is configured.
- [x] Preserve UTM/referrer/landing-page attribution with lead submissions.
- [x] Do not add project city/postal area and timing fields in this release: the current
      CRM has no dedicated attribution-safe fields and the extra friction is not yet
      supported by funnel evidence. Scope remains available in project description.
- [x] Remove unapproved response-time promises. State a specific response expectation
      only after the client approves an operational SLA.
- [x] Add tests for event payloads, form semantics, validation, and successful handoff.

## Phase 4 — Accessibility and performance

- [x] Meet WCAG AA contrast for CTA and footer text.
- [x] Give carousel controls at least a 24 by 24 CSS pixel target, preferably 44 by 44.
- [x] Align visible labels and accessible names.
- [x] Verify modal focus containment, close behavior, focus return, and errors.
- [x] Remove avoidable duplicate responsive DOM.
- [x] Reduce public JavaScript/CSS and avoid shipping admin-only integrations publicly.
- [x] Optimize or locally host the hero media with responsive variants.
- [x] Repeat Lighthouse and responsive browser QA on staging.

## Phase 5 — Staging and release gate

- [x] Build the production bundle from a clean install.
- [x] Run unit, integration, type, lint, and browser smoke suites.
- [x] Run dependency and secret checks appropriate to the release.
- [x] Publish a reversible staging environment with isolated data and no production
      indexing.
- [x] Verify desktop/mobile public pages, client-side form validation and failure states,
      metadata, schema, redirects, staging headers, analytics debug events, and
      accessibility on the isolated preview.
- [x] Verify isolated database persistence and in-app `new_lead` notifications through
      real contact and quote submissions.
- [x] Verify authenticated admin sign-in, dashboard rendering, and protected lead access
      with a temporary staging-only operator, then remove that operator and its sessions.
- [x] Confirm the current outbound-email and Telegram implementations are explicit
      no-ops rather than credential-blocked transports; record CRM persistence and
      in-app notifications as the current operational handoff.
- [ ] Verify vendor-side analytics receipt after an approved measurement ID is supplied;
      the vendor-neutral events and persisted attribution are already verified.
- [x] Exercise production-ingress security headers, canonical `www` redirect, trusted
      certificates, and compression through the live Traefik ingress.
- [x] Run independent client-deliverable QA and reconcile every roadmap checkbox.
- [x] Document staging URL, revision, evidence, residual blockers, rollback, and the exact
      production approval request.
- [x] Receive owner approval, merge the release, publish an exact-revision production
      container, preserve database and container rollback, and complete post-release QA.

## Phase 6 — Luxury repositioning (draft PR, not deployed)

- [x] Restyle the whole public site (teal, ivory, brass; square buttons; generated textures).
- [x] Add `/luxury-painting-gta` and noindexed luxury market pages, Toronto to Barrie.
- [x] Give generated location routes a real title (they were titled "Page Not Found").
- [x] Record the search-presence review in `docs/SEARCH_PRESENCE_REVIEW.md`.
- [ ] Client approval of luxury claims and service areas (see `PROOF_REGISTER.md`).
- [ ] Google Business Profile and Instagram actions (owner access needed).

## External approvals and evidence still required

- GitHub-hosted CI is not a release dependency for this branch. At the owner's direction,
  the exact application revision was built and verified in an isolated container on the
  Ashbi VPS. Native GitHub jobs still fail before execution because of account billing
  or spending-limit state, so their red status is not application test evidence.
- GA4/Search Console/Google Business Profile/Bing access and identifiers are not present.
- Business proof still requires client approval: service areas, hours, address-display
  policy, insurance/WSIB, warranties, years operating, crew model, paint brands, reviews,
  response time, and approved project case-study facts.
- New accountable business facts remain approval-gated before they can be published;
  the current release avoids the unapproved SLA and keeps unverified location pages out
  of the sitemap.
