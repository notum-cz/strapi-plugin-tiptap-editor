---
phase: 08-extension-registration-and-theme-hook
plan: 01
subsystem: ui
tags: [tiptap, extensions, react, hooks, theme, typescript]

# Dependency graph
requires:
  - phase: 07-types-config-and-server
    provides: TiptapThemeConfig and ThemeColorEntry types from shared/types.ts
provides:
  - themeCache module (get/set for TiptapThemeConfig, module-level state)
  - PasteStripper extension (strips inline style attrs from pasted HTML)
  - useThemeConfig hook (reads from themeCache, returns TiptapThemeConfig | null)
  - @tiptap/extension-text-style, @tiptap/extension-color, @tiptap/extension-highlight at 3.20.1
affects:
  - 08-02 (buildExtensions wiring, bootstrap stylesheet injection)
  - 09 (color picker UI consuming useThemeConfig)

# Tech tracking
tech-stack:
  added:
    - "@tiptap/extension-text-style@3.20.1"
    - "@tiptap/extension-color@3.20.1"
    - "@tiptap/extension-highlight@3.20.1"
  patterns:
    - "Module-level cache pattern for sharing data between bootstrap() lifecycle and React hooks"
    - "TDD: RED (failing tests) then GREEN (implementation) per task"

key-files:
  created:
    - admin/src/utils/themeCache.ts
    - admin/src/extensions/PasteStripper.ts
    - admin/src/hooks/useThemeConfig.ts
    - tests/admin/themeCache.test.ts
    - tests/admin/PasteStripper.test.ts
  modified:
    - package.json
    - yarn.lock

key-decisions:
  - "PasteStripper uses transformPastedHTML config property (not addProseMirrorPlugins) per Tiptap Extension.create API"
  - "useThemeConfig is a thin wrapper over getThemeCache() — reactivity can be added later without changing consumers"
  - "style stripping uses regex / style=\"[^\"]*\"/ — sufficient for Tiptap-pasted HTML (double-quoted attrs only)"

patterns-established:
  - "Extension pattern: admin/src/extensions/PasteStripper.ts — one file per extension, Extension.create()"
  - "Cache isolation in tests: beforeEach calls setThemeCache(null) to reset module-level state"

requirements-completed: [INFR-03, INFR-05]

# Metrics
duration: 2min
completed: 2026-03-16
---

# Phase 08 Plan 01: Extension Registration and Theme Hook Summary

**Module-level themeCache, PasteStripper Tiptap extension, and useThemeConfig hook with three Tiptap color packages at 3.20.1**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-16T20:14:07Z
- **Completed:** 2026-03-16T20:16:00Z
- **Tasks:** 2 of 2
- **Files modified:** 7

## Accomplishments

- themeCache module with get/set/null/overwrite behaviors, fully unit tested (6 tests)
- PasteStripper Tiptap extension stripping inline style attrs from pasted HTML via regex, fully unit tested (10 tests)
- useThemeConfig React hook as thin wrapper over getThemeCache() for consistent hook consumption pattern
- Three Tiptap extension packages installed at exact version 3.20.1 (text-style, color, highlight)
- All 163 tests pass including 16 new tests; yarn build succeeds with no TypeScript errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Create themeCache module and PasteStripper extension with tests** - `df5946c` (feat)
2. **Task 2: Install Tiptap packages and create useThemeConfig hook** - `33bba5a` (feat)

## Files Created/Modified

- `admin/src/utils/themeCache.ts` - Module-level cache with setThemeCache/getThemeCache exports
- `admin/src/extensions/PasteStripper.ts` - Tiptap extension stripping style attrs from pasted HTML
- `admin/src/hooks/useThemeConfig.ts` - React hook returning TiptapThemeConfig | null from cache
- `tests/admin/themeCache.test.ts` - 6 unit tests for get/set/null/overwrite behaviors
- `tests/admin/PasteStripper.test.ts` - 10 unit tests for extension name and style stripping
- `package.json` - Added @tiptap/extension-text-style, color, highlight at 3.20.1
- `yarn.lock` - Updated lockfile

## Decisions Made

- PasteStripper uses `transformPastedHTML` config property on `Extension.create()` rather than `addProseMirrorPlugins()` — this is the correct Tiptap API hook for HTML transformation
- Style stripping regex `/ style="[^"]*"/g` handles double-quoted attributes as pasted by browsers; single-quoted edge cases not needed for Tiptap output
- useThemeConfig is intentionally a thin wrapper — zero additional network calls, reactivity can be added later without changing callers

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

- Node.js v20.11.0 cannot run vitest v4 (missing `styleText` export from `node:util`). Switched to Node v22.14.0 via nvm for test execution. Build (yarn build) works fine on v20. This is a pre-existing environment constraint, not introduced by this plan.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- themeCache, PasteStripper, and useThemeConfig are ready for Plan 02 to wire into buildExtensions and bootstrap
- Three Tiptap packages are installed and TypeScript-resolved
- No blockers

---
*Phase: 08-extension-registration-and-theme-hook*
*Completed: 2026-03-16*
