---
phase: 06-alignment
plan: 01
subsystem: ui
tags: [tiptap, react, image, alignment, content-safety, css, translations]

# Dependency graph
requires:
  - phase: 05-image-insertion
    provides: StrapiImage extension with data-align attribute, ImageAltPopover with popover structure
provides:
  - StrapiImage with enableContentCheck option and ImageNodeViewReadOnly component
  - Alignment buttons (L/C/R) in image popover with toggle behavior
  - Margin-based CSS alignment for center and right
  - Content-safety guard preserving images when mediaLibrary removed from preset
  - Translation keys for alignment tooltips
  - Fixture with all alignment values (null, center, right, left)
affects: [07-*, future image phases, content rendering, CSS]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "enableContentCheck option pattern: extension addOptions() switches node view renderer at configure() time"
    - "Content-safety guard: always register schema extension even when feature disabled — use read-only renderer"
    - "Alignment toggle: clicking active button passes null to updateAttributes to reset state"
    - "CSS margin-based alignment on NodeViewWrapper[data-align] targets child img"

key-files:
  created: []
  modified:
    - admin/src/extensions/Image.tsx
    - admin/src/components/ImageAltPopover.tsx
    - admin/src/components/TiptapInputStyles.ts
    - admin/src/translations/en.json
    - admin/src/utils/buildExtensions.ts
    - fixtures/all-features-payload.json
    - tests/admin/Image.test.ts
    - tests/admin/buildExtensions.test.ts

key-decisions:
  - "buildExtensions always includes image extension — enableContentCheck:true when mediaLibrary disabled prevents silent content deletion on preset reconfiguration"
  - "ImageNodeViewReadOnly has no onClick handler on img — no popover, no alignment controls, preserves read-only intent"
  - "NodeViewWrapper receives data-align as prop so CSS selectors can target the wrapper div directly"

patterns-established:
  - "Read-only NodeView pattern: separate component with no interactive handlers, same data-drag-handle attribute"
  - "Extension option guard: addNodeView() reads this.options.enableContentCheck to branch render logic"

requirements-completed: [ALIGN-01, ALIGN-02, ALIGN-03]

# Metrics
duration: 3min
completed: 2026-03-16
---

# Phase 6 Plan 01: Alignment Summary

**Left/center/right alignment buttons in image popover with margin-based CSS, plus content-safety guard rendering images read-only when mediaLibrary is removed from a preset**

## Performance

- **Duration:** ~45 min (including human-verify)
- **Started:** 2026-03-16T18:03:59Z
- **Completed:** 2026-03-16
- **Tasks:** 3 of 3 (all complete, including human-verify)
- **Files modified:** 8

## Accomplishments
- Content-safety guard: StrapiImage always registered in ProseMirror schema; ImageNodeViewReadOnly renders images without popover when mediaLibrary is disabled
- Three alignment buttons (L/C/R) above alt text row in image popover; active button highlighted; toggle-off resets data-align to null
- Margin-based CSS: `[data-align="center"] img` and `[data-align="right"] img` in TiptapInputStyles
- All tests pass (41/41 in Image + buildExtensions test files); fixture updated with right/left aligned image nodes
- Human-verify approved; one post-checkpoint fix applied: `ImageNodeViewReadOnly` was missing `data-align` on `NodeViewWrapper` — read-only images now respect stored alignment (b73c700)

## Task Commits

Each task was committed atomically:

1. **Task 1: enableContentCheck option and content-safety guard** - `9195591` (feat)
2. **Task 2: Alignment buttons, CSS, translations, fixture** - `e904488` (feat)
3. **Task 3: human-verify + fix read-only data-align** - `b73c700` (fix)

_Note: Task 1 used TDD (RED phase confirmed failures before GREEN implementation)_

## Files Created/Modified
- `admin/src/extensions/Image.tsx` - Added addOptions(), ImageNodeViewReadOnly export, conditional addNodeView()
- `admin/src/components/ImageAltPopover.tsx` - Alignment row with ToolbarButton L/C/R, handleAlign toggle, data-align on NodeViewWrapper
- `admin/src/components/TiptapInputStyles.ts` - CSS rules for data-align center and right
- `admin/src/translations/en.json` - alignLeft, alignCenter, alignRight translation keys
- `admin/src/utils/buildExtensions.ts` - Always-include image extension; enableContentCheck:true when mediaLibrary disabled
- `fixtures/all-features-payload.json` - Added right-aligned (data-asset-id:99) and left-aligned (data-asset-id:100) image nodes
- `tests/admin/Image.test.ts` - Added enableContentCheck and ImageNodeViewReadOnly export tests
- `tests/admin/buildExtensions.test.ts` - Updated 3 tests + 1 new for content-safety guard behavior

## Decisions Made
- `buildExtensions` always pushes image extension: prevents ProseMirror schema gap that would silently drop image nodes on save when mediaLibrary is disabled
- `ImageNodeViewReadOnly` is a separate named export (not inline) — enables direct test assertions on typeof
- `NodeViewWrapper data-align={node.attrs['data-align'] ?? undefined}` passes undefined (not null) so React does not render the attribute when absent, keeping CSS selectors clean

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Read-only image view missing data-align on NodeViewWrapper**
- **Found during:** Task 3 (human-verify checkpoint)
- **Issue:** `ImageNodeViewReadOnly` rendered `<NodeViewWrapper data-drag-handle>` without `data-align`, so CSS alignment rules had no effect on read-only images. Images displayed left-aligned regardless of the stored `data-align` value.
- **Fix:** Added `data-align={node.attrs['data-align'] ?? undefined}` to `NodeViewWrapper` in `ImageNodeViewReadOnly`, matching the existing `ImageNodeView` pattern.
- **Files modified:** `admin/src/extensions/Image.tsx`
- **Verification:** Human-verified — alignment styling now applies correctly in read-only mode
- **Committed in:** `b73c700` (fix during human-verify)

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug)
**Impact on plan:** Necessary for correctness — read-only images must respect stored alignment. No scope creep.

## Issues Encountered

- **Node.js version**: `npx vitest run` failed on Node v20.11.0 (rolldown requires `node:util#styleText` from Node 22). Used explicit Node 22 binary path for all test runs. Not a code issue — pre-existing environment constraint.
- **RichTextInput pre-existing failures**: 8 tests in `tests/admin/RichTextInput.test.ts` were already failing before this plan (React hooks called outside render context in `useImage`). These are out of scope and logged to deferred items.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All tasks complete and human-verified; v1.1 image feature is complete — insertion (Phase 5) and alignment (Phase 6) done
- Deferred: RichTextInput.test.ts failures need investigation (pre-existing, unrelated to image feature; 8 tests failing due to React hooks outside render context in `useImage`)

---
*Phase: 06-alignment*
*Completed: 2026-03-16*
