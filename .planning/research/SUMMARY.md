# Project Research Summary

**Project:** Strapi Plugin Tiptap Editor — v1.2 Text Color, Highlight Color, Theme Config
**Domain:** Tiptap rich-text editor plugin — inline color formatting and design-system theme integration
**Researched:** 2026-03-16
**Confidence:** HIGH

## Executive Summary

v1.2 adds text color, highlight color, and a global theme configuration layer to an existing Strapi 5 Tiptap editor plugin that already ships a preset feature-gating system (v1.0) and Media Library image support (v1.1). The new capabilities follow the same architectural patterns already in place: two new Tiptap mark extensions (`TextStyle`+`Color` and `Highlight`) are registered conditionally in `buildExtensions`, two new preset feature keys (`textColor`, `highlightColor`) are added to the shared type system, and a new `GET /tiptap-editor/theme` admin route delivers global theme configuration to the browser. The only net-new dependencies are `@tiptap/extension-text-style@3.20.1` and `@tiptap/extension-highlight@3.20.1`; all other capabilities (color picker UI, stylesheet injection, server route) reuse existing patterns and libraries already in the project.

The recommended approach centers on a shared `ColorPickerPopover` component backed by a developer-supplied `theme.colors` palette. The official Tiptap color picker UI components (`ColorTextPopover`, `ColorHighlightPopover`) do not accept a custom colors array, so a custom component using `@strapi/design-system` Popover primitives is required. Stylesheet injection happens once per page load via a module-level idempotency flag inside the `useThemeConfig` hook rather than in the synchronous `bootstrap()` hook, because the theme URL must be fetched asynchronously and `useFetchClient` requires React context. Build order is strictly determined by compile-time dependencies: shared types and `PRESET_FEATURE_KEYS` first, then server route and service, then admin hook, then extension registration, then UI components, then `RichTextInput` wiring.

Key risks are well-understood and have concrete mitigations. The most dangerous pitfalls are: (1) omitting `TextStyle` registration alongside `Color` — causes silent no-ops with no error output; (2) omitting `multicolor: true` on `Highlight` — silently discards color values from JSON; (3) the color picker stealing ProseMirror selection before `setColor` fires — resolved by saving/restoring selection using the same `selectionRef` pattern already in the codebase's `Link.tsx`; and (4) failing to sync `PRESET_FEATURE_KEYS` with `TiptapPresetConfig` — causes silent validator bypass and fixture drift. The CLAUDE.md fixture maintenance requirement triggers here: `fixtures/all-features-payload.json` must be updated to include `textStyle` and `highlight` marks.

## Key Findings

### Recommended Stack

Two new packages are required, both pinned to the existing Tiptap lockstep version `3.20.1`. No other new dependencies are needed. The color picker UI is buildable from existing `@strapi/design-system@2.2.0` Popover and Box primitives; theme config is served via an extension of the existing preset route/service pattern; stylesheet injection uses the browser DOM API.

**Core technologies (new additions only):**
- `@tiptap/extension-text-style@3.20.1` — provides both the `TextStyle` mark (foundational `<span>` wrapper) and the `Color` extension via `import { TextStyle, Color } from '@tiptap/extension-text-style'`; must match Tiptap lockstep to prevent ProseMirror schema conflicts
- `@tiptap/extension-highlight@3.20.1` — provides the `Highlight` mark (`<mark>` element); must be configured with `multicolor: true`; the default `multicolor: false` silently discards color attributes from JSON output

**What does NOT need new packages:**
- Color picker UI — `@strapi/design-system` Popover + Box (already at `2.2.0`)
- Stylesheet injection — browser `document.createElement('link')` DOM API
- Theme config serving — extend existing preset route/controller/service pattern
- Config validation — extend existing `server/src/config/index.ts` validator
- Shared types — extend existing `shared/types.ts`

See `.planning/research/STACK.md` for full version compatibility matrix, alternatives considered, and explicit list of packages to avoid.

### Expected Features

**Must have (table stakes):**
- `textColor` preset key enabling `TextStyle` + `Color` extensions with toolbar button and popover — standard in every modern CMS editor
- `highlightColor` preset key enabling `Highlight.configure({ multicolor: true })` with toolbar button and popover — standard alongside text color
- `theme.colors` palette array (`Array<{ label: string; color: string }>`) shown as swatches in a custom `ColorPickerPopover` — the only way to surface developer-supplied palette (official Tiptap popover components do not accept custom colors)
- `theme.stylesheet` URL string injected as a `<link>` at plugin bootstrap — allows design-system CSS classes to render in the editor canvas
- `GET /tiptap-editor/theme` admin route delivering theme config to the browser
- Colors round-tripping through Tiptap JSON as concrete hex values (never CSS variable tokens)
- "Remove color" / "clear" action in both pickers via `unsetColor()` / `unsetHighlight()`

