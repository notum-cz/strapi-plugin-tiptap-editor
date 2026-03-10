# Project Research Summary

**Project:** Strapi Plugin Tiptap Editor — Preset Configuration System
**Domain:** Strapi 5 plugin milestone — adding a preset config layer to an existing custom field plugin
**Researched:** 2026-03-10
**Confidence:** HIGH

## Executive Summary

This milestone adds a preset configuration system to an existing Strapi 5 + Tiptap 3 rich text editor plugin. The core challenge is a two-layer architecture: developer-defined presets live on the server (as Strapi plugin config), while the Tiptap extensions that implement them are live JavaScript objects that cannot serialize over HTTP. The solution is a descriptor pattern — the server stores and serves plain JSON config objects, and the admin maps those descriptors to real Tiptap extension instances at editor init time. The entire system is already designed: a compiled dist artifact contains a substantially complete reference implementation (types, server service/controller/routes, admin hook/components, toolbar auto-detection) — the milestone is rewriting source to match it.

The recommended approach, confirmed by inspecting the dist, diverges from the original PROJECT.md spec in one key area: presets are configured via standard Strapi plugin config (`config/plugins.ts`) rather than a `registerPresets()` function call. This is the correct, idiomatic approach — it uses `strapi.config.get('plugin::tiptap-editor')` read at server init, validates at boot, and eliminates the timing risks of a custom registration call. The dist also established `MINIMAL_PRESET_CONFIG` (not the full extension set) as the fallback for unconfigured fields, which is the better UX choice because it visibly prompts developers to configure a preset.

The top risks are: (1) StarterKit cannot be partially removed — all its features must be disabled via `.configure()` rather than omitting the extension, otherwise the editor silently loses its core document structure; (2) the extensions array passed to `useEditor` must be memoized on the preset name string, not derived from the config object, or editor re-creation on every render will lose unsaved content; (3) extension hooks that call `useEditorState` with Tiptap commands must guard against the extension being absent, or the entire Strapi admin panel page crashes. All three have clear prevention strategies documented below.

## Key Findings

### Recommended Stack

The existing stack is unchanged. No new dependencies are required — all needed APIs are already present in installed packages. The milestone adds new source files and refactors existing ones using APIs already available.

**Core technologies:**
- **Strapi 5.35.0**: Host CMS; plugin config system (`strapi.config.get`) is the authoritative preset store; admin routes (`type: 'admin'`) are the correct way to expose plugin data to the admin panel
- **@tiptap/core + @tiptap/react 3.19.0**: Extension type system; `.configure()` factory pattern is required for per-preset extension instances; extension objects are not JSON-serializable
- **TypeScript 5.9.3**: `TiptapPreset`, `TiptapPresetConfig`, `ExtensionName` must be exported from the server entry point so host app developers get compile-time validation
- **useFetchClient (@strapi/admin/admin)**: The only correct admin-to-server HTTP client — automatically attaches JWT, handles abort on unmount; `fetch()` will fail silently without auth headers
- **React 18.3.1**: Rules of hooks apply to all extension hooks — conditional hook calls are illegal; use `enabled` flag pattern instead

**Key constraint confirmed from type definitions:** `useFetchClient` is verified exported from `@strapi/admin/admin` (5.35.0 public `index.d.ts`). Route type `admin` is verified in `@strapi/types` 5.35.0. `useFetchClient` is the only documented public hook for admin-to-server communication.

### Expected Features

The dist artifact is the ground truth for what to build. It contains a complete first-pass design with all features implemented.

