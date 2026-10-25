# Email forwarding preparation — 24 October 2026

Cameron selected email forwarding instead of arbitrary-recipient Email Sending. Cloudflare documents free Worker sends to verified account destination addresses even when only Email Routing is configured. Actual delivery remains unverified; the website has not been cut over.

The zone and production resources are in account `1b2e351cbb39ab6b80efe36ca3577fe5`. Email Routing's DNS onboarding targeted only `enquiries.arcanpainting.ca`, which returned `enabled=true`, `status=ready`. Zone-level routing is now enabled; the root domain reports `misconfigured` because its Google MX/SPF are deliberately preserved. Do not add Cloudflare root MX/SPF to clear that status. All 11 original DNS records were compared after setup and remain unchanged. Google Workspace remains responsible for `@arcanpainting.ca` mail. The before snapshot is `arcan-dns-before-forwarding-2026-10-24.json`.

New DNS records:

| ID | Type | Name |
| --- | --- | --- |
| `6971521e16fb3986a45a203922bf2fa4` | MX | enquiries.arcanpainting.ca |
| `fd44c81b488c414e2c0ce1f0f5403e0a` | MX | enquiries.arcanpainting.ca |
| `ccbe14d2dcf13425be6e64f0515e5a97` | MX | enquiries.arcanpainting.ca |
| `e9a8cef5c5d8033d523278205f0a8d20` | TXT/SPF | enquiries.arcanpainting.ca |
| `7c9e88b578706b9b829dd337032999a9` | TXT/DKIM | cf2024-1._domainkey.arcanpainting.ca |

Destination `info@arcanpainting.ca`, ID `33526f79c0af47579f5dc82db4467d68`, was created once. Cloudflare returned `status=unverified`, `verified=null`. Its verification email was requested through Cloudflare; Cameron was asked to have the inbox owner verify it. Cameron's “ok” acknowledges the request and is not verification evidence. Do not resend it without checking current state.

The production intake configuration prepares a fixed sender and destination; no cron is configured and it must not be deployed until recipient verification. No forwarding rule has been created yet: Cloudflare requires a verified destination first. Optional literal inbound/reply rule: `notifications@enquiries.arcanpainting.ca` → `info@arcanpainting.ca`. That rule is not needed for outbound Worker notifications and is not an acceptance gate. No root mail-record replacement or catch-all is authorized by this setup.

Remaining acceptance: verify destination through the API and deploy the restricted binding. Temporarily use the existing same-account public Worker with staging/noindex settings and operator-only intake, while keeping the private intake private and all domain routes absent. After checking configuration and pending rows, temporarily enable the cron to validate the form/private Worker/D1/outbox flow. Confirm provider acknowledgement and inbox receipt before general public intake or website cutover. Restore disabled cron/intake and temporary URLs if interrupted; otherwise remove test access/data and restore production public settings for cutover.

Checks performed after preparation: 50 existing intake/outbox/public-boundary tests passed; typecheck passed; lint had zero errors and 237 existing warnings; Wrangler production dry run validated the exact sender/destination restrictions. Public DNS resolves all three subdomain MX records and its SPF. Cloudflare's scoped routing-DNS check reports `errors=null`. The private intake's public URLs remain disabled, its cron list is empty, the zone has no Worker routes, and production D1 has zero enquiries/outbox records. These checks do not establish provider acceptance or inbox delivery.

Rollback: disable new notification delivery first, retaining real enquiry/outbox records. Before removing any of these five new DNS records, inspect current routing/sending use and preserve any subsequent unrelated change. Disable only the enquiries subdomain through its scoped Email Routing operation; never use a zone-wide disable/delete or overwrite Google's MX/SPF. The additive DKIM selector may be shared by future routing domains and must not be removed blindly. Original website hosting and data remain intact.
