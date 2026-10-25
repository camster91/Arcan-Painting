# Responsive design audit — 25 October 2026

The live contact-only public site was visually reviewed in Chrome across all 15 exported routes at 390, 768 and 1440 pixels: homepage; five service pages; project collection; both project details; about; contact; quote; privacy; thank-you; internal design system. Full-page captures and geometry/image observations are retained locally at `/tmp/arcan-design-audit-2026-10-25`. An independent design reviewer inspected the captures. No persistent horizontal overflow, broken image or major image-crop defect was found. Initial unstyled captures were replaced after styles settled.

Material refinements implemented:

- Remove the repeated contact heading and supporting paragraph on all seven conversion pages; retain one introduction and direct contact actions. Preserve fallback details beside the enabled legacy Node form.
- Extend the marketing shell to the viewport height so short pages do not expose white space below the footer.
- In disabled-form mode, replace the thank-you page's unearned submission acknowledgement with neutral contact guidance. Keep existing acknowledgement behavior when forms are enabled.
- Give footer navigation and direct contact links a 44-pixel minimum target height, retaining left alignment on mobile.

Validation: 302 unit tests passed, three opt-in database tests skipped; typecheck passed; ESLint has zero errors and 237 existing warnings. Local Workers browser checks passed all eight checks, with the opt-in enquiry test skipped. Checks cover all 15 routes at 320, 390, 768, 1024 and 1440 pixels, no forms/overflow/console errors, loaded images, minimum shell height, 44-pixel footer targets, menu keyboard behavior, contact actions, neutral thank-you copy, indexing and unknown routes. Independent source review found no material regression.

The review covers the public redesign. Authenticated CRM, crew, invoice and estimate screens belong to the retained Node application and were not visually acceptance-tested in this audit. Email notifications and public forms remain deliberately disabled. Production deployment identity, staging checks and final visual evidence belong in the release PR's deployment comment; this document alone does not establish a live deployment.