**Should have (differentiators):**
- `theme` config scoped globally, not per-preset — single palette definition with no duplication across content types
- Preset-gated color features — consistent with existing plugin architecture; no other CMS editor plugin for Strapi supports this
- Idempotent stylesheet injection with `data-tiptap-editor-theme` marker attribute — survives Vite HMR without duplicate `<link>` tags
- Active-state swatch indicator (reads `editor.getAttributes('textStyle').color` / `getAttributes('highlight').color`)

**Defer to v1.x or v2+:**
- Free-form hex input alongside swatches — defeats design token consistency; add only if content managers report palette is insufficient; should be opt-in via config
- Per-preset color palette overrides — multiplies config complexity; one palette per plugin instance is sufficient for the target use case
- Live stylesheet hot-reload without server restart — WebSocket/polling complexity with low value for static design systems

See `.planning/research/FEATURES.md` for full competitor analysis, dependency graph, and JSON output shapes.

### Architecture Approach

v1.2 adds a parallel theme-config data path alongside the existing preset-config path. Theme is global (not per-preset) and flows: `config/plugins.ts` → Strapi config system → new `themeService.getTheme()` → `GET /tiptap-editor/theme` route → `useThemeConfig()` hook in `InnerEditor` → `colors[]` prop passed to `useTextColor` and `useHighlightColor` hooks → `ColorPickerPopover` component. Stylesheet injection uses a module-level flag inside `useThemeConfig` (Option B from ARCHITECTURE.md research) to guarantee single injection per page load while keeping the async fetch inside React context where `useFetchClient` is available.

**Major components:**
1. `shared/types.ts` (MODIFIED) — adds `TiptapThemeConfig { stylesheet?: string; colors?: Array<{ label: string; color: string }> }`; extends `TiptapPluginConfig` with `theme?`; extends `TiptapPresetConfig` with `textColor?`/`highlightColor?`; adds both keys to `PRESET_FEATURE_KEYS`
2. `server/src/services/theme.ts` + `server/src/controllers/theme.ts` + route (NEW) — standard triad following existing preset pattern; returns `TiptapThemeConfig | {}`; validates theme shape in `server/src/config/index.ts`
3. `admin/src/hooks/useThemeConfig.ts` (NEW) — fetches theme once per editor instance via `useFetchClient`; calls `injectStylesheetOnce` if `stylesheet` present; returns `{ colors, isLoading }`
4. `admin/src/utils/injectStylesheet.ts` (NEW) — module-level boolean flag + `data-tiptap-editor-theme` attribute guard; idempotent across HMR and multiple simultaneous editor instances
5. `admin/src/utils/buildExtensions.ts` (MODIFIED) — adds `TextStyle`+`Color` branch for `textColor`; adds `Highlight.configure({ multicolor: true })` branch for `highlightColor`; single `needsTextStyle` guard
6. `admin/src/components/ColorPickerPopover.tsx` (NEW) — shared swatch grid; receives `colors`, `currentColor`, `onColorSelect`, `onClear`; uses `@strapi/design-system` Popover; minimum 24×24px swatches
7. `admin/src/extensions/TextColor.tsx` + `HighlightColor.tsx` (NEW) — hooks following existing extension hook pattern; `useEditorState` for active color tracking; save/restore selection via `selectionRef` pattern from `Link.tsx`
8. `admin/src/components/RichTextInput.tsx` (MODIFIED) — calls `useThemeConfig` once (not inside each hook); passes `colors` to both color hooks; adds two `FeatureGuard` blocks to toolbar

See `.planning/research/ARCHITECTURE.md` for full data-flow diagrams, code templates for every new file, and the 10-step build order.

### Critical Pitfalls

1. **Color without TextStyle (Pitfall 13)** — `setColor()` silently no-ops if `TextStyle` is not registered in the extensions array. No error is thrown; the toolbar button appears to work but nothing changes in the document. Push `TextStyle` before `Color` whenever `textColor` is enabled. Write a unit test: `buildExtensions({ textColor: true })` must include both `textStyle` and `color` extension names in output.

