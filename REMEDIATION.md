# Arcan Painting Remediation Roadmap

Last reconciled: 2026-08-28  
Branch: `codex/seo-geo-aeo-cro-staging`  
Status: active source of truth

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

- 50 test files and 149 tests pass.
- Type checking passes.
- Lint passes with 319 pre-existing warnings and no errors.
- Production Lighthouse mobile baseline: performance 60, accessibility 93,
  best practices 96, SEO checklist 100.
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
- [ ] State response expectations only after the client approves an operational SLA.
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
- [ ] Verify database persistence, outbound notifications, vendor-side analytics
      receipt, authenticated admin, and production-ingress headers after isolated
      staging credentials and a durable host are supplied.
- [x] Run independent client-deliverable QA and reconcile every roadmap checkbox.
- [x] Document staging URL, revision, evidence, residual blockers, rollback, and the exact
      production approval request.

## External approvals and evidence still required

- GitHub Actions are enabled, but GitHub rejected hosted jobs before execution because
  recent account payments failed or the Actions spending limit must be increased. The
  repository `Preview` environment also requires isolated staging host identifiers and
  credentials before a durable preview workflow can be connected without reusing
  production infrastructure.
- Valid certificate and redirect for `www.arcanpainting.ca` require production ingress
  or DNS authority and are not part of the staging code change.
- GA4/Search Console/Google Business Profile/Bing access and identifiers are not present.
- Business proof still requires client approval: service areas, hours, address-display
  policy, insurance/WSIB, warranties, years operating, crew model, paint brands, reviews,
  response time, and approved project case-study facts.
- Production publication remains approval-gated after staging verification.
