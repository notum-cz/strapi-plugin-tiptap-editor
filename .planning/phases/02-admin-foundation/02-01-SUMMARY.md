---
phase: 02-admin-foundation
plan: 01
subsystem: ui
tags: [tiptap, react, extensions, hooks, strapi-admin]

# Dependency graph
requires:
  - phase: 01-server-foundation
    provides: "TiptapPresetConfig type, isFeatureEnabled, getFeatureOptions, MINIMAL_PRESET_CONFIG from shared/types.ts; server preset API at /api/tiptap-editor/presets/:name"
provides:
  - "buildExtensions(config) pure function mapping TiptapPresetConfig to Extension[]"
  - "usePresetConfig(presetName) hook fetching preset config from server API"
  - "BaseHeadingWithSEOTag un-configured extension export for dynamic level configuration"
affects: [03-integration]

# Tech tracking
tech-stack:
  added: []
  patterns: [starterKitFeatureValue-helper, mounted-guard-fetch-hook]

key-files:
  created:
    - admin/src/utils/buildExtensions.ts
    - admin/src/hooks/usePresetConfig.ts
    - tests/admin/buildExtensions.test.ts
    - tests/admin/usePresetConfig.test.ts
  modified:
    - admin/src/extensions/Heading.tsx

key-decisions:
  - "Mocked @strapi/design-system and @tiptap/react in buildExtensions tests to avoid ESM/CJS conflicts from Heading.tsx transitive imports"
  - "usePresetConfig normalizes preset name by trimming and converting empty/whitespace to undefined"

patterns-established:
  - "starterKitFeatureValue helper: converts preset feature value to StarterKit configure format (false or options object)"
  - "mounted-guard pattern: useEffect with let mounted = true and cleanup return () => { mounted = false }"

requirements-completed: [UTILS-01, UTILS-02, UTILS-03, UTILS-04, UTILS-05]

# Metrics
duration: 2min
completed: 2026-03-10
---

# Phase 2 Plan 1: Admin Utilities Summary

**buildExtensions maps TiptapPresetConfig to Extension[] with StarterKit always present; usePresetConfig fetches presets from server API with MINIMAL_PRESET_CONFIG fallback**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-10T15:49:15Z
- **Completed:** 2026-03-10T15:51:57Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- buildExtensions pure function correctly maps any TiptapPresetConfig to a Tiptap Extension array with StarterKit always present (heading always false in StarterKit, handled separately via BaseHeadingWithSEOTag)
- usePresetConfig hook fetches preset config from /api/tiptap-editor/presets/:name using useFetchClient, with graceful fallback to MINIMAL_PRESET_CONFIG
- BaseHeadingWithSEOTag exported from Heading.tsx for dynamic level configuration (backward-compatible with existing HeadingWithSEOTag export)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create buildExtensions utility with tests** - `5cb446e` (feat)
2. **Task 2: Create usePresetConfig hook with tests** - `e29288b` (feat)

_Note: TDD tasks each include tests + implementation in a single commit_

## Files Created/Modified
- `admin/src/utils/buildExtensions.ts` - Pure function mapping preset config to Extension array
- `admin/src/hooks/usePresetConfig.ts` - React hook fetching preset config from server API
- `admin/src/extensions/Heading.tsx` - Added BaseHeadingWithSEOTag export (un-configured base extension)
- `tests/admin/buildExtensions.test.ts` - 18 unit tests for buildExtensions
- `tests/admin/usePresetConfig.test.ts` - 8 unit tests for usePresetConfig

## Decisions Made
- Mocked @strapi/design-system and @tiptap/react in buildExtensions tests to avoid ESM/CJS conflicts that arise from Heading.tsx importing design system components
- usePresetConfig normalizes preset name by trimming whitespace and converting empty strings to undefined for consistent "no preset" handling

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added vi.mock for @strapi/design-system and @tiptap/react in buildExtensions tests**
- **Found during:** Task 1 (buildExtensions TDD GREEN phase)
- **Issue:** Heading.tsx imports @strapi/design-system which uses ESM "type": "module" but vitest runs in node environment causing CJS/ESM conflict
- **Fix:** Added vi.mock() calls for @strapi/design-system and @tiptap/react in the test file
- **Files modified:** tests/admin/buildExtensions.test.ts
- **Verification:** All 18 tests pass
- **Committed in:** 5cb446e (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary to make tests runnable in node environment. No scope creep.

## Issues Encountered
None beyond the deviation above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- buildExtensions and usePresetConfig are ready to be wired into RichTextInput in Phase 3
- Extension hook refactoring (config parameter, feature gating) deferred to a separate plan
- All 54 tests passing across 7 test files (server + admin)

---
*Phase: 02-admin-foundation*
*Completed: 2026-03-10*
