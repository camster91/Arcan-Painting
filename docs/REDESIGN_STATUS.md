# Luxury redesign — status (paused for client review)

Last updated: 2026-09-30

## Where things are

- **Code:** PR #136, branch `ccr-830aa9ca-la5hg5`. Draft. Stacked on PR #132
  (`design/editorial-homepage`), not on `main`, so merging #136 alone does not deploy.
- **Review page for Gerardo:** https://claude.ai/artifact/VkhfhZmwCfxs1DsZWN3TcW
  (private; share it from the page's Share menu before sending).
- **Checks:** `npm run build` and `npm test` pass (153 tests). GitGuardian passed on the
  latest commit.
- **Deploy:** production deploys from `main` (Coolify on the Ashbi VPS). Nothing from this
  redesign is live.

## Waiting on the client

1. Approve the look, or list changes.
2. Confirm the finish pages describe services Arcan offers (Venetian plaster, limewash,
   cabinet painting in particular).
3. Send real photos for plaster, limewash, cabinets and luxury jobs, to replace the
   illustrative textures (`heroTexture` in `src/data/landingPages.js`).
4. Flag anything the site should not claim.

## When approved

1. Retarget PR #136 to `main` (it then includes #132's changes); close #132.
2. Mark #136 ready and merge. This deploys production.
3. After deploy: log in to `/admin` and check the new colours; submit the sitemap in
   Search Console; add the new services and photos to the Google Business Profile.

## Optional: clickable staging

`.github/workflows/deploy-preview.yml` deploys to a Coolify preview app. It has never
run. It needs a Coolify app on this branch with its own database and
`PUBLIC_SITE_MODE=staging`, plus a GitHub environment named `Preview` with
`PREVIEW_COOLIFY_URL`, `PREVIEW_COOLIFY_TOKEN` (secrets), `PREVIEW_APP_UUID` and
`PREVIEW_URL` (variables).

## Not done / open

- Microcement page: not built (not confirmed as a service).
- Admin CRM: recoloured via the amber/slate remap in `tailwind.config.js`; only the
  sign-in page was checked visually.
