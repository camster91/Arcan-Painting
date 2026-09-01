# Arcan Painting Product Decisions

Last updated: 2026-09-01

| ID | Decision | Reason | Revisit when |
| --- | --- | --- | --- |
| D-001 | `CONTRACTOR-OS-ROADMAP.md` is the authority for admin-product work | Prevents historical `TODO.md` and website-only remediation items from competing with the active plan | The product program closes or is deliberately superseded |
| D-002 | Complete connected vertical journeys before adding more isolated dashboards or AI features | Contractor value depends on dependable handoffs and source-of-truth records | Core revenue and delivery journeys meet staging acceptance |
| D-003 | Keep AI off the critical path | Current AI providers are unconfigured/disabled and operations must remain deterministic | A provider, budget, privacy policy, evaluation set, fallback, and monitoring are approved |
| D-004 | Build provider-neutral communications and accounting seams before choosing paid vendors | Implementation can progress without inventing credentials, costs, or owner preferences | Owner approves a vendor and operating policy |
| D-005 | Use Ashbi VPS staging and validation; do not treat GitHub CI state as release evidence | Owner explicitly selected the VPS release path | Owner changes release policy |
| D-006 | Require explicit approval immediately before production release and real outbound communication | Those actions affect customers and external systems | Never; this is a standing safety/release gate |
| D-007 | Public claims remain governed by `PROOF_REGISTER.md` | Product work must not publish unsupported business facts | Owner supplies and approves current evidence |
