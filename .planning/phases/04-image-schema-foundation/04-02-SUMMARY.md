---
phase: 04-image-schema-foundation
plan: 02
subsystem: ui
tags: [tiptap, extensions, image, prosemirror, vitest]

# Dependency graph
requires:
  - phase: 04-01
    provides: mediaLibrary key in TiptapPresetConfig and PRESET_FEATURE_KEYS

provides:
  - StrapiImage Tiptap node extension with data-asset-id (number | null) and data-align (string | null) attributes
  - buildExtensions conditionally includes StrapiImage behind isFeatureEnabled(config.mediaLibrary)
  - 17 unit tests for StrapiImage attribute schema
  - 5 new/updated tests for mediaLibrary gating in buildExtensions

affects: [05-image-toolbar-ui, 06-image-rendering]

# Tech tracking
tech-stack:
  added: ["@tiptap/extension-image@3.20.1"]
  patterns:
    - "Image.extend() with (this as any).parent?.() to inherit base attrs"
    - "renderHTML returns {} for null attrs (not { attr: null }) to prevent ProseMirror serializing null as string"
    - "parseHTML converts string to number with parseInt + isNaN guard for data-asset-id"
    - "isFeatureEnabled(config.mediaLibrary) gate in buildExtensions before Gapcursor push"

key-files:
  created:
    - admin/src/extensions/Image.tsx
    - tests/admin/Image.test.ts
  modified:
    - admin/src/utils/buildExtensions.ts
    - tests/admin/buildExtensions.test.ts
    - package.json
    - yarn.lock

key-decisions:
  - "Use standard 'image' node name via Image.extend() — NOT a custom 'strapiImage' name to ensure ProseMirror schema compatibility"
  - "Return {} from renderHTML for null/falsy values — returning { attr: null } would cause ProseMirror to serialize null as the string 'null'"
  - "data-asset-id stored as number | null in JSON — parseHTML converts string attribute to int"

patterns-established:
  - "Null-safe renderHTML: always return {} instead of { attr: null } for absent/null attributes"
  - "Attribute test pattern: call addAttributes via (StrapiImage as any).config.addAttributes with mock this context"

requirements-completed: [PRESET-02, IMG-04]

# Metrics
duration: 3min
completed: 2026-03-16
---

# Phase 4 Plan 02: Image Schema Foundation — Extension Implementation Summary

**StrapiImage Tiptap node extending base Image with data-asset-id (number) and data-align (string) attrs, wired into buildExtensions behind mediaLibrary preset gate**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-16T14:35:03Z
- **Completed:** 2026-03-16T14:37:46Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Created `StrapiImage` extension that extends `@tiptap/extension-image`, inheriting src/alt/title and adding data-asset-id and data-align with null-safe round-trip semantics
- Wired `StrapiImage` into `buildExtensions` behind `isFeatureEnabled(config.mediaLibrary)` following the established gating pattern
- 136 total tests passing; 22 new tests added (17 for Image schema, 5 for buildExtensions mediaLibrary gating)

## Task Commits

Each task was committed atomically:

1. **Task 1: Install @tiptap/extension-image and create StrapiImage extension with tests** - `40a0f06` (feat)
2. **Task 2: Wire StrapiImage into buildExtensions behind mediaLibrary gate** - `304b199` (feat)

**Plan metadata:** (docs commit — see below)

_Note: TDD tasks — RED → GREEN cycle for each task_

## Files Created/Modified

- `admin/src/extensions/Image.tsx` — StrapiImage extension with custom attributes (created)
- `tests/admin/Image.test.ts` — 17 unit tests for StrapiImage attribute schema (created)
- `admin/src/utils/buildExtensions.ts` — Added StrapiImage import and mediaLibrary gate (modified)
- `tests/admin/buildExtensions.test.ts` — 5 new/updated mediaLibrary gating tests (modified)
- `package.json` — Added @tiptap/extension-image@3.20.1 dependency (modified)
- `yarn.lock` — Updated lockfile (modified)

## Decisions Made

- Used `Image.extend()` with standard `name = 'image'` — not a renamed node — to ensure ProseMirror schema compatibility and correct fixture serialization
- `renderHTML` returns `{}` for null/falsy values (not `{ attr: null }`) to prevent ProseMirror serializing null as the string `"null"` in HTML attributes
- `data-asset-id` stored as `number | null` in JSON; `parseHTML` converts the HTML string attribute via `parseInt` + `isNaN` guard

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Used Node 22 to run vitest 4 tests**
- **Found during:** Task 1 verification
- **Issue:** `rolldown@1.0.0-rc.9` requires Node `^20.19.0 || >=22.12.0` but the shell was on Node 20.11.0; `styleText` not exported from `node:util` on that version
- **Fix:** Used `nvm use 22` (Node 22.17.1 available in nvm) to run all test and build commands
- **Files modified:** None (environment workaround only)
- **Verification:** All 136 tests pass, build succeeds under Node 22

---

**Total deviations:** 1 auto-fixed (environment/blocking)
**Impact on plan:** No code changes required; all planned files created exactly as specified.

## Issues Encountered

- Node 20.11.0 incompatible with `rolldown@1.0.0-rc.9` used by vitest 4. Resolved by switching to Node 22 via nvm. This is a pre-existing environment configuration issue unrelated to the implementation.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `StrapiImage` extension schema is locked; data-asset-id and data-align are ready for Phase 5 toolbar integration
- `buildExtensions` gate confirms extension only loads when `mediaLibrary: true` in preset config
- Fixture `fixtures/all-features-payload.json` already exercises image nodes with both attrs (added in Plan 01)

---
*Phase: 04-image-schema-foundation*
*Completed: 2026-03-16*