2. **Highlight `multicolor: false` (Pitfall 14)** — The default `Highlight` configuration stores no `color` attribute in JSON. `setHighlight({ color: '#hex' })` is a silent no-op on the color value. Always use `Highlight.configure({ multicolor: true })`. Verify with a fixture round-trip: `{ type: 'highlight', attrs: { color: '#ffcc00' } }` must survive parse/serialize unchanged.

3. **Color picker steals ProseMirror selection (Pitfall 19)** — Clicking the picker trigger causes the editor to lose its text selection. By the time the user clicks a swatch, `setColor` runs on an empty cursor. Reuse the `selectionRef` pattern from `Link.tsx`: save selection on picker trigger mousedown, restore selection before calling `setColor` / `setHighlight`. Wrap trigger with `onMouseDown={(e) => e.preventDefault()}`. Never use native `<input type="color">` — it opens an OS dialog that reliably destroys ProseMirror selection.

4. **`PRESET_FEATURE_KEYS` sync drift (Pitfall 20)** — Adding `textColor`/`highlightColor` to `TiptapPresetConfig` without adding them to `PRESET_FEATURE_KEYS` allows typo keys in plugin config to pass validation silently. Must be updated in the same commit. Update `fixtures/all-features-payload.json` and `fixtures/all-features-preset.json` per CLAUDE.md requirements. Add compile-time check: `Record<keyof TiptapPresetConfig, true>` built from `PRESET_FEATURE_KEYS` — TypeScript errors if lists diverge.

5. **CSS variable tokens in stored color values (Pitfall 16)** — Storing `"color": "var(--brand-primary)"` in Tiptap JSON breaks any frontend renderer that does not load the theme stylesheet. Always store concrete hex/rgb values. The `theme.colors` array shape must enforce `{ label: string; color: string }` where `color` is always a resolved value, never a CSS variable token.

6. **TextStyle paste contamination (Pitfall 21)** — Registering `TextStyle` causes pasted content from Google Docs, Notion, or Word to accumulate unexpected `<span style="font-family: ...">` wrappers because Tiptap's `TextStyle` `parseHTML` captures browser-computed/inherited styles. Add a `transformPastedHTML` hook to `useEditor` that strips all `style` attributes from pasted HTML before Tiptap parses it. This is the correct behavior for a palette-constrained CMS editor.

See `.planning/research/PITFALLS.md` for the full 22-pitfall catalog, UX pitfalls, "looks done but isn't" checklists, and recovery strategies.

## Implications for Roadmap

Build order is determined by strict compile-time dependencies. Phases must not be reordered.

### Phase 1: Types and Preset Gating Foundation

**Rationale:** `shared/types.ts` and `PRESET_FEATURE_KEYS` have zero dependencies and are required by every downstream file. Closing the fixture maintenance requirement here (per CLAUDE.md) ensures no drift accumulates.
**Delivers:** `TiptapThemeConfig` type; `theme?` field on `TiptapPluginConfig`; `textColor?`/`highlightColor?` on `TiptapPresetConfig`; both keys in `PRESET_FEATURE_KEYS`; compile-time sync check; `fixtures/all-features-payload.json` updated with `textStyle` and `highlight` mark nodes; `fixtures/all-features-preset.json` updated with `"textColor": true, "highlightColor": true`.
**Addresses:** Table-stakes feature gating; CLAUDE.md fixture maintenance requirement
**Avoids:** Pitfalls 20 (PRESET_FEATURE_KEYS sync), fixture drift

### Phase 2: Server Theme Route

**Rationale:** The admin hook depends on the endpoint existing. Server work has no admin-layer dependencies and can be developed and tested independently.
**Delivers:** `server/src/services/theme.ts` (`getTheme()`); `server/src/controllers/theme.ts` (`find()`); `GET /tiptap-editor/theme` route in `server/src/routes/index.ts`; config validator extension for theme shape (`stylesheet` must be string, `colors` must be `string[]` if present).
**Uses:** Existing preset service/controller/route pattern verbatim
**Avoids:** Pitfall 18 (serve only `colors` array; stylesheet URL exposure to authenticated admin users is acceptable but should be documented)

### Phase 3: Admin Theme Hook and Stylesheet Injection Utility

**Rationale:** Depends on Phase 2 (route must exist). This utility layer is consumed by all UI components — must be in place before building the color picker.
**Delivers:** `useThemeConfig` hook using `useFetchClient`; `injectStylesheetOnce` util with module-level boolean flag and `data-tiptap-editor-theme` idempotency attribute; integration: `useThemeConfig` calls `injectStylesheetOnce(stylesheet)` after fetch resolves.
**Avoids:** Pitfalls 17 (duplicate stylesheet injection on HMR), 22 (document that relative stylesheet URLs resolve against the admin origin — use absolute URLs in production split-domain configs)

