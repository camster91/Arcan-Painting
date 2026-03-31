# Arcan Painting - Improvements Todo

This file tracks identified improvements and technical debt in the codebase.

## Summary Statistics

| Metric | Current State | Target |
|--------|---------------|--------|
| Test Coverage | 4 test files (1.5%) | 80%+ |
| TypeScript Usage | 12 files (4.6%) | 100% |
| Security Issues | 1 critical remaining | 0 |
| Large Components (500+ lines) | 2 | 0 |
| Console Statements in APIs | 112 (error logs only) | 0 |

---

## Phase 1: Critical (Security & Stability)

### Security Fixes

- [x] **Add Auth Check to Dashboard API**
  - File: `src/app/api/admin/dashboard/route.js:6`
  - Issue: Missing server-side auth check (TODO comment exists)
  - Fix: Added auth check using `getCurrentUser` from auth utils

- [x] **Fix Unsafe PostMessage Origins**
  - File: `src/app/__create/not-found.tsx:47-51, 80-87`
  - Issue: 11 instances using wildcard `'*'` origin
  - Fix: Replaced with `window.location.origin` for same-origin only

- [x] **Fix Regex Injection in Email Templates**
  - File: `src/app/api/utils/send-email.js:135-138`
  - Issue: `new RegExp()` with user-controlled template variable names
  - Fix: Replaced with `split().join()` pattern to avoid regex injection

### Test Coverage (Critical Business Logic)

- [x] Add tests for `src/utils/estimateCalculations.js`
  - Created: `test/estimateCalculations.test.js`
- [x] Add tests for `src/utils/contractsUtils.js`
  - Created: `test/contractsUtils.test.js`
  - Fixed: `calculateContractStats` to handle invalid `total_amount`
- [x] Add tests for `src/utils/estimatesUtils.js`
  - Created: `test/estimatesUtils.test.js`
  - Fixed: `formatCurrency`, `formatDate`, `formatDateLong` to handle invalid inputs
- [ ] Add tests for `src/app/api/` routes (integration tests)

### Remove Debug Code

- [x] Remove/conditionalize 120+ console statements in API routes
  - Removed 2 `console.log` statements (only debug logs)
  - Kept 112 `console.error` statements (error logging is appropriate for production)
  - Files cleaned: `src/app/api/contact/route.js`, `src/app/api/email-workflows/route.js`

---

## Phase 2: High Priority (Code Quality)

### Large Component Refactoring

Components exceeding 500 lines need to be split:

- [ ] `src/client-integrations/shadcn-ui.jsx` (1,260 lines)
  - Consider auto-importing or code splitting

- [ ] `src/app/admin/scheduling/page.jsx` (931 lines)
  - Extract: CalendarView, TimeTracker, SchedulingForm components

- [ ] `src/components/admin/projects/ProjectProgressModal.jsx` (743 lines)
  - Extract: ProgressForm, MilestoneList, StatusSection components

- [ ] `src/components/admin/contracts/CreateContractModal.jsx` (713 lines)
  - Extract form logic into `useContractForm` hook
  - Split into ContractForm, ContractPreview sub-components

- [ ] `src/app/admin/tasks/page.jsx` (674 lines)
  - Extract: TaskList, TaskFilters, TaskForm components

- [ ] `src/app/admin/layout.jsx` (632 lines)
  - Extract: Sidebar, AuthProvider, OfflineDetector components

### TypeScript Migration

Priority order for migration to TypeScript:

1. [ ] Hooks (`src/hooks/` - 14 files)
   - useContracts, useEstimates, useLeads, etc.

2. [ ] Utilities (`src/utils/` - 15 files)
   - estimateCalculations, contractsUtils, etc.

3. [ ] API Routes (`src/app/api/` - 50+ files)

4. [ ] Components (`src/components/` - 117 files)

5. [ ] Pages (`src/app/` - page.jsx files)

### Error Handling

- [ ] Replace silent catch blocks: `.catch(() => {})` patterns
  - Found in multiple components
- [ ] Add React Error Boundaries for admin pages
- [ ] Implement proper error logging service

---

## Phase 3: Medium Priority (UX & Maintenance)

### Accessibility Improvements

Currently only 62 accessibility attributes (target: 500+)

- [ ] Add ARIA labels to all interactive components
- [ ] Add alt text to images in MediaGallery.jsx
- [ ] Use semantic HTML (button instead of div with onClick)
- [ ] Add keyboard navigation support
- [ ] Add skip navigation links

### Performance Optimization

- [ ] Add `React.memo()` to expensive render components
  - Focus on: scheduling page, tasks page, table components

- [ ] Add `useMemo()` for derived state calculations
  - Contract totals, estimate calculations, filtered lists

- [ ] Add `useCallback()` for stable function references
  - Event handlers passed to child components

- [ ] Audit localStorage/sessionStorage usage
  - `src/components/PWAInstaller.jsx`
  - `src/components/SeasonalPromotionPopup.jsx`
  - Add size limits and expiry validation

### Documentation

- [ ] Add `src/README.md` with directory structure guide
- [ ] Add JSDoc comments to exported utility functions
- [ ] Add prop types documentation for key components
- [ ] Add API route documentation

---

## Phase 4: Nice to Have

### Code Cleanup

