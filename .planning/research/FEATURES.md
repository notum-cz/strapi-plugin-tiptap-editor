# Feature Landscape

**Domain:** Editor preset configuration system for a Strapi 5 + Tiptap 3 custom field plugin
**Researched:** 2026-03-10
**Confidence:** HIGH — findings derived entirely from codebase inspection (source files + compiled dist artifacts), which reveals both the intended design and partial implementation.

---

## Research Method Note

Web search was unavailable during this research session. All findings come from:

1. Source files in `admin/src/` and `server/src/` (current branch state)
2. Compiled dist artifacts in `dist/` (built from a previous iteration or spike — substantially ahead of source)
3. `dist/shared/types.d.ts` — fully-typed preset config interface
4. `dist/_chunks/RichTextInput-ugq1Ypmj.js` — full working implementation of `buildExtensions`, `usePresetConfig`, preset-aware toolbar rendering
5. `dist/admin/index.js` — `PresetSelect` component and field `options` registration
6. `dist/server/index.js` — preset service, controller, routes, config validator

The compiled dist is the ground truth for "what has already been designed and partially built." The source tree is behind it. This research characterizes features accordingly.

---

## What the Dist Reveals (Pre-Built Design)

The dist contains a complete first-pass design for the preset system. Key characteristics already locked in:

- **Config-object model** (not array-of-descriptors): Presets are `Record<string, TiptapPresetConfig>` at `plugin::tiptap-editor.presets` in Strapi config. Each preset is a plain object where each key is a Tiptap feature name and the value is `boolean | options-object`.
- **Strapi plugin config** (not `registerPresets()` function): Configuration lives in `config/plugins.ts` via Strapi's standard `strapi.config.get()` path — not a runtime registration call.
- **Two API routes**: `GET /tiptap-editor/presets` (list names) and `GET /tiptap-editor/presets/:name` (get full config object for one preset).
- **Field option stored as**: `options.preset` string on the field schema.
- **Fallback behavior**: Missing/empty preset name → `MINIMAL_PRESET_CONFIG` (`{ bold: true, italic: true }`) — not the full default set. This is a deliberate design choice diverging from PROJECT.md's "default preset = full tool set."
- **Toolbar auto-detection**: Each extension hook receives the `TiptapPresetConfig` and conditionally renders toolbar buttons. Extension hooks return `null`-able elements when the feature is disabled. `hasVisibleItems()` drives spacer visibility.
- **"Minimal mode" indicator**: When no preset is configured, the editor shows a notice "No editor preset configured — showing minimal editor" — a UX affordance for content managers.

---

## Table Stakes

Features users (developers and content managers) require for the preset system to be usable at all. Missing any of these = the feature is broken or confusing.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Named preset lookup by key** | Content managers select a preset by name; the editor must fetch and apply that exact config | Low | Already implemented in dist: `GET /presets/:name` + `usePresetConfig` |
| **Preset list in Content-Type Builder dropdown** | Without this, content managers can't select a preset when creating a field | Low | Already implemented in dist: `PresetSelect` component fetched from `GET /presets` |
| **Toolbar shows only extensions in active preset** | Fundamental value prop — a "minimal" editor with all buttons defeats the purpose | Medium | Already implemented in dist: hooks accept config, conditionally return null buttons |
| **Graceful fallback when preset missing** | Stored preset name may vanish after config change; editor must not crash | Low | Already implemented in dist: falls back to `MINIMAL_PRESET_CONFIG` |
| **Backward compatibility for fields with no preset** | Existing TipTap fields have no `options.preset` — they must still render | Low | Implemented: empty/null preset name triggers minimal mode |
| **Per-extension enable/disable toggles** | Developer must be able to include or exclude each bundled extension | Low | Implemented via `boolean` values in `TiptapPresetConfig` |
| **Serializable config over HTTP** | Preset config passes through REST API; must survive JSON round-trip | Low | Already guaranteed by `TiptapPresetConfig` shape (no functions) |
| **Config validation at startup** | Bad preset config should fail loudly at Strapi boot, not silently at runtime | Low | Implemented in dist: `isPresetConfigValid` with type-specific validators |
| **TypeScript types exported from plugin** | Developers configuring presets need IDE completion and type safety | Low | Implemented in dist: `TiptapPresetConfig`, `TiptapPluginConfig` exported from `shared/types.d.ts` |

