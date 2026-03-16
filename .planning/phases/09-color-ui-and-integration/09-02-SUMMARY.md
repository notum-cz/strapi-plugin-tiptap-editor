---
phase: 09-color-ui-and-integration
plan: "02"
subsystem: ui
tags: [tiptap, react, color-picker, hooks, popover, strapi-design-system]

requires:
  - phase: 09-color-ui-and-integration
    plan: "01"
    provides: ColorPickerPopover presentational component
  - phase: 08-extension-registration-and-theme-hook
    plan: "01"
    provides: useThemeConfig hook, themeCache
  - phase: 08-extension-registration-and-theme-hook
    plan: "02"
    provides: TextStyle/Color/Highlight extensions registered in buildExtensions

provides:
  - useTextColor hook (admin/src/extensions/TextColor.tsx)
  - useHighlightColor hook (admin/src/extensions/HighlightColor.tsx)
  - TextColorIcon inline SVG with dynamic underbar
  - HighlightColorIcon inline SVG with dynamic underbar
  - 22 unit tests covering both hooks

affects:
  - 09-03 (RichTextInput wiring — consumes useTextColor and useHighlightColor)

tech-stack:
  added: []
  patterns:
    - useEditorState selector for reactive active-color reads (avoids stale closure)
    - Popover.Root controlled mode with Popover.Anchor (avoids button-in-button nesting)
    - selectionRef pattern for selection preservation (save on open, restore before command)
    - null-guard on selectionRef.current (project convention, no !. assertions)
    - Early return guard on empty colors array (hook returns null button, not rendered)

key-files:
  created:
    - admin/src/extensions/TextColor.tsx
    - admin/src/extensions/HighlightColor.tsx
    - tests/admin/useTextColor.test.ts
    - tests/admin/useHighlightColor.test.ts

key-decisions:
  - "Popover.Root controlled mode (open/onOpenChange) with Popover.Anchor — avoids Popover.Trigger button-in-button nesting issue confirmed in design system .d.ts"
  - "selectionRef null-guard uses if (!selectionRef.current) return per project conventions (no !. assertions)"
  - "setHighlight({ color }) used for apply (not toggleHighlight) — per research anti-pattern note for multicolor mode"
  - "handleOpenChange delegates to openPicker/handleInteractOutside — single entry point for controlled open state"

patterns-established:
  - "Pattern: useEditorState selector reads getAttributes() inside ctx.editor null-guard"
  - "Pattern: openPicker saves { from, to } to selectionRef.current; restoreSelection reads it before every command"
  - "Pattern: hook returns null button early when colors array is empty (guard inside hook, not in FeatureGuard)"

requirements-completed: [TXTC-01, TXTC-02, TXTC-03, HILC-01, HILC-02, HILC-03, INFR-02]

duration: 5min
completed: 2026-03-16
---

# Phase 9 Plan 02: useTextColor and useHighlightColor Hooks Summary

**useTextColor and useHighlightColor hooks wiring ColorPickerPopover to Tiptap setColor/setHighlight commands with selection preservation via selectionRef pattern**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-16T21:46:08Z
- **Completed:** 2026-03-16T21:50:55Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- `useTextColor` hook: Popover.Root + Popover.Anchor pattern, setColor/unsetColor commands, useEditorState selector for active color, selectionRef preservation
- `useHighlightColor` hook: mirrors useTextColor with setHighlight({ color })/unsetHighlight, reads getAttributes('highlight').color
- Both hooks guard on empty/null theme colors and return null button (feature hidden when no colors configured)
- 22 unit tests passing across both hooks covering all spec behaviors

## Task Commits

1. **Task 1: Create useTextColor hook and tests** - `a4a70d9` (feat)
2. **Task 2: Create useHighlightColor hook and tests** - `b155bd2` (feat)

## Files Created/Modified

- `admin/src/extensions/TextColor.tsx` - useTextColor hook with TextColorIcon SVG, setColor/unsetColor, Popover.Anchor pattern
- `admin/src/extensions/HighlightColor.tsx` - useHighlightColor hook with HighlightColorIcon SVG, setHighlight/unsetHighlight, Popover.Anchor pattern
- `tests/admin/useTextColor.test.ts` - 11 unit tests: selector, null guard, selection ref, chain methods
- `tests/admin/useHighlightColor.test.ts` - 11 unit tests: selector, null guard, selection ref, chain methods

## Decisions Made

- Popover.Root controlled mode with Popover.Anchor (not Popover.Trigger) — prevents `<button>` nested in `<button>` HTML validation failure; confirmed in design-system .d.ts (Trigger omits asChild)
- `selectionRef.current` null-guarded with `if (!selectionRef.current) return` — follows project convention of null guards over `!.` assertions
- `setHighlight({ color })` for apply, `unsetHighlight()` for remove — per research anti-pattern note that toggleHighlight in multicolor mode checks exact color match

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

Tests originally used `require()` in test bodies to access mock references — not valid in ESM context. Fixed by using `vi.hoisted()` for all mock variable declarations and referencing them directly, and extracting `mockPopoverRoot` as a hoisted mock to capture `onOpenChange` props without dynamic import.

## Next Phase Readiness

- Both hooks are ready to be wired into `RichTextInput.tsx` in Phase 09-03
- Hooks are called unconditionally (React rules of hooks), FeatureGuard gates rendering
- ColorPickerPopover (from 09-01) is already available

## Self-Check: PASSED

All files created and commits verified.

---
*Phase: 09-color-ui-and-integration*
*Completed: 2026-03-16*