- [ ] Audit `src/client-integrations/shadcn-ui.jsx` for unused imports
- [ ] Review and remove unused utility files
- [ ] Consolidate duplicated list rendering patterns (111 .map() calls)
- [ ] Complete TODO comments in codebase:
  - `src/components/AdaptiveContentArea.jsx:147` - Add dropdown menu

### Development Experience

- [ ] Add pre-commit hooks for linting/type checking
- [ ] Add GitHub Actions CI for tests
- [ ] Add Storybook for component documentation
- [ ] Configure bundle analysis

---

## Files Requiring Immediate Attention

| File | Issue | Priority | Status |
|------|-------|----------|--------|
| `src/app/api/admin/dashboard/route.js` | Missing auth | Critical | ✅ Fixed (auth added) |
| `src/app/__create/not-found.tsx` | Unsafe postMessage | Critical | ✅ Fixed (origin restricted) |
| `src/app/api/utils/send-email.js` | Regex injection | Critical | ✅ Fixed (split/join pattern) |
| `src/app/admin/scheduling/page.jsx` | Needs refactoring | High | ⚠️ Still large (931 lines) |
| `src/components/admin/contracts/CreateContractModal.jsx` | Complex, 4 useEffects | High | ⚠️ Still complex (713 lines) |
| All API routes | Console statements | High | ✅ Debug logs removed (error logs kept) |
| `src/__create/@auth/create.js` | Missing `hono/context-storage` import | Critical | ✅ Fixed (import present and middleware active) |

---

## Tracking Progress

Update this file as improvements are completed. Mark items with [x] when done.

Last updated: 2026-03-21

---

## Phase 5: Marketing Command Center (NEW — 2026-03-21)

Full digital marketing toolkit embedded in the admin backend, powered by Kimi K2 (Ollama on VPS).

### Infrastructure

- [ ] **Deploy Ollama on Coolify VPS**
  - Pull `kimi-k2` model (or closest available: `qwen2.5:7b` as fallback)
  - Register free Ollama account with info@arcanpainting.ca
  - Expose internal endpoint: http://ollama:11434
  - Add Coolify health check + always-restart policy
  - Add `OLLAMA_URL` env var to app

- [ ] **AI Fallback Chain**
  - Primary: Ollama (Kimi K2 / local)
  - Fallback: Gemini 2.0 Flash API
  - In-app banner if Ollama is down

### Pages to Build

- [ ] `/admin/marketing` — Hub dashboard (platform connection status, quick stats)
- [ ] `/admin/marketing/ai-assistant` — Full chat with Kimi K2 (business-aware context)
- [x] `/admin/marketing/facebook` — FB/IG Ads: view campaigns, create ads, boost posts (Meta Marketing API)
- [x] `/admin/marketing/google-ads` — Google Ads: dashboard, keyword performance, budget (Google Ads API)
- [x] `/admin/marketing/google-business` — GBP: post updates, respond to reviews, view insights (GBP API)
- [x] `/admin/marketing/email-outreach` — Cold email sequences: real estate agents, property managers (Mailgun)
- [x] `/admin/marketing/linkedin` — LinkedIn message drafts + outreach tracker
- [ ] `/admin/marketing/email-triage` — Gmail inbox: AI reads, labels, drafts replies (Gmail API)
- [ ] `/admin/marketing/reviews` — Review management: Google + Homestars (AI draft, Gerardo approves)
- [x] `/admin/system` — App control panel: health status, logs, restart services, env var manager

### API Routes to Build

- [ ] `POST /api/marketing/generate` — AI content generation (proxies to Ollama, fallback Gemini)
- [x] `GET/POST /api/marketing/facebook` — Meta API proxy (campaigns, insights, boost)
- [x] `GET/POST /api/marketing/google-ads` — Google Ads API proxy
- [x] `GET/POST /api/marketing/google-business` — GBP API proxy (posts, reviews)
- [ ] `GET/POST /api/marketing/email-sequences` — Cold email sequence management
- [ ] `GET /api/marketing/email-triage` — Gmail inbox fetch + AI draft
- [ ] `POST /api/marketing/review-response` — Draft review reply with AI

### DB Tables to Add

- [x] `marketing_connections` — stores API keys/tokens per platform (encrypted)
- [ ] `email_sequences` — cold email sequence templates + send schedules
- [ ] `outreach_contacts` — leads for cold email/LinkedIn outreach
- [x] `marketing_campaigns` — track cross-platform campaign performance

### Recovery & Resilience

- [ ] Coolify restart policy: always restart on failure
- [ ] `/api/health` enhanced: check Ollama, DB, Mailgun connectivity
- [ ] In-app expired API key warnings with re-connect flow
- [ ] Ad spend anomaly alerts (>2x normal spend triggers notification)
- [ ] Neon DB: 30-day point-in-time recovery (already active)

### What Client Needs to Provide

- Facebook Business Manager access (for Meta API)
- Google Ads account ID (for Google Ads API)
- Google Business Profile verified listing (for GBP API)
- AI walks Gerardo through connecting everything else

### Build Order

1. Ollama VPS deploy + AI assistant chat (foundation)
2. Marketing hub page + platform connection status cards
3. Email outreach + Gmail triage (uses Mailgun already connected)
4. Facebook Ads + Google Business Profile
5. Google Ads + LinkedIn outreach
6. /admin/system control panel + recovery tools