### Phase 4: Package Install and buildExtensions Registration

**Rationale:** Depends on Phase 1 (types). Extension registration must be verified independently before UI components are layered on top.
**Delivers:** `yarn add @tiptap/extension-text-style@3.20.1 @tiptap/extension-highlight@3.20.1`; `buildExtensions` branch for `textColor` (push `TextStyle` then `Color`); branch for `highlightColor` (push `Highlight.configure({ multicolor: true })`); single `needsTextStyle` guard; unit tests for both enabled and disabled combinations.
**Avoids:** Pitfalls 13 (Color without TextStyle), 14 (Highlight multicolor: false), double-registration of TextStyle

### Phase 5: ColorPickerPopover Component

**Rationale:** Depends on Phase 3 (theme hook provides `colors`). Pure UI component with no editor dependency — can be built and tested in isolation with a mock colors array before hooks wire it to editor commands.
**Delivers:** `ColorPickerPopover` with swatch grid, active-state indicator (highlighted swatch for current color), "clear/remove" option, minimum 24×24px swatch targets, accessible labels from `theme.colors[n].label`.
**Avoids:** Pitfall 19 partially (swatch-grid popover avoids the OS color dialog problem; selection save/restore is completed in Phase 6)

### Phase 6: useTextColor and useHighlightColor Hooks

**Rationale:** Depends on Phases 4 (extensions registered) and 5 (component exists). The `selectionRef` save/restore pattern is the critical correctness requirement for this phase.
**Delivers:** `useTextColor` hook with `useEditorState` active-color tracking and `selectionRef` save/restore pattern; `useHighlightColor` hook with identical structure; `transformPastedHTML` hook added to `useEditor` options to strip inherited inline styles from pasted content.
**Avoids:** Pitfalls 19 (selection theft — save selection on trigger mousedown, restore before setColor), 21 (TextStyle paste contamination)

### Phase 7: RichTextInput Wiring and End-to-End Integration

**Rationale:** Final integration phase. Only two changes: call `useThemeConfig` once in `InnerEditor`, add two `FeatureGuard` blocks to toolbar JSX.
**Delivers:** End-to-end working color pickers for text color and highlight color; `useThemeConfig` called once in `InnerEditor` with `colors` passed as prop to both hooks (not fetched inside each hook); stylesheet injected at first editor mount via module-level flag.
**Avoids:** Architecture anti-pattern of calling `useThemeConfig` inside each color hook (two network requests); anti-pattern of injecting stylesheet per-editor-mount (duplicate link tags)

### Phase 8: Verification and Fixture Completion

**Rationale:** Manual verification with a real Strapi instance. Closes all "looks done but isn't" checklist items from PITFALLS.md.
**Delivers:** End-to-end confirmed: color round-trips through Tiptap JSON, stylesheet link present in document head, color resets with unset command, active-state swatch highlights correctly, preset without color features shows no picker; all 11 items in the v1.2 PITFALLS.md completion checklist cleared.

### Phase Ordering Rationale

- Types before everything — all other files import from `shared/types.ts`
- Server before admin hook — hook hits an endpoint that must exist
- Admin hook before color picker components — components receive `colors` from the hook
- Package install and extension registration before hooks — hooks query extension state via `useEditorState`
- Component before hooks — hooks render the component
- Wiring last — integrates all prior phases; changing it does not cascade to earlier phases

### Research Flags

Phases with well-documented patterns (skip additional research):
- **Phase 1:** Established project pattern; matches every prior feature addition
- **Phase 2:** Direct replication of existing preset service/controller/route triad
- **Phase 4:** Extension registration verified against authoritative Tiptap docs and confirmed behavior

