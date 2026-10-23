# Current plan index

[GitHub #91](https://github.com/camster91/Arcan-Painting/issues/91) is the single program index. Update issue acceptance and evidence in place; this document maps ownership without maintaining a second task list.

| Workstream | Owner issue and implementation children |
| --- | --- |
| Core revenue correctness and authenticated lifecycle | #114; financial defects recorded there; #99 owns final release |
| Product conventions and role-appropriate navigation | #144 |
| Daily owner view | #145 owns presentation, ranking and next-action links |
| Costing | #146 parent; #158 storage, #159 receipts/mobile, #160 rates, #161 intervals, #162 audited corrections, #163 job totals, #164 reports/export; draft PR #157 supplies exact CAD inputs |
| Activity | #147 parent; #165 lifecycle event capture; #166 shared context views |
| Reminder behaviour | #148 owns persisted rules, snooze/retry and automation; render attention through #145 |
| Customer and field journeys | #115 portal, #116 crew, #117 closeout, #118 offline recovery |
| External decisions | #119 email/SMS; #120 marketing, attribution, reputation and accounting; remain waiting for named owner decisions |
| Quality and release | #121 readiness, #103 topology, #122 owner pilot, #99 exact-artifact release |
| Public website | #140 launch acceptance; #138 reconcile main, #139 remaining mobile links, #141 privacy/attribution; #142 service/SEO scope, #143 approved remarketing under #120 |
| Optional maintenance | #16 current code-quality scope; historical tooling claims superseded |

## Source and branch boundaries

Keep `main`, `codex/arcan-contractor-os`, and every open PR branch. The OS branch contains unmerged foundations but is behind current database/security changes; use [the reconciliation constraints](contractor-os/branch-reconciliation.md), not a blanket merge or feature rewrite. PRs #132 and #136 are a stack awaiting a public design decision; preserve both until that decision is recorded.

Earlier OS roadmap, decision and metric documents remain on the preserved OS branch. They inform design but do not override the current GitHub tracker. The 53 unchecked entries in archived TODO.md are historical candidates, not 53 additional obligations.

Completed implementation is distinct from database verification, rendered staging acceptance, deployment and owner/client acceptance. This cleanup authorizes no production action.
