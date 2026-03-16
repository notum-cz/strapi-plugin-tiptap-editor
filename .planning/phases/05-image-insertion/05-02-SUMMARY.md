---
phase: 05-image-insertion
plan: "02"
subsystem: ui
tags: [tiptap, react, toolbar, css, i18n, media-library, context-isolation]

# Dependency graph
requires:
  - phase: 05-image-insertion-01
    provides: useImage hook, StrapiImage extension, ImageNodeView, MediaLibraryWrapper
  - phase: 04-02
    provides: StrapiImage Tiptap extension wired into buildExtensions

provides:
  - useImage wired into RichTextInput InnerEditor
  - FeatureGuard block for mediaLibrary between link and table toolbar sections
  - Image CSS styles (max-width 100%, block display, selection ring)
  - Translation keys for insertImage, altText, deleteImage
  - Module-level StrapiApp capture (strapiApp.ts) bypassing use-context-selector isolation

affects: [06-image-alignment, testing]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "useImage hook follows same pattern as useLink/useTable — hook call then FeatureGuard in toolbar JSX"
    - "Image CSS uses ProseMirror-selectednode for selection ring (auto-applied by Tiptap/ProseMirror)"
    - "Translation keys grouped by feature prefix: tiptap-editor.image.*"
    - "Context isolation bypass: capture StrapiApp at register() in index.ts, expose typed getters from utils/strapiApp.ts"

key-files:
  created:
    - admin/src/utils/strapiApp.ts
  modified:
    - admin/src/components/RichTextInput.tsx
    - admin/src/components/TiptapInputStyles.ts
    - admin/src/translations/en.json
    - admin/src/index.ts
    - admin/src/components/MediaLibraryWrapper.tsx

key-decisions:
  - "StrapiApp instance captured at register() time via module-level ref — use-context-selector isolates contexts between plugin bundle and host, making useStrapiApp() return undefined at render time"
  - "Image FeatureGuard uses config?.mediaLibrary matching the preset key established in phase 04"
  - "Selection ring uses #4945ff (Strapi primary600) at 2px solid, matching Strapi design language"
  - "Image NodeView wrapper [data-type=image] gets 0.75em vertical margin for consistent block spacing"

patterns-established:
  - "Feature hooks always called unconditionally before early return — avoids React hooks-order violations"
  - "Image styles scoped inside .ProseMirror to prevent bleed into Strapi admin UI outside editor"
  - "Any plugin component needing host app registry access must use captureApp/getMediaLibraryComponent pattern from strapiApp.ts"

requirements-completed: [IMG-01, IMG-02, IMG-03, IMG-05, ALT-01]

# Metrics
duration: ~30min
completed: 2026-03-16
---

# Phase 05 Plan 02: Image Insertion Wiring Summary

**useImage wired into RichTextInput with FeatureGuard gating; Media Library picker unblocked via module-level StrapiApp capture fixing use-context-selector bundle isolation**

## Performance

- **Duration:** ~30 min (including bug investigation and fix)
- **Started:** 2026-03-16T15:45:00Z
- **Completed:** 2026-03-16
- **Tasks:** 2 (1 auto + 1 human-verify checkpoint)
- **Files modified:** 5

## Accomplishments

- Wired `useImage` hook into `InnerEditor`, positioned after `useLink` in hook call order
- Added `FeatureGuard` for `mediaLibrary` between link and table toolbar sections — button appears/hides based on preset
- Added image CSS: max-width 100%, block display, auto height for natural proportions
- Added `.ProseMirror-selectednode` selection ring (2px solid #4945ff, matching Strapi primary600)
- Added `[data-type="image"]` NodeView margin for block spacing
- Added three translation keys: insertImage, altText, deleteImage
- Diagnosed and fixed silent context isolation failure in `MediaLibraryWrapper` — Media Library picker now opens correctly
- User confirmed full flow passes in a live Strapi instance (all 11 verification steps)

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire useImage into RichTextInput, add CSS and translations** - `53451ee` (feat)
2. **Bug fix: MediaLibraryWrapper context isolation** - `ef2ea58` (fix)

**Plan metadata (checkpoint docs):** `8db4a89` (docs: complete plan — pending human-verify checkpoint)

## Files Created/Modified

- `admin/src/utils/strapiApp.ts` - Module-level StrapiApp capture and `getMediaLibraryComponent()` accessor (new)
- `admin/src/index.ts` - Calls `captureApp(app)` in `register()` to populate the module ref
- `admin/src/components/MediaLibraryWrapper.tsx` - Replaced `useStrapiApp()` with `getMediaLibraryComponent()` to bypass context isolation
- `admin/src/components/RichTextInput.tsx` - Added `useImage` import, hook call, and `FeatureGuard` block for `mediaLibrary`
- `admin/src/components/TiptapInputStyles.ts` - Added image display and selection ring CSS
- `admin/src/translations/en.json` - Added `insertImage`, `altText`, and `deleteImage` translation keys

## Decisions Made

- **Module-level app ref over useStrapiApp:** The Strapi `@strapi/admin/strapi-admin` package creates its context via `use-context-selector`, which does not propagate across bundle boundaries. Plugin components therefore get `undefined` from `useStrapiApp()`. Capturing the app instance at `register()` time and storing it in a module-level variable is the correct pattern for all Strapi plugin components that need access to the app registry.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] MediaLibraryWrapper silently failed to open Media Library dialog**

- **Found during:** Human verification (Task 2)
- **Issue:** `MediaLibraryWrapper` called `useStrapiApp()` from `@strapi/admin/strapi-admin` to look up the `'media-library'` component from the app registry. Because `use-context-selector` creates isolated context instances per bundle, the plugin bundle's call returned `undefined` rather than the host app's registry. The dialog never rendered; clicking the toolbar button had no visible effect.
- **Fix:** Created `admin/src/utils/strapiApp.ts` exporting `captureApp()` and `getMediaLibraryComponent()`. Updated `admin/src/index.ts` to call `captureApp(app)` in `register()`. Updated `MediaLibraryWrapper.tsx` to call `getMediaLibraryComponent()` instead of `useStrapiApp().components['media-library']`.
- **Files modified:** `admin/src/utils/strapiApp.ts` (new), `admin/src/index.ts`, `admin/src/components/MediaLibraryWrapper.tsx`
- **Verification:** User confirmed Media Library picker opens and full insertion flow works after fix.
- **Committed in:** `ef2ea58`

---

**Total deviations:** 1 auto-fixed (Rule 1 — Bug)
**Impact on plan:** Fix was essential for the plan's core deliverable. Without it, the picker never opened. No scope creep; all changes directly serve the image insertion flow.

## Issues Encountered

- `yarn test:ts:front` invokes `run -T tsc` which requires the Yarn PnP binary; used `npx tsc -p admin/tsconfig.json --noEmit` directly. Both frontend and backend TypeScript checks passed cleanly.
- Context isolation failure was non-obvious because `useStrapiApp()` returned `undefined` silently. The root cause (`use-context-selector` bundle isolation) is a general Strapi plugin constraint. The fix pattern (capture at `register()`) is now documented in `strapiApp.ts` for future phases.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 5 complete: full image insertion, alt text editing, selection ring, and Media Library picker confirmed working end-to-end in live Strapi
- Phase 6 (Alignment) can begin: `StrapiImage` already has the `alignment` attribute in its schema (added in Phase 4); Phase 6 adds alignment toolbar buttons and CSS rules
- Known concern: `window.location.origin` URL prefixing only works for single-domain Strapi deployments; document as known limitation if split-domain setups are needed

---
*Phase: 05-image-insertion*
*Completed: 2026-03-16*
