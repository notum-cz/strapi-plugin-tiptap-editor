---
phase: 05-image-insertion
plan: 02
subsystem: ui
tags: [tiptap, react, toolbar, css, i18n, media-library]

# Dependency graph
requires:
  - phase: 05-image-insertion-01
    provides: useImage hook, StrapiImage extension, ImageNodeView, MediaLibraryWrapper

provides:
  - useImage wired into RichTextInput InnerEditor
  - FeatureGuard block for mediaLibrary between link and table toolbar sections
  - Image CSS styles (max-width 100%, block display, selection ring)
  - Translation keys for insertImage, altText, deleteImage

affects: [06-image-alignment, testing]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "useImage hook follows same pattern as useLink/useTable — hook call then FeatureGuard in toolbar JSX"
    - "Image CSS uses ProseMirror-selectednode for selection ring (auto-applied by Tiptap/ProseMirror)"
    - "Translation keys grouped by feature prefix: tiptap-editor.image.*"

key-files:
  created: []
  modified:
    - admin/src/components/RichTextInput.tsx
    - admin/src/components/TiptapInputStyles.ts
    - admin/src/translations/en.json

key-decisions:
  - "Image FeatureGuard uses config?.mediaLibrary matching the preset key established in phase 04"
  - "Selection ring uses #4945ff (Strapi primary600) at 2px solid, matching Strapi design language"
  - "Image NodeView wrapper [data-type=image] gets 0.75em vertical margin for consistent block spacing"

patterns-established:
  - "Feature hooks always called unconditionally before early return — avoids React hooks-order violations"
  - "Image styles scoped inside .ProseMirror to prevent bleed into Strapi admin UI outside editor"

requirements-completed: [IMG-01, IMG-02, IMG-03, IMG-05, ALT-01]

# Metrics
duration: 5min
completed: 2026-03-16
---

# Phase 05 Plan 02: Image Insertion Wiring Summary

**useImage hook wired into RichTextInput toolbar with FeatureGuard gating on mediaLibrary preset key, image CSS display and selection ring styles, and i18n translation keys**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-16T15:45:00Z
- **Completed:** 2026-03-16T15:50:00Z
- **Tasks:** 1 of 2 (Task 2 is human-verify checkpoint)
- **Files modified:** 3

## Accomplishments
- Wired useImage hook into InnerEditor, positioned after useLink in hook call order
- Added FeatureGuard for mediaLibrary between link and table toolbar sections — button appears/hides based on preset
- Added image CSS: max-width 100%, block display, auto height for natural proportions
- Added ProseMirror-selectednode selection ring (2px solid #4945ff, matching Strapi primary600)
- Added [data-type="image"] NodeView margin for block spacing
- Added three translation keys: insertImage, altText, deleteImage

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire useImage into RichTextInput, add CSS and translations** - `53451ee` (feat)

**Plan metadata:** pending (after human-verify checkpoint)

## Files Created/Modified
- `admin/src/components/RichTextInput.tsx` - Added useImage import, hook call, and FeatureGuard block for mediaLibrary
- `admin/src/components/TiptapInputStyles.ts` - Added image display and selection ring CSS
- `admin/src/translations/en.json` - Added insertImage, altText, and deleteImage translation keys

## Decisions Made
- Followed plan as specified — image FeatureGuard placed after link and before table, matching documented position decision from phase 05-01.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- `yarn test:ts:front` invokes `run -T tsc` which requires the Yarn PnP binary; used `npx tsc -p admin/tsconfig.json --noEmit` directly. Both frontend and backend TypeScript checks passed cleanly.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Complete image insertion flow is code-complete and TypeScript-verified
- Task 2 (human-verify checkpoint) requires live Strapi instance verification of the full flow: toolbar button visibility, Media Library picker, image insertion, alt text popover, selection ring, delete
- After checkpoint approval, phase 05 is complete and phase 06 (image alignment) can begin

---
*Phase: 05-image-insertion*
*Completed: 2026-03-16*