Phases that may need targeted investigation during implementation:
- **Phase 3:** Verify `useFetchClient` does not trigger on every render in `useThemeConfig` (add `[]` dependency to `useEffect`; confirmed in ARCHITECTURE.md code template but worth double-checking). If split-domain deployment support is needed, investigate how to obtain the Strapi backend base URL for resolving relative stylesheet paths.
- **Phase 5:** Confirm exact `@strapi/design-system@2.2.0` Popover component props for positioning and trigger pattern — noted as MEDIUM confidence in STACK.md; verify at implementation time before building the full component.
- **Phase 6:** Verify that `unsetColor` does not strip other `TextStyle` attributes at `@tiptap/extension-text-style@3.20.1` (Pitfall 15 — historical bug, fix confirmed in 2.x PRs, but regression should be tested before shipping).

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Both new packages verified against official Tiptap docs at v3.20.1; existing libraries sufficient for all other capabilities; `@strapi/design-system@2.2.0` Popover API is MEDIUM (not verified at exact version) |
| Features | HIGH | All features verified against Tiptap docs and npm; official Tiptap UI picker components confirmed to lack custom-colors support — custom component is the only viable path |
| Architecture | HIGH | Data flow and component boundaries derived from direct codebase inspection; all patterns reference existing verified implementations; only uncertainty is exact `getFetchClient` outside React context (mitigated by Option B: keep fetch inside hook) |
| Pitfalls | HIGH for Tiptap extension behavior; MEDIUM for paste contamination and stylesheet injection | TextStyle/Highlight behavior verified against official docs and closed GitHub issues; paste contamination bug (Pitfall 21) is an open GitHub issue — mitigation confirmed, upstream fix status at 3.20.1 unverified |

**Overall confidence:** HIGH

### Gaps to Address

- **`@strapi/design-system@2.2.0` Popover exact API:** Verify trigger prop, positioning, and open/close control during Phase 5. The approach is sound but exact component API for this version was not confirmed from official docs.

- **`transformPastedHTML` scope decision:** Stripping all inline `style` attributes from pasted HTML is conservative and correct for a palette-constrained editor, but it also removes any intentionally pasted inline styles (e.g., from an internal CMS). Confirm this trade-off is acceptable for the target use case before implementing.

- **Stylesheet URL resolution for split-domain deployments:** Pitfall 22 identifies that relative `stylesheet` URLs resolve against the admin origin. For single-domain Strapi deployments this is not a concern. Document as a known limitation and prefer absolute URLs in the theme config `stylesheet` field. Flag for future work if split-domain support becomes a requirement.

- **`unsetColor` regression verification:** Pitfall 15 flags a historical `removeEmptyTextStyle` bug (confirmed fixed). Run a targeted regression test before shipping: apply text color, then call `unsetColor` — verify no other inline styles (bold, etc.) are removed from the selection.

## Sources

### Primary (HIGH confidence)
- Tiptap Color extension docs — `import { Color } from '@tiptap/extension-text-style'`; TextStyle requirement; `setColor`/`unsetColor` API
- Tiptap Highlight extension docs — `multicolor: true` configuration; `setHighlight({ color })`/`unsetHighlight()` API; color attribute in JSON
- Tiptap TextStyle extension docs — mark behavior; `removeEmptyTextStyle` command; paste behavior
- Tiptap TextStyleKit docs — confirmed TextStyleKit bundles Color; individual packages are preferred for minimal schema footprint
- Tiptap StarterKit docs — confirmed StarterKit includes neither TextStyle nor Highlight
- Strapi Admin Panel API docs — `register()` and `bootstrap()` lifecycle; no `app.addStylesheet()` API exists
- Direct codebase inspection: `shared/types.ts`, `buildExtensions.ts`, `RichTextInput.tsx`, `usePresetConfig.ts`, `Link.tsx` (selectionRef pattern), `server/src/config/index.ts`, `server/src/services/preset.ts`, `server/src/controllers/preset.ts`, `server/src/routes/index.ts`, `admin/src/index.ts`

### Secondary (MEDIUM confidence)
- Tiptap GitHub issue #4311 + PRs #5836/#5905/#5909 — `unsetColor`/`removeEmptyTextStyle` bug, confirmed fixed
- Tiptap GitHub issue #6102 — TextStyle paste contamination (open issue; mitigation pattern confirmed)
- Tiptap GitHub issue #2334 — native `<input type="color">` destroys ProseMirror selection
- Tiptap GitHub discussion #4963 — selection preservation with external UI elements
- Tiptap UI Components docs — ColorTextPopover and ColorHighlightPopover confirmed to use internal `TEXT_COLORS` constant (no custom colors prop)
- Strapi Community Forum — DOM stylesheet injection pattern in `register()`/`bootstrap()` lifecycle
- npm search results — `@tiptap/extension-text-style@3.20.1` and `@tiptap/extension-highlight@3.20.1` confirmed as current versions

### Tertiary (LOW confidence)
- Web search corroboration of CSS variable tokens in inline styles breaking cross-renderer portability — general web behavior, not source-specific

---
*Research completed: 2026-03-16*
*Ready for roadmap: yes*
