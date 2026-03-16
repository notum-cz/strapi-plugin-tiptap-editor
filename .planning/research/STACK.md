# Stack Research

**Domain:** Tiptap rich-text editor plugin — v1.2 text color + highlight color + theme config
**Researched:** 2026-03-16
**Confidence:** HIGH (all package choices verified against official Tiptap docs and npm; stylesheet injection pattern verified against Strapi 5 admin API docs and community forum)

---

> **Scope note:** This document covers ONLY the stack additions and changes needed for v1.2.
> The v1.0 preset system stack and the v1.1 media library stack are documented in prior
> research sessions and remain valid. Do not re-research those layers.

---

## New Dependencies Required

### 1. `@tiptap/extension-text-style`

| Item | Value |
|------|-------|
| Package | `@tiptap/extension-text-style` |
| Version | `3.20.1` (pin to match existing `@tiptap/*` lockstep) |
| Status | NOT currently installed — must be added to `dependencies` |
| Exports | `TextStyle` (mark), `Color` (functionality extension) |
| Why | In Tiptap v3, `Color` was moved into the `@tiptap/extension-text-style` package. Both the `TextStyle` mark and the `Color` extension are imported from this single package. `TextStyle` registers a `<span>` mark that carries inline style attributes; `Color` hooks into it to set `color: <hex>` via `editor.commands.setColor()` / `unsetColor()`. Without `TextStyle` registered first, `Color` has nothing to attach to. |

**Official docs confirm:** "This extension requires the `TextStyle` mark."
**Import pattern (v3):**

```typescript
import { TextStyle, Color } from '@tiptap/extension-text-style';
```

Do NOT import `Color` from `@tiptap/extension-color` — that npm package still exists but in v3 the authoritative source is `@tiptap/extension-text-style`. Using the standalone package risks version drift.

---

### 2. `@tiptap/extension-highlight`

| Item | Value |
|------|-------|
| Package | `@tiptap/extension-highlight` |
| Version | `3.20.1` (pin to match lockstep) |
| Status | NOT currently installed — must be added to `dependencies` |
| Why | Provides the `Highlight` mark, which renders `<mark>` with an optional background color. Must be configured with `multicolor: true` to support theme palette swatches — without it, only the single default yellow highlight is available and color attributes are not stored in the JSON output. |

**Key configuration requirement:**

```typescript
Highlight.configure({ multicolor: true })
```

Without `multicolor: true`, `setHighlight({ color: '#...' })` is a no-op for the color attribute and the value is not persisted in Tiptap JSON. This is a non-obvious default.

**Commands exposed:** `setHighlight({ color })`, `toggleHighlight({ color })`, `unsetHighlight()`

---

## Install Command

```bash
yarn add @tiptap/extension-text-style@3.20.1 @tiptap/extension-highlight@3.20.1
```

Pin both to `3.20.1` to remain in lockstep with every other `@tiptap/*` package in `package.json`. Tiptap packages use synchronized versioning; mixing versions causes ProseMirror schema registration conflicts.

---

## No New Dependencies for These Capabilities

| Capability | How | Why No New Package |
|------------|-----|--------------------|
| Theme `stylesheet` injection | `document.createElement('link')` in `register()` | `register()` runs in browser context; DOM is available; no Strapi API needed |
| Theme `colors` array serving | Extend existing `GET /tiptap-editor/presets` route family | Same route controller pattern already in place for preset config |
| Color picker UI | `@strapi/design-system` (already at `2.2.0`) | Design System provides `Popover`, `Box`, and button primitives sufficient for a swatch grid |
| Config validator for theme shape | Extend `server/src/config/index.ts` validator | Already imports from `shared/types.ts`; add `theme` key to validator |

---

## Stylesheet Injection — Implementation Pattern

The `theme.stylesheet` value is a URL string (e.g., `/uploads/design-tokens.css` or an absolute CDN URL). The plugin must inject a `<link rel="stylesheet">` into `document.head` at admin panel startup.

**Where it goes:** `admin/src/index.ts`, inside `register(app)`.