**Must have (table stakes):**
- `shared/types.ts` with `TiptapPresetConfig` and `TiptapPluginConfig` — everything else depends on these
- `featureToggle` utilities (`isFeatureEnabled`, `getFeatureOptions`) — used by both `buildExtensions` and all extension hooks
- Server config validator — presets validated at boot with human-readable error messages
- `GET /tiptap-editor/presets` and `GET /tiptap-editor/presets/:name` routes — admin fetches from these
- `buildExtensions(config)` — maps `TiptapPresetConfig` to live Tiptap `Extension[]`; core of client-side preset resolution
- Extension hook updates — each hook accepts config param and returns null buttons when feature is disabled
- `usePresetConfig` hook — fetches preset config once at mount using `useFetchClient`
- `PresetSelect` dropdown in Content-Type Builder — populated from `GET /presets`
- `RichTextInput` preset-aware rewrite — replaces static extension list with `buildExtensions` output
- `BaseTiptapInput` minimal mode notice — shows message when no preset configured
- Backward compatibility — existing fields with no stored preset fall back to `MINIMAL_PRESET_CONFIG`

**Should have (differentiators):**
- Per-feature options pass-through (`heading: { levels: [2, 3] }`) — richer than boolean toggle
- SEO tag control on headings via `HeadingWithSEOTag` — already supported, must survive preset system
- Auto-sizing toolbar spacers via `hasVisibleItems()` — no orphan separators in minimal presets
- `findOne` preset route — enables richer admin UX in future passes
- Preset validation with specific human-readable error messages at boot

**Defer (v2+):**
- Translations for new UI strings — hardcoded English strings are acceptable for this milestone
- `underline` exposure as a togglable preset key — present in toolbar but absent from `TiptapPresetConfig` type; address in a later pass
- Visual preset builder in admin UI — target audience is developers, code config is correct DX
- Hot-reload of presets without server restart — presets are static per server lifecycle by design

**Anti-features confirmed:** Do NOT implement `registerPresets()` function (replaced by Strapi config), preset inheritance/composition (adds edge cases with unclear benefit), or per-user preset selection (presets are content-modeling decisions).

### Architecture Approach

The architecture spans two physical layers bridged by HTTP. The server holds presets in Strapi plugin config and exposes them via two admin routes. The admin fetches preset config once at editor mount, resolves extension descriptors to live Tiptap objects via a static registry, and passes them to `useEditor`. Toolbar hooks receive an `enabled` flag derived from the active preset rather than being called conditionally (which would violate React rules of hooks).

**Major components:**
1. **Strapi plugin config + validator** (`server/src/config/index.ts`) — preset storage and boot-time validation; reads `config/plugins.ts` in host app via `strapi.config.get('plugin::tiptap-editor')`
2. **Preset service + controller + routes** (`server/src/services/preset.ts`, `controllers/preset.ts`, `routes/index.ts`) — exposes preset list and individual preset data to admin via `GET /tiptap-editor/presets` and `GET /tiptap-editor/presets/:name`
3. **`shared/types.ts`** — `TiptapPresetConfig`, `TiptapPluginConfig`, `PRESET_FEATURE_KEYS`; the type contract between all components; exported from server entry point for host app use
4. **`admin/src/utils/buildExtensions.ts`** — maps `TiptapPresetConfig` to `Extension[]`; always includes StarterKit (with per-feature `.configure()` options), never omits it entirely
5. **`admin/src/utils/featureToggle.ts`** — `isFeatureEnabled(value)` and `getFeatureOptions(value, default)`; treats absent keys as enabled (default = full feature set)
6. **`admin/src/hooks/usePresetConfig.ts`** — fetches preset once on mount, falls back to `MINIMAL_PRESET_CONFIG` on any error or missing name; never returns null to `buildExtensions`
7. **`admin/src/components/PresetSelect.tsx`** — CTB dropdown for preset selection; populates from `GET /presets`; stores selected name in `attribute.options.preset`
8. **Extension hooks (refactored)** — each accepts `config: TiptapPresetConfig`; returns null for buttons when feature is disabled; always called unconditionally

**CTB integration approach:** Register `preset` as a `select` option in the admin `richTextField.options.advanced` array using a type assertion (`'preset' as CustomFieldOptionName`). The underlying Strapi CTB code stores any string in `attribute.options[name]`; the TypeScript constraint is compile-time only. This is Path A (low risk) from the ARCHITECTURE.md analysis.

