# September 25 dependency alert remediation — arcanpainting.ca

Baseline: `48c6e664160ccc675d5792830a23c0dcbf5390fd` on `main`. Alert: Gmail `1a0d6399a2cae927`.

Hostinger scan dated September 25: 14 findings: 4 high, 9 moderate, 1 low; 722 packages scanned.

The reproducible npm audits below were run on September 26, 2026 using Node 24.19.0 and npm 11.9.0 against the committed lockfile. Hostinger provided summary counts, not package/advisory detail. Its deployed artifact and scanner rules were not independently inspected; do not treat npm package totals as a one-to-one reconciliation of the Hostinger findings.

## Audit results

| Scope | Critical | High | Moderate | Low | Total |
|---|---:|---:|---:|---:|---:|
| before | 0 | 2 | 9 | 0 | 11 |
| after | 0 | 0 | 2 | 0 | 2 |
| production-before | 0 | 1 | 5 | 0 | 6 |
| production-after | 0 | 0 | 0 | 0 | 0 |

Commands: `npm audit --json` and `npm audit --omit=dev --json`. Full JSON evidence is alongside this report. The all-dependency audit exits 1 while vulnerabilities remain; this is expected for both baselines and Arcan after the fix.

## Exact affected packages

Direct/transitive is npm audit classification. A parent with no advisory of its own is included because its dependency is affected. Detailed dependency paths and advisory IDs/ranges are in the accompanying logs and audit JSON.

| Package | Relationship | Baseline severity | Before | After | Remaining |
|---|---|---|---|---|---|
| `@vitest/mocker` | transitive | moderate | 3.2.7 | 3.2.7 | moderate |
| `baseline-browser-mapping` | transitive | moderate | 2.10.42 | 2.11.26 | none |
| `body-parser` | transitive | moderate | 1.20.6 | 1.20.8 | none |
| `browserslist` | transitive | high | 4.28.6 | 4.29.1 | none |
| `express` | transitive | moderate | 4.22.2 | 4.22.3 | none |
| `hono` | direct | moderate | 4.13.3 | 4.13.9 | none |
| `js-yaml` | transitive | high | 3.15.1 | 3.15.2 | none |
| `morgan` | transitive | moderate | 1.11.0 | 1.12.1 | none |
| `qs` | transitive | moderate | 6.15.2 | 6.16.0 | none |
| `valibot` | transitive | moderate | 1.4.1 | 1.5.0 | none |
| `vitest` | direct | moderate | 3.2.7 | 3.2.7 | moderate |

## Compatibility decisions

- Hono: 4.13.3 → 4.13.9, with the manifest floor raised to the tested patch. This also includes upstream post-4.13.5 JSX escaping fixes. React Router remains 7.18.2; Vite remains 6.4.3 and React remains 18.3.1.
- js-yaml override: ^3.15.1 → ^3.15.2. Preserve major 3 for gray-matter and patch its merge-key CPU denial-of-service issue.
- Targeted transitive refresh: browserslist, baseline-browser-mapping, qs, body-parser, express, morgan and valibot. Existing semver ranges permit these updates; no additional override or framework migration is needed. Browserslist metadata helper updates are part of that dependency graph.
- Existing legacy-peer-deps=true is unchanged. npm ls reports the same four existing issues before and after: Vite 6 versus react-router-hono-server >=7.3.1 peer requirement, missing Chakra Emotion peers, and an @types/react peer mismatch. Tests and builds pass; this PR does not silently migrate Vite or add unused UI libraries.
- Existing Dependabot PR #127 overlaps Hono and PR #129 touches development packages. This focused security PR does not modify or close either PR. Rebase/re-evaluate their lockfiles after any approved merge; do not blindly combine them.

## Deferred moderate finding

Vitest 3.2.7 and @vitest/mocker 3.2.7 are two npm entries for GHSA-82fw-gwwq-j7x9 (one development-server file-read advisory). The first stable fixed line is 4.1.11; npm audit proposes 5.0.2. Vitest 3 has no patch. The current suite uses jsdom/node forks and does not configure the public standalone mocker plugin. Keep development/test servers private. A separate test-runner migration should upgrade Vitest to a fixed supported major and revalidate its configuration; do not force a Vitest 4 mocker into Vitest 3.

## Validation

| Check | Baseline | Updated |
|---|---|---|
| npm ci --no-audit --no-fund | pass | pass |
| npm run lint | pass | pass |
| npm run typecheck | pass | pass |
| npm test | 51 files, 150 tests passed | 51 files, 150 tests passed |
| npm run build | pass | pass |
| Existing Playwright smoke suite | blocked by missing Chromium executable | 12 passed: desktop, Pixel 5 and 768px tablet |

Browser checks exercised estimate-dialog open/Escape dismissal without page errors, privacy, invalid service/API 404 handling, five account/recovery routes and noindex metadata. Health correctly returned 503 with no database. The original 8 test cases were run plus the same four cases at tablet width; no test assertion was removed.

Limitations: the standard Playwright Chromium 151 download returned invalid empty archives. A temporary config used separately installed Chromium 153, disabled video recording (no bundled FFmpeg) and added the tablet project. Neither config nor browser runtime changes are included in the application. Public gallery binaries were not downloaded; this is behavioural smoke testing, not a full gallery visual audit. No database, authenticated CRM mutation, payment, email delivery or production analytics was exercised. CI uses Node 22.20; local validation used Node 24.19.

## Primary references

- [js-yaml merge-key CPU advisory](https://github.com/advisories/GHSA-2883-xcg3-v3hh)
- [Vitest/mocker advisory and fixed versions](https://github.com/advisories/GHSA-82fw-gwwq-j7x9)
- [Hono 4.13.9 release](https://github.com/honojs/hono/releases/tag/v4.13.9)
- All other advisory links, affected ranges and package paths: audit-before.json.

## Approval and rollback

No merge, deployment, auto-merge label, production configuration change or external notification was performed. Changes are limited to package.json, the npm-generated package-lock.json and this review evidence.

After approval: require passing repository checks, deploy through the established production process, verify public routes and configured form/storage delivery, and request a fresh Hostinger scan. Merging Arcan main triggers existing deployment workflows, so merge itself needs explicit approval. If a release regresses, redeploy the previously known-good artifact or revert the dependency commit through a reviewed PR; restoring vulnerable dependencies is a temporary rollback and requires a prompt alternative fix.