---

## Differentiators

Features that make this preset system competitive or notably better than simply hardcoding extensions.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Per-feature options pass-through** (not just on/off) | Developer can configure `heading: { levels: [2, 3] }` or `textAlign: { alignments: ['left', 'center'] }` — richer control than boolean toggle | Low-Medium | Already designed in dist: `boolean \| options-object` union type per feature |
| **SEO tag control on headings** | `HeadingWithSEOTag` lets content managers set a different semantic HTML tag from the visual level — rare in Strapi editors | Medium | Existing extension, already in preset config surface |
| **Auto-sizing toolbar spacers** | Spacers only appear between groups that have at least one visible button — no orphan separators in minimal presets | Low | Implemented in dist with `hasVisibleItems()` |
| **"Minimal mode" editorial notice** | Content managers see an explicit message when no preset is configured, not just a bare editor with no context | Low | Implemented in dist — good UX affordance |
| **Standard Strapi config path** (`config/plugins.ts`) | No special registration call — developers who know Strapi already know where to put it | Low | Implemented in dist; eliminates a learning curve |
| **`findOne` preset route** | Admin fetches the full config object for one preset by name, not just the list — enables future extension-level option rendering | Low | Implemented in dist; opens door to richer admin UX |
| **Preset validation with human-readable errors** | Startup errors name the invalid keys and show the allowed set | Low | Implemented in dist validator |

---

## Anti-Features

Features to explicitly NOT build in this milestone. Each has a rationale.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Visual preset builder in admin UI** | High complexity, low return — the target audience is developers configuring code | Code-based config in `config/plugins.ts` is the right DX for a developer-facing API |
| **Per-user preset selection** | Presets are a content-modeling decision, not a personal preference | Presets are per content-type field via Content-Type Builder |
| **Hot-reload of presets without server restart** | Strapi plugin config is static per server lifecycle; adding reactivity means a custom store or DB record | Accept that preset changes require restart — document clearly |
| **Custom extension upload / third-party extensions** | Plugin bundled extensions only; dynamic code loading in the admin is a security and bundling nightmare | Extensions must be bundled at build time |
| **Per-field label customization of presets** | PROJECT.md originally mentioned `label?` on preset; the dist design dropped it — presets are identified by their key name alone | Key name is the label; keep the API surface minimal |
| **Default preset = full tool set** | The dist design deliberately chose `MINIMAL_PRESET_CONFIG` as the fallback, not the full extension set; this is the right call because an unconfigured field should prompt developers to set a preset | Document `MINIMAL_PRESET_CONFIG` behavior clearly instead |
| **`registerPresets()` function export** | PROJECT.md originally proposed this pattern; the dist replaced it with standard Strapi config — do not re-introduce a parallel API | Use `config/plugins.ts` exclusively |
| **Auth on preset routes** | Preset config is not sensitive data; adding auth creates complexity for custom admin UI consumers with no security benefit | Routes are `auth: false` — keep it |
| **Preset inheritance / composition** | One preset extending another multiplies edge cases (circular refs, merge semantics) with unclear benefit | Duplicate feature flags across presets if needed; keep config flat |

---

## Feature Dependencies

```
Strapi plugin config validation
  → Preset list API (GET /presets)
    → PresetSelect dropdown in Content-Type Builder
      → Preset name stored in field schema options

Preset name stored in field schema options
  → usePresetConfig hook (fetches GET /presets/:name at runtime)
    → buildExtensions (maps TiptapPresetConfig → Tiptap Extensions[])
      → useTiptapEditor (initializes editor with built extension list)
        → Extension hooks (each receives config, returns conditional toolbar elements)
          → Toolbar auto-detection (hasVisibleItems drives spacer rendering)

Config object shape (TiptapPresetConfig)
  → TypeScript types exported from shared/types.ts
  → featureToggle utilities (isFeatureEnabled, getFeatureOptions)
    → buildExtensions
    → All extension hooks (StarterKit, Heading, Link, Table, TextAlign, Script)

Fallback behavior (MINIMAL_PRESET_CONFIG)
  → usePresetConfig (when preset name is empty or fetch fails)
  → "Minimal mode" indicator in BaseTiptapInput
```

