# Requirements: Strapi Plugin Tiptap Editor — Preset Configuration System

**Defined:** 2026-03-10
**Core Value:** Content managers get a tailored editor with only the tools relevant to their content type, configured once by developers using native Strapi plugin config.

## v1 Requirements

### Types

- [x] **TYPES-01**: Plugin exports a `TiptapPresetConfig` TypeScript type where each Tiptap feature key maps to `boolean | options-object` (e.g. `bold: true`, `heading: { levels: [2, 3] }`)
- [x] **TYPES-02**: Plugin exports a `TiptapPluginConfig` TypeScript type representing the full plugin config shape at `plugin::tiptap-editor` in `config/plugins.ts`
- [x] **TYPES-03**: Plugin exports a `PRESET_FEATURE_KEYS` constant listing all valid preset feature names
- [x] **TYPES-04**: Plugin exports `isFeatureEnabled(value)` utility — returns `true` when value is truthy or `undefined` (absent key = feature enabled by default)
- [x] **TYPES-05**: Plugin exports `getFeatureOptions(value, defaults)` utility — returns options object merged with defaults when value is an object, or defaults when value is `true`/`undefined`, or `null` when `false`

### Server

- [x] **SERVER-01**: Plugin config validator runs at Strapi boot and emits human-readable error messages for invalid preset feature keys (names the invalid keys and shows the allowed set)
- [x] **SERVER-02**: `GET /tiptap-editor/presets` route returns an array of available preset names; route requires no auth (auth: false)
- [x] **SERVER-03**: `GET /tiptap-editor/presets/:name` route returns the full `TiptapPresetConfig` object for the named preset; returns `MINIMAL_PRESET_CONFIG` when name is not found
- [x] **SERVER-04**: Routes use `type: 'admin'` to be accessible from the Strapi admin panel

### Admin Utilities

- [x] **UTILS-01**: `buildExtensions(config: TiptapPresetConfig)` maps a preset config to a Tiptap `Extension[]` array
- [x] **UTILS-02**: `buildExtensions` always includes StarterKit — sub-features (bold, italic, etc.) disabled via `.configure()` never by omitting StarterKit
- [x] **UTILS-03**: `buildExtensions` adds `HeadingWithSEOTag` separately when heading is enabled (StarterKit's built-in heading is disabled to avoid duplication)
- [x] **UTILS-04**: `usePresetConfig(presetName: string | undefined)` hook fetches preset config once on mount using `useFetchClient` from `@strapi/admin`
- [x] **UTILS-05**: `usePresetConfig` returns `MINIMAL_PRESET_CONFIG` (`{ bold: true, italic: true }`) on any fetch failure, 404, or when preset name is empty/undefined

### Extension Hooks

- [x] **HOOKS-01**: All extension hooks (`useStarterKit`, `useHeading`, `useLink`, `useTable`, `useTextAlign`, `useScript`) accept `config: TiptapPresetConfig` as a parameter
- [x] **HOOKS-02**: Each extension hook returns `null` for all toolbar buttons when its feature is disabled in the config
- [x] **HOOKS-03**: `useEditorState` selectors in each hook are guarded — they do not throw when their extension is absent from the editor
- [x] **HOOKS-04**: A React error boundary wraps `BaseTiptapInput` so editor crashes do not propagate to the Strapi admin panel

### Editor Integration

- [x] **EDITOR-01**: `RichTextInput` reads `attribute.options.preset` to determine which preset to load
- [x] **EDITOR-02**: The extensions array passed to `useEditor` is memoized on the preset name string (not the config object) to prevent editor re-creation on re-render
- [x] **EDITOR-03**: `RichTextInput` shows a loading skeleton while the preset config is being fetched
- [x] **EDITOR-04**: `BaseTiptapInput` displays a "No editor preset configured — showing minimal editor" notice when no preset is set
- [x] **EDITOR-05**: Existing fields with no `options.preset` stored in schema continue to render correctly using `MINIMAL_PRESET_CONFIG` (backward compatibility)

### Content-Type Builder

- [x] **CTB-01**: `PresetSelect` dropdown component fetches preset names from `GET /tiptap-editor/presets` and renders them as options
- [x] **CTB-02**: The `preset` option is registered in `richTextField.options.advanced` in the admin field definition so it appears in Content-Type Builder field configuration
- [x] **CTB-03**: The selected preset name is persisted to `attribute.options.preset` in the content-type schema

## v2 Requirements

### Polish

- **I18N-01**: Translate new UI strings (`"Editor Preset"`, `"No editor preset configured — showing minimal editor"`) using the existing react-intl translation system
- **TYPES-06**: Expose `underline` as a togglable key in `TiptapPresetConfig` (currently in toolbar but absent from the type surface)

### Advanced Configuration

- **SERVER-05**: Preset validation emits warnings (not errors) for unknown extension options within a valid feature key
- **CTB-04**: Content-Type Builder shows a preview of which toolbar buttons will be visible for the selected preset

## Out of Scope

| Feature | Reason |
|---------|--------|
| Visual preset builder in admin UI | Developer-facing feature; code-based config in `config/plugins.ts` is the correct DX |
| `registerPresets()` function export | Replaced by standard Strapi plugin config; two parallel registration mechanisms create invisible bugs |
| Preset inheritance / composition | Adds circular-ref and merge-semantics edge cases with unclear benefit; duplicate config keys instead |
| Per-user preset selection | Presets are content-modeling decisions, not personal preferences |
| Hot-reload of presets without server restart | Presets are static per server lifecycle; document clearly that restart is required |
| Custom/third-party extension upload | Extensions must be bundled; dynamic code loading in admin is a security risk |
| Auth on preset routes | Preset config is not sensitive; `auth: false` is the correct and simpler approach |
| Default preset = full tool set | MINIMAL_PRESET_CONFIG fallback is the deliberate design — it prompts developers to configure rather than silently using all tools |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| TYPES-01 | Phase 1 | Complete |
| TYPES-02 | Phase 1 | Complete |
| TYPES-03 | Phase 1 | Complete |
| TYPES-04 | Phase 1 | Complete |
| TYPES-05 | Phase 1 | Complete |
| SERVER-01 | Phase 1 | Complete |
| SERVER-02 | Phase 1 | Complete |
| SERVER-03 | Phase 1 | Complete |
| SERVER-04 | Phase 1 | Complete |
| UTILS-01 | Phase 2 | Complete |
| UTILS-02 | Phase 2 | Complete |
| UTILS-03 | Phase 2 | Complete |
| UTILS-04 | Phase 2 | Complete |
| UTILS-05 | Phase 2 | Complete |
| HOOKS-01 | Phase 2 | Complete |
| HOOKS-02 | Phase 2 | Complete |
| HOOKS-03 | Phase 2 | Complete |
| HOOKS-04 | Phase 2 | Complete |
| EDITOR-01 | Phase 3 | Complete |
| EDITOR-02 | Phase 3 | Complete |
| EDITOR-03 | Phase 3 | Complete |
| EDITOR-04 | Phase 3 | Complete |
| EDITOR-05 | Phase 3 | Complete |
| CTB-01 | Phase 3 | Complete |
| CTB-02 | Phase 3 | Complete |
| CTB-03 | Phase 3 | Complete |

**Coverage:**
- v1 requirements: 26 total
- Mapped to phases: 26
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-10*
*Last updated: 2026-03-10 after roadmap creation*