### Critical Pitfalls

1. **StarterKit must always be included — disable features via `.configure()`, never by omission** — `bold`, `italic`, `bulletList`, etc. are StarterKit internal marks. Omitting StarterKit silently removes `Document`, `Paragraph`, and `Text` nodes; the editor mounts but shows no content and has no cursor. `buildExtensions` must always pass StarterKit with per-feature flags.

2. **Extensions array passed to `useEditor` must be memoized on preset name string, not config object** — a new array reference on every render triggers editor re-creation (Tiptap v3 behavior), losing unsaved content and cursor position. Use `useMemo(() => buildExtensions(config), [presetName])` where `presetName` is a string, not the config object (whose identity changes on every fetch response parse).

3. **Extension hooks that call `useEditorState` crash when their extension is absent** — `editor.can().chain().insertTable()` throws when Table is not loaded. Guards required: either check `extensionManager.extensions.some(e => e.name === 'table')` in the selector, or (preferred) pass `enabled: boolean` to each hook and skip all selector calls when `false`. Add React error boundaries around `BaseTiptapInput` before implementing conditional loading.

4. **Use Strapi plugin config exclusively — do not implement `registerPresets()` alongside it** — the dist confirms the correct pattern is `strapi.config.get('plugin::tiptap-editor')`. Two parallel registration mechanisms with different timing create a hard-to-debug empty presets list.

5. **`usePresetConfig` must never return null — always fall back to `MINIMAL_PRESET_CONFIG`** — stored preset names will drift from server config across environments and after refactoring. Server `getPreset(name)` must return the default when name is missing; the hook must return `MINIMAL_PRESET_CONFIG` on any 404 or fetch failure.

## Implications for Roadmap

The dependency graph is deterministic. Each phase unlocks the next. Implementation follows the order established by the dist's internal structure.

### Phase 1: Type Foundation
**Rationale:** Every other component depends on `TiptapPresetConfig`, `TiptapPluginConfig`, and `PRESET_FEATURE_KEYS`. Writing these first means all subsequent phases have compile-time contracts from the start.
**Delivers:** `shared/types.ts` with full type definitions; exported from server entry point; `featureToggle.ts` utilities (`isFeatureEnabled`, `getFeatureOptions`).
**Addresses:** TypeScript export surface (table stakes), `featureToggle` undefined handling (Pitfall 13).
**Avoids:** Drift between what server exposes and what admin consumes — both import from the same shared types.

### Phase 2: Server Config and Routes
**Rationale:** The admin cannot function without preset data from the server. Getting the server layer working and verifiable (via curl/REST client) before touching the admin eliminates one variable when debugging the integration.
**Delivers:** `server/src/config/index.ts` with validator; preset service; `GET /presets` and `GET /presets/:name` routes under `type: 'admin'`; startup validation errors with human-readable messages.
**Uses:** Strapi named routes (`type: 'admin'`), controller factory pattern, `strapi.config.get`.
**Avoids:** Config vs. `registerPresets()` mechanism confusion (Pitfall 4); auth exposure via content-api routes (Pitfall 5); boot crash from opaque validator errors (Pitfall 9).

### Phase 3: Core Admin Utilities
**Rationale:** `buildExtensions` and `usePresetConfig` are the admin-side foundation. They can be written and tested independently before touching `RichTextInput` or any existing hooks.
**Delivers:** `admin/src/utils/buildExtensions.ts` (maps config to `Extension[]`, always includes StarterKit, passes `heading: false` to StarterKit and adds `HeadingWithSEOTag` separately); `admin/src/hooks/usePresetConfig.ts` (fetches once on mount, returns `MINIMAL_PRESET_CONFIG` on failure).
**Avoids:** StarterKit partial omission (Pitfall 1); duplicate heading extension (Pitfall 8); null returned to buildExtensions (Pitfall 7); bare `fetch()` without auth (Pitfall 10).

