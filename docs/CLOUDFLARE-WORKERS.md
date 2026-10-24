# Cloudflare Workers target

The public website has a separate **preview** target for Workers Static Assets. `npm run build:workers` builds the existing application, starts an isolated local renderer without database credentials, and exports the allowlisted public routes with their server-rendered HTML and hydration payloads. The Node server, CRM and filesystem uploads are not included in the Worker runtime. Existing `npm run build` and Node hosting remain available.

Commands:

- `npm ci`
- `npm run build:workers`
- `npm run types:workers` after changing bindings
- `npm run preview:workers` for local Workers runtime testing
- `npm run check:workers` for a dry-run bundle check, without publishing

This is **not yet a complete production migration**. The existing Hono server depends on Node startup migrations, database connections, native Argon2 and persistent filesystem uploads. Migrating that backend requires deciding database/auth/storage architecture (for example Hyperdrive for the existing database and R2 for uploads), implementing the runtime changes and testing existing CRM/auth workflows. Merely enabling `nodejs_compat` does not migrate it.

## Enquiries

`POST /api/contact` returns an explicit 503 until a compatible backend is configured. The form retains its details, shows a retry message and provides direct telephone/email contact. It never pretends that an enquiry was saved.

When a compatible contact Worker is ready, add a `LEADS_API` service binding to `wrangler.jsonc` using that Worker's actual name. Re-run `npm run types:workers`. Only the contact POST is forwarded; session cookies, authorization and CSRF headers are removed. The target must implement the current `/api/contact` JSON contract, input validation, abuse protection, persistence and lead notifications. A Node HTTP origin cannot be used as a Workers service binding; migrate the endpoint or introduce a separately reviewed bridge before enabling it. No unverified origin, database IDs or service names are preconfigured.

Other API, CRM and upload routes deliberately return 404. Public page navigation uses document links; the successful enquiry redirects with a document navigation to `/thank-you` without personal data in the URL. HTML includes React Router hydration data for project loaders. New public routes must be added to the export list; project and service routes are derived from `src/data/premiumSite.js`.

## Before release

The target sends `X-Robots-Tag: noindex, nofollow`, exports a blocking robots.txt and prerenders in staging mode. Keep those settings for previews. Once content and backend are approved, remove the preview-only header, prerender with production site mode, export the canonical sitemap/robots and verify crawling again. Confirm social/review destinations, image rights, finish scope and contact submissions in the real Workers environment before enabling a custom domain. Deployment and DNS have not been changed.

References consulted:

- https://developers.cloudflare.com/workers/best-practices/workers-best-practices/
- https://developers.cloudflare.com/workers/static-assets/routing/advanced/html-handling/
- https://developers.cloudflare.com/workers/framework-guides/web-apps/react-router/

## Validation in this change

The public export and Wrangler dry-run bundle check passed. Focused Worker boundary and enquiry form tests passed (11 tests). Local `wrangler dev` could not start in this workspace because the runtime reported `uv_interface_addresses` system error 1; a real Workers runtime smoke test remains required. No deployment was performed.

The managed browser preview injected an `aria-hidden` overlay DIV directly before the document HEAD, confirmed against a script-free SSR snapshot. React 18 consequently reported a document hydration mismatch in that instrumented preview. That node is absent from the exported HTML. No application suppression or hydration workaround was added; repeat browser hydration verification on the actual Workers staging URL without that instrumentation.

## Native enquiry intake implementation

`workers/leads/index.js` now supplies a private, service-binding-only intake Worker. It uses D1 prepared statements and a transactional batch to save the enquiry and a pending notification record together. It preserves the public form's JSON contract and returns `lead_saved: true` only after both writes are acknowledged. Requests have a 16 KiB streamed size limit, strict field validation, same-origin checks and a required Cloudflare rate-limit binding. The public Worker overwrites the private client-IP header using Cloudflare's original request IP; browser-supplied values are discarded. Contact data and database exceptions are not logged.

This implementation is **not enabled or deployed**. A read-only check found no Arcan Workers or D1 databases in the Ashbi Cloudflare account. No resources, bindings, DNS or production configuration were changed.

Before connecting it:

1. Create a dedicated Arcan staging D1 database. Add its returned ID to `workers/leads/wrangler.jsonc` under `d1_databases`, binding `LEADS_DB`, with `migrations_dir: "migrations"`. Do not repoint the existing CRM database.
2. Add a `ratelimits` binding named `ENQUIRY_LIMITER`, using an unused namespace ID in the selected Cloudflare account and `simple: { limit: 5, period: 60 }`. These limits are per Cloudflare location, not a strict global anti-abuse guarantee. Add Turnstile before public launch if stronger bot protection is required.
3. Run `wrangler d1 migrations apply <actual-database-name> --remote --config workers/leads/wrangler.jsonc`, then regenerate binding types with `wrangler types workers/leads/worker-configuration.d.ts --config workers/leads/wrangler.jsonc --include-runtime=false`.
4. Finish notification delivery and operator access before enabling public submissions. `enquiry_outbox` stores pending follow-up work; it does **not** yet send email/Telegram or sync records into the legacy CRM. Select the verified delivery destination, implement retries and mark `sent` only after acknowledgement. Keep pending rows visible to the operator. Define retention and deletion procedures for both tables.
5. Deploy the private intake Worker (`workers_dev` and preview URLs remain false), then add a `LEADS_API` service binding on the public Worker pointing to its actual deployed name. Test a synthetic submission through the staging public origin and verify both D1 records and the notification. Clean up only those identified test records.

Validation added: real SQLite execution of the migration and parameterized insert, transaction rollback when the outbox write fails, phone-only enquiries, invalid fields, payload limits, origin checks, rate limiting, missing configuration, unacknowledged writes and spoofed forwarding headers. Tests use in-memory databases and fake contact data; no client notification was sent.

API references: https://developers.cloudflare.com/d1/worker-api/d1-database/ and https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/.