**Why `register()` not `bootstrap()`:** `register()` fires before the editor mounts, so the stylesheet is available before any color class names are applied. `bootstrap()` fires after all plugins register, which is slightly later but also acceptable — either lifecycle works for CSS injection since stylesheets load asynchronously anyway.

**Pattern (no external library needed):**

```typescript
// admin/src/index.ts  — inside register()
register(app: StrapiApp) {
  // ... existing registrations ...

  // Stylesheet injection for theme
  const config = /* fetched from server config or passed via plugin options */;
  if (config?.theme?.stylesheet) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = config.theme.stylesheet;
    document.head.appendChild(link);
  }
}
```

**Constraint:** `register()` is synchronous. The theme config must be fetched asynchronously (from `GET /tiptap-editor/theme` or similar route). The injection therefore needs to happen either:

1. **Via a new admin route** that returns theme config: the Initializer component (already exists, fires at plugin mount) fetches theme config on mount and injects the stylesheet into DOM — this keeps the async fetch inside React where it's natural.
2. **Or via a pre-fetched server-side value** embedded in the plugin descriptor (not a standard Strapi pattern).

**Recommendation:** Use the **Initializer component** approach. The existing `Initializer` already handles async setup (sets `isReady: true`). Extend it to fetch theme config and inject the stylesheet link before setting ready. This is the least invasive change consistent with the existing architecture.

---

## Theme Config — Server Layer Changes

The theme config sits alongside `presets` in `config/plugins.ts`. The server config validator (in `server/src/config/index.ts`) and `TiptapPluginConfig` (in `shared/types.ts`) must be extended.

**No new server libraries needed.** The existing:
- `server/src/config/index.ts` — extend `validator()` to validate `theme` shape
- `server/src/services/preset.ts` — extend or add `getTheme()` method
- `server/src/routes/index.ts` + `server/src/controllers/preset.ts` — add `GET /tiptap-editor/theme` route

All of this reuses the existing pattern from the presets API. No new server packages.

---

## Recommended Stack Summary for v1.2

### New Dependencies

| Package | Version | Add to | Why |
|---------|---------|--------|-----|
| `@tiptap/extension-text-style` | `3.20.1` | `dependencies` | Provides `TextStyle` mark (required) + `Color` extension |
| `@tiptap/extension-highlight` | `3.20.1` | `dependencies` | Provides `Highlight` mark with `multicolor: true` support |

### No New Dependencies

| Capability | Existing Resource |
|------------|-------------------|
| Stylesheet injection | Browser DOM API in `register()` / Initializer |
| Color picker UI | `@strapi/design-system@2.2.0` (Popover, Box, Button) |
| Theme config serving | Extend existing preset route + service pattern |
| Config validation for `theme` | Extend `server/src/config/index.ts` |
| Shared types for `theme` | Extend `shared/types.ts` |

---

## Alternatives Considered

| Recommended | Alternative | Why Not |
|-------------|-------------|---------|
| `@tiptap/extension-text-style` (has `Color`) | `@tiptap/extension-color` (standalone) | In Tiptap v3, `Color` is distributed in `extension-text-style`; using the standalone package risks version drift and double-registration of the TextStyle mark |
| `Highlight.configure({ multicolor: true })` | Default single-color highlight | Single-color mode does not store the color in JSON; theme palette swatches require `multicolor: true` |
| DOM injection via Initializer component (async) | Injection in synchronous `register()` | `register()` is synchronous; fetching the theme URL requires async; Initializer is already the async setup hook |
| Swatch grid UI with `@strapi/design-system` | A third-party color picker (react-color, etc.) | Design System Popover + Box is sufficient for a finite palette; adds no dep; third-party pickers add free-form hex input which we do not want |

---