### Phase 4: Extension Hook Refactor
**Rationale:** Existing hooks call `useEditorState` assuming all extensions are loaded. This is a crash risk when a preset excludes an extension. Hooks must be refactored to accept an `enabled` flag before `RichTextInput` can use them with partial presets.
**Delivers:** All extension hooks (`useStarterKit`, `useHeading`, `useLink`, `useTable`, `useTextAlign`, `useScript`) accept `config: TiptapPresetConfig`; return null for all buttons when feature is disabled; `useEditorState` selectors guarded against missing extensions.
**Avoids:** `useEditorState` crash on missing extension (Pitfall 3); table button rendering with no Table extension (Pitfall 11).
**Note:** Add React error boundary around `BaseTiptapInput` in this phase as a safety net before conditional loading is live.

### Phase 5: RichTextInput Integration
**Rationale:** With all utilities and hooks ready, the final wiring can happen. `RichTextInput` is the component that coordinates everything — it reads `props.attribute.options.preset`, fetches config via `usePresetConfig`, builds extensions, and passes `enabled` flags to each hook.
**Delivers:** Preset-aware `RichTextInput`; memoized extensions array on `presetName` string; loading skeleton during fetch; `BaseTiptapInput` minimal mode notice; backward compatibility for fields with no stored preset.
**Avoids:** Extension array instability causing content loss (Pitfall 2); null editor during async fetch (Pitfall 6).

### Phase 6: Content-Type Builder Integration
**Rationale:** Last because it depends on the server route (Phase 2) for the preset list and on `RichTextInput` being preset-aware (Phase 5) so the field actually respects the stored choice.
**Delivers:** `PresetSelect` component; `preset` option registered in `richTextField.options.advanced`; preset name persisted as `attribute.options.preset`; Content-Type Builder dropdown shows available presets.
**Avoids:** Preset rename breaking stored fields (Pitfall 12) — document preset names as stable identifiers in the same phase.

### Phase Ordering Rationale

- Types before everything: no other component can be typed correctly without `TiptapPresetConfig`.
- Server before admin: the admin integration cannot be verified without a working API to call.
- Utilities before RichTextInput: `buildExtensions` and `usePresetConfig` are independently testable; refactoring `RichTextInput` before they exist means working blind.
- Hook refactor before RichTextInput: conditional rendering requires hooks that accept `enabled`; doing both in one phase risks conflating two failure modes during debugging.
- CTB last: it is the user-facing entry point, but it depends on everything else being correct.

### Research Flags

Phases with well-documented patterns — standard implementation, no additional research needed:
- **Phase 1 (Types):** Pure TypeScript, verified types exist in dist as reference.
- **Phase 2 (Server):** Route and controller patterns verified from `@strapi/types` 5.35.0 type definitions; dist server code is the reference implementation.
- **Phase 3 (Admin utilities):** `useFetchClient` API verified; `buildExtensions` logic fully visible in dist chunk.
- **Phase 5 (RichTextInput):** Reference implementation exists in `dist/_chunks/RichTextInput-ugq1Ypmj.js`.

Phases that may benefit from deeper investigation during planning:
- **Phase 4 (Extension hooks):** The `enabled` flag pattern is clear, but verifying that all `useEditorState` selectors are safe when extension is absent requires reading each hook file carefully. Recommend reading each hook before writing to avoid missing a guarded path.
- **Phase 6 (CTB integration):** `CustomFieldOptionName` type assertion approach is confirmed workable by pattern analysis, but the exact CTB rendering behavior for a `select` option type should be verified against a running Strapi instance early in the phase. This is the highest-risk implementation question identified in ARCHITECTURE.md.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All API signatures verified from installed package type definitions at exact installed versions |
| Features | HIGH | Derived from dist artifact — a first-party reference implementation, not documentation |
| Architecture | HIGH | Verified from type definitions for Strapi and Tiptap APIs; CTB option registration is MEDIUM due to runtime behavior uncertainty |
| Pitfalls | HIGH (codebase-specific), MEDIUM (framework-level) | Codebase pitfalls derived from direct code inspection; Tiptap v3 `useEditor` re-creation behavior and Strapi 5 config system timing are MEDIUM — training knowledge aligned with observed type shapes |