---

## Feature Gap: Source vs. Dist

The dist contains a substantially complete implementation that does not yet exist in source. These are features that exist in the compiled output but need to be written in source:

| Feature | Status in Dist | Status in Source |
|---------|---------------|-----------------|
| `shared/types.ts` with `TiptapPresetConfig` | Compiled | Missing |
| `server/src/config/index.ts` with validator | Compiled | Empty stub |
| `server/src/controllers/preset.ts` | Compiled | Empty stub |
| `server/src/services/preset.ts` | Compiled | Empty stub |
| `server/src/routes/preset.ts` | Compiled | Empty (routes/index.ts) |
| `admin/src/utils/featureToggle.ts` | Compiled | Missing |
| `admin/src/utils/buildExtensions.ts` | Compiled | Missing |
| `admin/src/hooks/usePresetConfig.ts` | Compiled | Missing |
| `admin/src/components/PresetSelect.tsx` | Compiled | Missing |
| Extension hooks accept `TiptapPresetConfig` | Compiled | Hooks don't accept config param |
| `richTextField.ts` with `options.base` array | Compiled | Missing `options` key |
| `RichTextInput.tsx` preset-aware version | Compiled | Static version (no preset) |
| `BaseTiptapInput` accepts `toolbarInfo` prop | Compiled | Missing prop |

This gap is the entire scope of the milestone. The dist serves as a complete reference implementation.

---

## MVP Recommendation

Prioritize (in dependency order):

1. **`shared/types.ts`** — `TiptapPresetConfig`, `TiptapPluginConfig`, `PRESET_FEATURE_KEYS`; everything else depends on these types
2. **`featureToggle.ts` utilities** — `isFeatureEnabled`, `getFeatureOptions`; needed by both buildExtensions and extension hooks
3. **Server config + validator** — enables preset storage and startup-time validation
4. **Server preset service + controller + routes** — exposes preset list and individual preset data to admin
5. **`buildExtensions`** — maps config to live Tiptap extension array; core of the client-side preset resolution
6. **Extension hook updates** — each hook accepts config param and returns null buttons when feature disabled
7. **`usePresetConfig`** — fetches preset config at editor render time
8. **`PresetSelect` + `richTextField` options registration** — wires preset selection into Content-Type Builder
9. **`RichTextInput` preset-aware rewrite** — ties everything together; replaces static extension list with dynamic `buildExtensions` output
10. **`BaseTiptapInput` toolbarInfo prop** — minimal mode notice for content managers

Defer:
- **Translations for new strings** (`"Editor Preset"`, `"No editor preset configured..."`) — functional strings are already hardcoded in dist; i18n can follow
- **`underline` inclusion in StarterKit config surface** — the dist includes it in the toolbar but the `TiptapPresetConfig` type does not expose it as a togglable feature; this can be addressed in a later pass

---

## Sources

All findings HIGH confidence — derived from first-party codebase files:

- `/Users/mbp-13/_work/notum-plugins/strapi-plugin-tiptap-editor/dist/shared/types.d.ts` — canonical type definitions
- `/Users/mbp-13/_work/notum-plugins/strapi-plugin-tiptap-editor/dist/server/index.js` — server-side preset service, controller, routes, config validator
- `/Users/mbp-13/_work/notum-plugins/strapi-plugin-tiptap-editor/dist/admin/index.js` — `PresetSelect` component and field options registration
- `/Users/mbp-13/_work/notum-plugins/strapi-plugin-tiptap-editor/dist/_chunks/RichTextInput-ugq1Ypmj.js` — `buildExtensions`, `usePresetConfig`, `MINIMAL_PRESET_CONFIG`, preset-aware `RichTextInput`
- `/Users/mbp-13/_work/notum-plugins/strapi-plugin-tiptap-editor/.planning/PROJECT.md` — requirements, constraints, key decisions
- `/Users/mbp-13/_work/notum-plugins/strapi-plugin-tiptap-editor/.planning/codebase/ARCHITECTURE.md` — extension hook pattern
- Source extension files (`admin/src/extensions/*.tsx`) — current hook signatures
