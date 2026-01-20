# Arcan Painting - Improvements Todo

This file tracks identified improvements and technical debt in the codebase.

## Summary Statistics

| Metric | Current State | Target |
|--------|---------------|--------|
| Test Coverage | 1 test file (0.38%) | 80%+ |
| TypeScript Usage | 12 files (4%) | 100% |
| Security Issues | 4 critical | 0 |
| Large Components (500+ lines) | 9 | 0 |
| Console Statements in APIs | 120+ | 0 |

---

## Phase 1: Critical (Security & Stability)

### Security Fixes

- [ ] **Add Auth Check to Dashboard API**
  - File: `src/app/api/admin/dashboard/route.js:6`
  - Issue: Missing server-side auth check (TODO comment exists)

- [ ] **Fix Unsafe PostMessage Origins**
  - File: `src/app/__create/not-found.tsx:47-51, 80-87`
  - Issue: 11 instances using wildcard `'*'` origin
  - Fix: Specify trusted origins explicitly

- [ ] **Fix Regex Injection in Email Templates**
  - File: `src/app/api/utils/send-email.js:135-138`
  - Issue: `new RegExp()` with user-controlled template variable names
  - Fix: Use `escapeRegExp` utility or literal string replacement

### Test Coverage (Critical Business Logic)

- [ ] Add tests for `src/utils/estimateCalculations.js`
- [ ] Add tests for `src/utils/contractsUtils.js`
- [ ] Add tests for `src/utils/estimatesUtils.js`
- [ ] Add tests for `src/app/api/` routes (integration tests)

### Remove Debug Code

- [ ] Remove/conditionalize 120+ console statements in API routes
  - All files in `src/app/api/`

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

| File | Issue | Priority |
|------|-------|----------|
| `src/app/api/admin/dashboard/route.js` | Missing auth | Critical |
| `src/app/__create/not-found.tsx` | Unsafe postMessage | Critical |
| `src/app/api/utils/send-email.js` | Regex injection | Critical |
| `src/app/admin/scheduling/page.jsx` | Needs refactoring | High |
| `src/components/admin/contracts/CreateContractModal.jsx` | Complex, 4 useEffects | High |
| All API routes | Console statements | High |

---

## Tracking Progress

Update this file as improvements are completed. Mark items with [x] when done.

Last updated: 2026-01-20
