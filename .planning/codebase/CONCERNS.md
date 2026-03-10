# Concerns & Technical Debt

**Analysis Date:** 2026-03-10

## TypeScript Quality

**Excessive `any` casts:**
- Several places use `any` type to work around strict typing
- Editor extension configurations sometimes bypass type safety
- Location: `admin/src/utils/tiptapUtils.tsx`, extension hooks

**Risk:** Low immediate risk, but makes refactoring harder and hides potential runtime errors.

**Unresolved TypeScript errors:**
- Codebase has `// @ts-ignore` or type assertion workarounds in places
- Type definitions for Strapi's field API may not be complete

## Error Handling

**Silent catches:**
- JSON parsing uses try-catch with fallback but doesn't surface errors to the user
- Failed parse silently returns default value — errors in production content go unnoticed

**Missing error boundaries:**
- No React error boundaries around the editor
- Editor crashes (e.g., from malformed content) will propagate up and potentially crash the Strapi admin panel

**Incomplete error recovery:**
- No retry mechanisms for failed operations
- No user-facing error messages for most failure paths

## Security

**Unvalidated URLs in link extension:**
- `admin/src/extensions/Link.tsx` likely accepts any URL without protocol validation
- Risk: `javascript:` protocol links could be inserted into content

**JSON structure not validated:**
- Field value read from Strapi is parsed but structure not validated against expected schema
- Malformed saved content could cause runtime errors

**Console logging:**
- `console.error` calls may log user content in error paths
- Low risk but worth noting for privacy-conscious deployments

## Performance

**Editor state re-evaluation:**
- `useEditorState` subscriptions may cause unnecessary re-renders if selectors are not memoized
- Extension hooks each have their own state subscriptions

**Component re-creation:**
- Extension configuration objects may be recreated on each render, causing editor to re-initialize
- Location: extension hooks creating new objects in render path

**No lazy loading:**
- All extensions loaded upfront; no code splitting for optional extensions
- Minor impact given plugin is admin-only, but adds to initial bundle size

## Fragile Areas

**Editor ref management:**
- `BaseTiptapInput.tsx` manages editor lifecycle; tight coupling between ref and parent state
- Risk: ref timing issues during mount/unmount

**Table state handling:**
- `TableSizeDialog.tsx` + `useTable` hook have complex interaction pattern
- Table cell selection state is fragile in Tiptap and may not survive all editor events

**Link selection restoration:**
- After closing LinkDialog, cursor position/selection restoration is non-trivial in Tiptap
- Risk: losing selection after link edit

**Strapi field API coupling:**
- Direct usage of `useField` from Strapi internals — API changes in future Strapi versions could break field integration
- Currently pinned to Strapi 5.x

## Test Coverage Gaps

- **Zero tests** for any component, hook, or utility
- No automated validation of editor behavior
- No regression protection for toolbar button states
- See `TESTING.md` for full testing gap analysis

## Dependencies

**Version pinning:**
- Tiptap extensions pinned to 3.19.0 — major updates require careful migration
- Strapi 5.35.0 in devDependencies; plugin targets Strapi 5.x only (breaking change from v4)
- React 18 assumed; React 19 compatibility not tested

**Peer dependency drift:**
- `@strapi/design-system ^2.0.0-rc.30` uses release candidate — final API not stabilized

## Missing Features (Known Gaps)

- No user-configurable preset system (planned feature based on `usePresetConfig` hook stub)
- No hooks/utils for buildExtensions marked as incomplete (`admin/src/utils/buildExtensions.d.ts` exists in dist but source not visible)
- `featureToggle` utility exists in dist type declarations suggesting incomplete feature flag system

## CI/CD

- No CI pipeline configured
- No automated type checking on PRs
- No publish automation for npm releases

---

*Concerns analysis: 2026-03-10*
