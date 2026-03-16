---
phase: 08-extension-registration-and-theme-hook
plan: 02
subsystem: ui
tags: [tiptap, extensions, color, highlight, textStyle, bootstrap, theme, vitest, tdd]

# Dependency graph
requires:
  - phase: 08-extension-registration-and-theme-hook
    plan: 01
    provides: themeCache module, PasteStripper extension, useThemeConfig hook
  - phase: 07-types-config-and-server
    plan: 02
    provides: /tiptap-editor/theme route, theme controller returning {} when no theme
provides:
  - buildExtensions conditionally registers TextStyle/Color/Highlight/PasteStripper based on textColor and highlightColor flags
  - bootstrap() fetches /tiptap-editor/theme, populates themeCache, injects stylesheet link idempotently
  - Comprehensive TDD tests for all color extension registration scenarios
  - Bootstrap tests covering theme fetch, cache population, and stylesheet injection
affects:
  - phase 09 (ColorPickerPopover UI component will consume themeCache via useThemeConfig)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - needsTextStyle guard deduplicates TextStyle+PasteStripper registration when both textColor and highlightColor are enabled
    - bootstrap() uses native fetch (not useFetchClient) so admin session cookie is sent automatically for same-origin
    - Dynamic import avoided for themeCache — static import + vi.hoisted() in tests enables correct mock hoisting

key-files:
  created:
    - tests/admin/bootstrap.test.ts
  modified:
    - admin/src/utils/buildExtensions.ts
    - admin/src/index.ts
    - tests/admin/buildExtensions.test.ts

key-decisions:
  - "Static import for themeCache in index.ts (not dynamic) — enables correct vi.mock hoisting in tests"
  - "vi.hoisted() used in bootstrap.test.ts to declare mock variables before vi.mock hoisting executes"
  - "bootstrap() fails silently on fetch error with console.warn — does not block admin startup"

patterns-established:
  - "needsTextStyle: const needsTextStyle = isFeatureEnabled(config.textColor) || isFeatureEnabled(config.highlightColor) — single registration guard for shared extensions"
  - "Idempotent DOM injection: getElementById check before createElement prevents duplicate link tags"

requirements-completed: [INFR-03, INFR-04, INFR-05]

# Metrics
duration: 15min
completed: 2026-03-16
---

# Phase 8 Plan 02: Extension Registration and Theme Hook Summary

**Conditional TextStyle/Color/Highlight/PasteStripper registration in buildExtensions with idempotent bootstrap theme fetch and stylesheet injection**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-16T21:18:00Z
- **Completed:** 2026-03-16T21:21:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- buildExtensions now registers TextStyle+PasteStripper (once) when textColor or highlightColor enabled, Color when textColor, Highlight(multicolor) when highlightColor
- bootstrap() fetches /tiptap-editor/theme, populates themeCache, and injects link#tiptap-theme-stylesheet idempotently
- 9 new TDD tests for buildExtensions and 8 new TDD tests for bootstrap covering all behavioral scenarios
- fixture already contained textStyle and highlight mark examples from Phase 7

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend buildExtensions with color extension registration and tests** - `e553ac2` (feat)
2. **Task 2: Wire bootstrap with theme fetch and stylesheet injection, create tests** - `5c6e28e` (feat)

**Plan metadata:** (docs commit follows)

_Note: Both tasks followed TDD: RED (failing tests) -> GREEN (implementation) -> verified._

## Files Created/Modified
- `admin/src/utils/buildExtensions.ts` - Added TextStyle, Color, Highlight, PasteStripper imports and needsTextStyle registration block
- `admin/src/index.ts` - Made bootstrap async; added theme fetch, themeCache population, idempotent stylesheet injection
- `tests/admin/buildExtensions.test.ts` - Added 9 tests covering textColor/highlightColor extension registration cases
- `tests/admin/bootstrap.test.ts` - Created new file with 8 tests for all bootstrap behaviors

## Decisions Made
- Used static import for `setThemeCache` (not dynamic `await import()`) — enables correct `vi.mock` hoisting in tests without extra complexity
- Used `vi.hoisted()` in `bootstrap.test.ts` to declare `mockSetThemeCache` before `vi.mock` factory runs — resolves ReferenceError from hoisting
- No changes to fixture needed — `textStyle` and `highlight` marks were already present from Phase 7 fixture update

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed vi.mock factory ReferenceError with vi.hoisted()**
- **Found during:** Task 2 (bootstrap test RED phase)
- **Issue:** Plan used `const mockSetThemeCache = vi.fn()` before `vi.mock()`, but vi.mock is hoisted to top causing ReferenceError
- **Fix:** Used `vi.hoisted()` to declare the mock variable in a hoisted context
- **Files modified:** tests/admin/bootstrap.test.ts
- **Verification:** All 8 bootstrap tests pass
- **Committed in:** 5c6e28e (Task 2 commit)

**2. [Rule 1 - Bug] Changed dynamic import to static import for themeCache**
- **Found during:** Task 2 (bootstrap GREEN phase evaluation)
- **Issue:** Plan proposed `await import('./utils/themeCache')` inside bootstrap, but static import is simpler and works correctly with vi.mock
- **Fix:** Used static `import { setThemeCache } from './utils/themeCache'` at top of index.ts
- **Files modified:** admin/src/index.ts
- **Verification:** All 8 bootstrap tests pass, TypeScript check passes
- **Committed in:** 5c6e28e (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 1 - bugs/issues in plan approach)
**Impact on plan:** Both fixes were necessary for test correctness. No scope creep.

## Issues Encountered
- Node.js v20.11.0 (active via nvm) incompatible with vitest v4 due to missing `styleText` export. Used `~/.nvm/versions/node/v22.14.0/bin/node` to run tests.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All Phase 8 deliverables complete: themeCache, PasteStripper, useThemeConfig (Plan 01) + buildExtensions color registration + bootstrap theme fetch/inject (Plan 02)
- Phase 9 can consume `useThemeConfig()` to build ColorPickerPopover with the theme color palette
- No blockers from this phase

---
*Phase: 08-extension-registration-and-theme-hook*
*Completed: 2026-03-16*