**Overall confidence:** HIGH

### Gaps to Address

- **Admin route URL prefix (runtime behavior):** Verified that admin routes are prefixed with `/[plugin-id]/` from type definitions, but the exact prefix (`/api/tiptap-editor/` vs `/tiptap-editor/`) is a runtime concern not confirmable from types alone. Validate by running the server and hitting the endpoint in Phase 2 before writing the admin fetch URL.

- **Content-Type Builder `select` option rendering:** The `CustomFieldOption` with `type: 'select'` and a type-asserted `name` string is confirmed as the correct approach, but whether the CTB renders it as a populated dropdown (vs. a text input) needs a quick prototype at the start of Phase 6. This is the single highest-risk implementation question.

- **Custom field `options` schema persistence:** It is not confirmed from type definitions alone whether Strapi 5 automatically roundtrips arbitrary keys in `attribute.options` through Content-Type Builder schema saves. This should be verified concretely in Phase 6 by storing `preset: 'test'` and confirming it survives a save/reload cycle.

- **`featureToggle` absent-key behavior:** `isFeatureEnabled(undefined)` must return `true` (absent = default = enabled) for the empty-preset fallback to work correctly. This is documented in the dist type but must be explicitly tested in Phase 3.

## Sources

### Primary (HIGH confidence)
- `dist/shared/types.d.ts` — canonical `TiptapPresetConfig`, `TiptapPluginConfig`, `PRESET_FEATURE_KEYS` type definitions
- `dist/_chunks/RichTextInput-ugq1Ypmj.js` — complete reference implementation of `buildExtensions`, `usePresetConfig`, `MINIMAL_PRESET_CONFIG`, preset-aware toolbar rendering
- `dist/admin/index.js` — `PresetSelect` component and field options registration pattern
- `dist/server/index.js` — server-side preset service, controller, routes, config validator
- `node_modules/@strapi/types@5.35.0/dist/plugin/config/strapi-server/routes.d.ts` — named route notation, `type: 'admin'`
- `node_modules/@strapi/types@5.35.0/dist/plugin/config/strapi-server/controllers.d.ts` — controller factory function pattern
- `node_modules/@strapi/admin@5.35.0/dist/admin/src/hooks/useFetchClient.d.ts` — `useFetchClient` API and public export
- `node_modules/@tiptap/core@3.19.0/dist/index.d.ts` — `configure()` method signatures, `AnyExtension` type
- `node_modules/@tiptap/starter-kit@3.19.0/dist/index.d.ts` — `StarterKitOptions` with sub-extension keys

### Secondary (MEDIUM confidence)
- `node_modules/@strapi/admin/dist/admin/src/core/apis/CustomFields.d.ts` — `CustomFieldOptions`, `CustomFieldOptionName` constraint (runtime rendering behavior not confirmed)
- `.planning/PROJECT.md` — requirements, constraints, key architectural decisions
- `.planning/codebase/ARCHITECTURE.md` — existing codebase baseline
- `.planning/codebase/CONCERNS.md` — missing error boundaries, `useEditorState` re-render risks

### Tertiary (MEDIUM — training knowledge)
- Tiptap v3 `useEditor` extension array stability behavior — aligned with observed type shapes but not verified against Tiptap 3.19.0 docs
- Strapi 5 plugin config system timing (`strapi.config.get`, validator call order at boot)

---
*Research completed: 2026-03-10*
*Ready for roadmap: yes*