## What NOT to Add

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `@tiptap/extension-color` (standalone npm package) | Still exists on npm but in v3 `Color` is exported from `@tiptap/extension-text-style`; installing both risks double-registration of the TextStyle mark and version conflicts | `import { Color } from '@tiptap/extension-text-style'` |
| Free-form hex input in the color picker | Colors should come from the theme palette; free-form input bypasses the design token system the `stylesheet` + `colors` config exists to enforce | Swatch grid from `theme.colors` only |
| `TextStyleKit` (the full kit) | Bundles BackgroundColor, FontFamily, FontSize, LineHeight — five extensions we do not need; adds unnecessary node types to the ProseMirror schema | Register only `TextStyle` + `Color` individually |
| Storing color as a CSS class on the mark | Color values from the theme palette could be class names (e.g., `color-primary`), but Tiptap's `Color` and `Highlight` extensions store raw color values; mapping between class names and values adds indirection without benefit for this use case | Store hex/RGB values directly; stylesheet provides the visual rendering if needed |

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| `@tiptap/extension-text-style@3.20.1` | `@tiptap/core@3.20.1`, `@tiptap/react@3.20.1`, `@tiptap/starter-kit@3.20.1` | Must match existing Tiptap lockstep; TextStyle mark is additive and does not conflict with StarterKit marks |
| `@tiptap/extension-highlight@3.20.1` | `@tiptap/core@3.20.1`, `@tiptap/react@3.20.1` | Must match lockstep; Highlight adds the `<mark>` element — no conflict with any existing extension |

---

## Confidence Assessment

| Area | Confidence | Evidence |
|------|------------|---------|
| `@tiptap/extension-text-style` as the source for `Color` in v3 | HIGH | Official Tiptap Color docs state "import { Color } from '@tiptap/extension-text-style'"; WebSearch confirmed v3.20.1 latest |
| `TextStyle` mark required alongside `Color` | HIGH | Official docs: "This extension requires the TextStyle mark" |
| `Highlight.configure({ multicolor: true })` required for per-color storage | HIGH | Official Tiptap Highlight docs: without `multicolor: true`, color attributes are not stored |
| `@tiptap/extension-highlight@3.20.1` version | HIGH | npm search result confirmed 3.20.1 as latest |
| Stylesheet injection via DOM in register/Initializer | MEDIUM | Strapi Admin Panel API docs confirm `register()` and `bootstrap()` execute in browser; no official `app.addStylesheet()` API exists; DOM approach is the only viable method and is consistent with community forum examples; behavior in Strapi 5 specifically not independently verified with a working example |
| Swatch-only color picker using Design System primitives | MEDIUM | No pre-built color picker in `@strapi/design-system@2.2.0` confirmed via docs; Popover + Box approach is standard React pattern; the exact component API for 2.2.0 should be verified during implementation |

---

## Sources

- [Tiptap Color Extension Docs](https://tiptap.dev/docs/editor/extensions/functionality/color) — import path, TextStyle requirement, commands (HIGH)
- [Tiptap Highlight Extension Docs](https://tiptap.dev/docs/editor/extensions/marks/highlight) — multicolor config, commands (HIGH)
- [Tiptap TextStyle Extension Docs](https://tiptap.dev/docs/editor/extensions/marks/text-style) — mark behavior, span rendering (HIGH)
- [Tiptap TextStyleKit Docs](https://tiptap.dev/docs/editor/extensions/functionality/text-style-kit) — confirmed TextStyleKit bundles Color but NOT Highlight (HIGH)
- [Tiptap StarterKit Docs](https://tiptap.dev/docs/editor/extensions/functionality/starterkit) — confirmed StarterKit does NOT include TextStyle, Color, or Highlight (HIGH)
- [Strapi Admin Panel API Docs](https://docs.strapi.io/cms/plugins-development/admin-panel-api) — register/bootstrap lifecycle hooks, no stylesheet injection API (HIGH)
- [Strapi Community Forum — CSS injection](https://forum.strapi.io/t/how-to-inject-custom-css-in-admin-panel-to-customize-a-specific-type-field/35275) — DOM approach pattern (MEDIUM)
- npm search results — `@tiptap/extension-text-style@3.20.1` and `@tiptap/extension-highlight@3.20.1` confirmed as latest versions (HIGH)

---

*Stack research for: Strapi Plugin Tiptap Editor v1.2 — Text Color, Highlight Color, Theme Config*
*Researched: 2026-03-16*
