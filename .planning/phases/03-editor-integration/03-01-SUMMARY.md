---
phase: 03-editor-integration
plan: 01
subsystem: ui
tags: [react, tiptap, strapi, preset, feature-guard, error-boundary]

# Dependency graph
requires:
  - phase: 02-admin-foundation
    provides: usePresetConfig hook, buildExtensions utility, FeatureGuard component, EditorErrorBoundary component
  - phase: 01-server-foundation
    provides: preset config API endpoint, TiptapPresetConfig types, MINIMAL_PRESET_CONFIG

provides:
  - Preset-aware RichTextInput reading attribute.options.preset
  - Memoized extensions keyed on presetName string (stable identity, EDITOR-02)
  - Loading state (Loader box) while config is being fetched (EDITOR-03)
  - No-preset notice banner in BaseTiptapInput (EDITOR-04)
  - FeatureGuard wrapping heading/textAlign/table toolbar groups with spacers
  - EditorErrorBoundary wrapping full editor output

affects:
  - Phase 3 future plans (PresetSelect, content-type builder integration)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Preset extraction: (props as any).attribute?.options?.preset pattern for Strapi field options"
    - "useMemo on string key: memoize on presetName (string) NOT config (object) for stable reference"
    - "Hooks before early return: all React hooks called unconditionally before isLoading early return"
    - "FeatureGuard + spacer: wrap feature group AND its trailing spacer in FeatureGuard so spacer disappears with group"
    - "Structural React testing: mock createElement + forwardRef, inspect element tree by type + props"

key-files:
  created:
    - tests/admin/RichTextInput.test.ts
    - tests/admin/BaseTiptapInput.test.ts
  modified:
    - admin/src/components/RichTextInput.tsx
    - admin/src/components/BaseTiptapInput.tsx

key-decisions:
  - "Extensions memoized on presetName string (not config object) — prevents re-creating editor (losing content) when parent re-renders with same preset (EDITOR-02)"
  - "All React hooks called unconditionally before isLoading early return — strictly follows React rules of hooks"
  - "FeatureGuard wraps heading/textAlign/table groups WITH trailing spacers — spacer only renders when group is visible"
  - "Status variant='secondary' for no-preset notice — non-dismissible, informational tone"
  - "noPresetConfigured=!presetName, not !config — keyed on whether developer configured a preset, not whether config loaded"

patterns-established:
  - "Toolbar FeatureGuard pattern: wrap each feature group + its Spacer together so collapsing a group also removes its spacing gap"
  - "Structural test pattern for forwardRef components: mock forwardRef as identity, mock createElement for tree inspection"

requirements-completed: [EDITOR-01, EDITOR-02, EDITOR-03, EDITOR-04, EDITOR-05]

# Metrics
duration: 3min
completed: 2026-03-10
---

# Phase 3 Plan 01: Editor Integration Summary

**Preset-aware RichTextInput connecting all Phase 1+2 infrastructure: reads attribute.options.preset, fetches config via usePresetConfig, builds memoized extensions on presetName string, shows loading state, wraps FeatureGuard toolbar groups with spacers, and shows no-preset notice in BaseTiptapInput**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-10T16:26:21Z
- **Completed:** 2026-03-10T16:29:58Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- RichTextInput now reads `attribute.options.preset` and drives all editor behavior from that config
- FeatureGuard wraps heading, textAlign, and table toolbar groups — spacers are included inside guards so they only appear when their group is visible
- BaseTiptapInput shows `Status variant="secondary"` notice when no preset is configured, positioned above the toolbar
- All 107 tests pass (21 new tests added: 13 for RichTextInput, 8 for BaseTiptapInput)

## Task Commits

Each task was committed atomically:

1. **Task 1: Refactor RichTextInput to preset-aware + FeatureGuard toolbar** - `3a1afa8` (feat)
2. **Task 2: Add no-preset notice to BaseTiptapInput** - `b540750` (feat)

_Note: TDD tasks — tests written first (RED), then implementation (GREEN). Both in same commit per plan._

## Files Created/Modified

- `admin/src/components/RichTextInput.tsx` - Rewritten: preset extraction, usePresetConfig call, memoized extensions on presetName, Loader for loading state, FeatureGuard groups, EditorErrorBoundary wrapper
- `admin/src/components/BaseTiptapInput.tsx` - Added noPresetConfigured prop, Status notice above toolbar
- `tests/admin/RichTextInput.test.ts` - 13 structural tests covering preset extraction, memoization, loading state, FeatureGuard usage, noPresetConfigured prop
- `tests/admin/BaseTiptapInput.test.ts` - 8 structural tests covering notice rendering, positioning, variant, and absence when not configured

## Decisions Made

- Extensions memoized on `presetName` (string) not `config` (object reference) — the same preset name always produces the same editor, even if the config object changes identity across re-renders. This is EDITOR-02.
- `noPresetConfigured={!presetName}` rather than `!config` — the notice is about developer configuration intent, not transient loading state.
- FeatureGuard wraps groups WITH their trailing spacer (e.g., `<FeatureGuard featureValue={config?.heading}>...{heading elements}<Spacer /></FeatureGuard>`) — prevents orphaned whitespace gaps in toolbar.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Test approach adjusted for structural React element inspection**
- **Found during:** Task 1 (RichTextInput tests — RED/GREEN cycle)
- **Issue:** Initial test approach used `vi.fn()` mocks and checked mock call counts for JSX components, but JSX creates React elements (not function calls) when calling the component directly without a render runtime
- **Fix:** Switched to mocking `createElement` to return plain element objects and inspecting the element tree by type/props — consistent with the established structural test pattern in this codebase
- **Files modified:** tests/admin/RichTextInput.test.ts, tests/admin/BaseTiptapInput.test.ts
- **Verification:** All 21 new tests pass, full suite 107/107 pass
- **Committed in:** 3a1afa8, b540750 (part of task commits)

---

**Total deviations:** 1 auto-fixed (test approach correction, no implementation changes)
**Impact on plan:** No scope creep. Implementation followed plan exactly; only test infrastructure approach was adjusted to match codebase's structural testing convention.

## Issues Encountered

- The test initially used mock function call tracking (`mockBaseTiptapInput.mock.calls`) but JSX components in direct calls create React elements, not function invocations. Adjusted to element tree inspection via `findElements()` helper.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- RichTextInput and BaseTiptapInput now wired to preset config system
- Phase 3 Plan 02 (PresetSelect CTB integration) can build on top of this foundation
- Concern from STATE.md: Verify that `attribute.options` keys survive a CTB save/reload cycle in Strapi 5 (still open)

## Self-Check: PASSED

- admin/src/components/RichTextInput.tsx: FOUND
- admin/src/components/BaseTiptapInput.tsx: FOUND
- tests/admin/RichTextInput.test.ts: FOUND
- tests/admin/BaseTiptapInput.test.ts: FOUND
- .planning/phases/03-editor-integration/03-01-SUMMARY.md: FOUND
- Commit 3a1afa8 (Task 1): FOUND
- Commit b540750 (Task 2): FOUND
- Full test suite: 107/107 passing

---
*Phase: 03-editor-integration*
*Completed: 2026-03-10*
