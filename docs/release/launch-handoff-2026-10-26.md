# Launch handoff and retained lead source — 26 October 2026

The public redesign is already live on Cloudflare. This pass reconciles remaining source/privacy and operational handoff work; it does not claim that the retained Hostinger Node application or its database has been migrated or redeployed.

## Source fixes

The open privacy PR #173 identified legacy `ContactSection` and `LeadFormPopup` thank-you URLs that still included contact data. The active premium Worker journey was already clean. Necessary fixes are now carried into current main without reviving an old homepage or merging the historical workflow/thank-you implementation: plain `/thank-you`, embedded attribution, strict durable-save acknowledgements and generic client errors. Real component tests exercise both successful submissions and false-save responses.

The retained Node contact handler now rejects missing persistence IDs before CAPI/email/Telegram side effects, normalizes attribution at the server boundary with the shared privacy rules, and excludes parser/database/provider exception details from responses and logs. These Node-source changes require a separately verified retained-host release before they can be described as live on that origin. Publishing a static Workers export does not deploy a Node API.

## Operational reconciliation

The runbook no longer says the public domain remains on Hostinger. It describes current Cloudflare routing, four applied migrations and the actual disabled enquiry/email/schedule state. The remaining delivery acceptance sequence uses an isolated same-account preflight after recipient verification; it must not turn the live routed Worker into a staging site or perform a second DNS cutover. Historical records now link to the current runbook. Named local backups of the prior runbook and disabled workflow files were preserved before edits.

The initial handoff read-only checks verified both D1 migration ledgers `0001`–`0004`, zero enquiry/outbox rows, private intake URLs disabled, only D1/rate-limit bindings, and empty schedules. The later notification acceptance pass deployed a restricted production email binding and temporary cron plus an isolated guarded preflight; the public form remains disabled. These are dated observations and do not authorize deleting later data. Legacy deployment workflows remain `disabled_manually`; their manual jobs are echo-only and have no automatic deploy behavior. Their comments now distinguish Cloudflare marketing from the retained Hostinger origin.

PRs #132 and #136 contain obsolete redesign directions; they must not be merged into the current premium site. PR #173's source privacy work is superseded by the reconciled implementation here, while its evidence remains in history. Financial, expense-domain and dependency PRs were not merged as part of this public migration.

## External acceptance limits

The original handoff found the destination unverified. A later explicit client reminder was sent, and Cloudflare now confirms verification at `2026-10-26T11:43:18.318173Z`. Notification acceptance is being tested separately in an isolated same-account preflight; see the dated acceptance record in `docs/CLOUDFLARE-WORKERS.md`. Verification alone does not establish provider acceptance or actual inbox delivery, and the live form remains gated until those checks pass.

The connected Ahrefs project-inventory call returned “Insufficient plan”; no upgrade or purchase was made. Chrome's signed-in Google account has no accessible Arcan Search Console property, including in its property selector. No ownership verification, access invitation or account-security change was attempted. Search Console indexing/performance measurement requires an account that already has owner-granted access; this is separate from the live website's indexing configuration.

Final tests, PR resolution and actual deployment identities are recorded in the release PR comment. A source fix, dry run or empty D1 table is not evidence of notification or inbox delivery.
