---
phase: 05-image-insertion
plan: 01
subsystem: ui
tags: [tiptap, react, strapi, media-library, nodeview, popover]

# Dependency graph
requires:
  - phase: 04-image-schema-foundation
    provides: StrapiImage extension with data-asset-id and data-align attributes
provides:
  - useImage hook returning imageButton and imageDialog JSX elements
  - MediaLibraryWrapper isolating useStrapiApp with null guard
  - ImageNodeView with Popover for alt text editing and image deletion
  - StrapiImage.addNodeView registered via ReactNodeViewRenderer
affects:
  - 05-02-PLAN (wires useImage into TiptapInput toolbar)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - useImage follows useLink pattern (returns button + dialog JSX)
    - MediaLibraryWrapper isolates Strapi context dependency for testability
    - NodeViewWrapper with useEffect alt sync for undo-safe state (research pitfall 4)
    - createParagraphNear chained after setImage to avoid cursor trap (research pitfall 2)

key-files:
  created:
    - admin/src/components/MediaLibraryWrapper.tsx
    - admin/src/components/ImageAltPopover.tsx
    - tests/admin/useImage.test.ts
  modified:
    - admin/src/extensions/Image.tsx
    - tests/admin/Image.test.ts

key-decisions:
  - "vi.mock stubs for @strapi/design-system required in test files — package ships CJS dist with ESM type:module flag causing vitest import failure"
  - "setImage attributes typed as any — @tiptap/extension-image SetImageOptions does not include custom attrs; runtime still works"
  - "Popover does not close on handleCommit — user may want to keep editing alt text (per plan spec)"

patterns-established:
  - "Design system mock pattern: vi.mock('@strapi/design-system', ...) in any test file importing Strapi UI components"
  - "Alt text fallback chain: asset.alternativeText ?? asset.name ?? ''"

requirements-completed: [IMG-01, IMG-02, IMG-03, IMG-05, ALT-01]

# Metrics
duration: 5min
completed: 2026-03-16
---

# Phase 05 Plan 01: Image Insertion Components Summary

**useImage hook, MediaLibraryWrapper (Strapi component registry integration), and ImageNodeView (popover alt text editor) built as isolated, testable components**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-16T15:35:45Z
- **Completed:** 2026-03-16T15:40:00Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- useImage hook returns `{ imageButton, imageDialog }` following useLink pattern; button disabled in code blocks
- MediaLibraryWrapper retrieves `components['media-library']` from Strapi registry via `useStrapiApp` with null guard
- ImageNodeView renders img tag inside NodeViewWrapper with Popover; alt commits on blur or Enter, useEffect syncs on undo
- StrapiImage extension gains `addNodeView` returning `ReactNodeViewRenderer(ImageNodeView)`
- All 21 unit tests pass (4 in useImage.test.ts, 17 in Image.test.ts)

## Task Commits

1. **Task 0: useImage unit test scaffold** - `452e126` (test)
2. **Task 1: MediaLibraryWrapper and ImageNodeView components** - `26be241` (feat)
3. **Task 2: useImage hook, NodeView registration, fixture verification** - `4ec2bd8` (feat)

## Files Created/Modified

- `admin/src/extensions/Image.tsx` - Added addNodeView, useImage hook, and necessary imports
- `admin/src/components/MediaLibraryWrapper.tsx` - Wraps Strapi MediaLibraryDialog from component registry
- `admin/src/components/ImageAltPopover.tsx` - ImageNodeView with Popover for alt text and delete
- `tests/admin/useImage.test.ts` - Unit test scaffold for IMG-01, IMG-02, IMG-03, ALT-01
- `tests/admin/Image.test.ts` - Added vi.mock stubs for new imports in Image.tsx

## Decisions Made

- `@strapi/design-system` ships a CJS dist file but declares `"type": "module"` in its package.json, causing vitest to treat it as ESM and fail. Added `vi.mock('@strapi/design-system', ...)` to all test files that transitively import it.
- The `setImage` Tiptap command's TypeScript type (`SetImageOptions`) does not include custom attributes added via `addAttributes`. Cast to `any` to allow passing `data-asset-id` — the ProseMirror schema validates at runtime, not compile time.
- `createParagraphNear()` chained after `setImage` prevents the cursor from being trapped when an image is inserted at the end of the document (research pitfall 2).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Existing Image.test.ts broke after Image.tsx gained new imports**
- **Found during:** Task 2 (useImage hook implementation)
- **Issue:** Image.tsx now imports ToolbarButton → @strapi/design-system, causing CJS/ESM crash in Image.test.ts
- **Fix:** Added vi.mock stubs for design-system, icons, tiptap/react, react-intl, strapi-admin to Image.test.ts
- **Files modified:** tests/admin/Image.test.ts
- **Verification:** All 17 Image.test.ts tests still pass
- **Committed in:** 4ec2bd8 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug introduced by task)
**Impact on plan:** Necessary to maintain existing test coverage. No scope creep.

## Issues Encountered

- Vitest v4 requires Node >= 22; project has Node 20 as default. Used `nvm use 22` throughout. The plan's `yarn test:ts:front` script calls `run -T tsc` (Yarn Berry syntax) which fails with Yarn Classic. Used `node_modules/.bin/tsc` directly instead.

## Next Phase Readiness

- All three source files export correctly and pass TypeScript checks
- useImage hook ready to be wired into TiptapInput toolbar in Plan 02
- No blockers

---
*Phase: 05-image-insertion*
*Completed: 2026-03-16*

## Self-Check: PASSED

- admin/src/extensions/Image.tsx: FOUND
- admin/src/components/MediaLibraryWrapper.tsx: FOUND
- admin/src/components/ImageAltPopover.tsx: FOUND
- tests/admin/useImage.test.ts: FOUND
- .planning/phases/05-image-insertion/05-01-SUMMARY.md: FOUND
- Commits 452e126, 26be241, 4ec2bd8: FOUND
