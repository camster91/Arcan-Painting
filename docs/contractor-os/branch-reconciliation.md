# Contractor OS reconciliation constraints

Reviewed 2026-10-05. Main: `8472d73dd4b371ff07d1f218c40e6b514e67708a`. OS branch: `d32ff71f5fb98564554849a1b00e525abf97f0fb`. Shared ancestor: `520d3e55daf63cc7e61a6d449b439d23e4136ebd`.

The OS branch changes 198 files since the shared ancestor. Main and OS overlap in 37 paths, including authentication policy, schema, invoice/estimate mutations, notifications, settings, email, root, and admin layout. The 363-file main-versus-OS snapshot difference is not an implementation backlog and must not be applied as a wholesale replacement.

| Foundation | Integration constraint | Next verification |
| --- | --- | --- |
| Database | Preserve main's PostgreSQL/MySQL selection and dialect compiler. OS job-margin report uses LATERAL, aggregate FILTER and interval expressions; these are not handled by the current compiler. Financial reporting also uses date/cast expressions requiring review. | Portable queries and equivalent totals on both supported engines before exposing Reports. |
| Permissions | OS has a reusable grant model and compatibility aliases admin→office and painter→crew. Main has newer company-wide API gates. Do not replace those gates without equivalent method/resource coverage. | Server role matrix including owner, office, estimator, project manager, crew, finance-readonly, customer and anonymous; assigned-job scoping. |
| Lead timeline | OS timeline checks for a signed-in user, but does not apply an explicit permission check before returning combined company records, including financial details. | Authorization and visibility rules for each event type before bringing the endpoint onto main. |
| Lifecycle and expenses | Reuse OS schema and route foundations after comparing main's newer validation, invoice totals and security changes. | Migration prerequisites, transaction behavior, status gates and failure recovery. |
| Public redesign | Editorial and luxury work is already represented by open PRs #132/#136. | Resolve #138 deliberately; preserve newer public security and attribution fixes. |

Suggested implementation order after the UX slice: permission/schema reconciliation, safe timeline events, expense queries and report totals, then lifecycle/crew/portal/closeout and offline acceptance. This records code-review findings; it does not verify deployed topology, production data, or a release artifact. Issues #91/#144 remain open. No deployment is authorized by this document.
