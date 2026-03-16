# Feature Research

**Domain:** CMS rich-text editor — text color, highlight color, theme config (v1.2)
**Researched:** 2026-03-16
**Confidence:** HIGH — authoritative sources: Tiptap official docs (tiptap.dev), Tiptap UI Components docs, npm package inspection

---

## Scope

This file covers v1.2 new features only. All v1.0 and v1.1 features (preset system, toolbar,
buildExtensions, FeatureGuard, image support) are already shipped and treated as context, not scope.

The existing feature research for v1.1 is preserved at the bottom of this file as a reference section.

---

## Feature Landscape

### Table Stakes (Users Expect These)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Text color toolbar control | Standard in every CMS rich text editor (Blocks editor, TinyMCE, CKEditor, Notion all include it) | LOW | `@tiptap/extension-color` + `@tiptap/extension-text-style` (TextStyle is the underlying mark). Commands: `setColor(hex)`, `unsetColor()`. |
| Highlight color toolbar control | Expected alongside text color; standard for callout/emphasis workflows | LOW | `@tiptap/extension-highlight` with `multicolor: true`. Commands: `setHighlight({ color })`, `unsetHighlight()`. Separate mark from TextStyle. |
| Preset gating via `textColor` and `highlightColor` keys | Matches every other feature in this plugin — developers choose what's enabled per preset | LOW | Add both keys to `TiptapPresetConfig`, `PRESET_FEATURE_KEYS`, `buildExtensions`, and `server/src/config/index.ts` validator. |
| Colors round-trip through Tiptap JSON | Content stored as JSON must survive serialization without losing color values | LOW | Automatic once extensions are registered. TextStyle mark stores `attrs.color`; Highlight mark stores `attrs.color` when `multicolor: true`. |
| Config validator covers new keys | Boot-time validation already exists for preset keys; new keys must be recognized or they throw | LOW | `PRESET_FEATURE_KEYS` drives the validator's allowed-key set; adding the two new keys there is sufficient. |

### Differentiators (Competitive Advantage)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Theme `colors` array — developer-supplied palette shown as swatches | Developers can constrain editors to brand colors rather than free-form hex. Prevents off-brand choices. | MEDIUM | `theme.colors` is an array of `{ label: string, color: string }`. Swatches rendered in a custom toolbar popover. The official Tiptap `ColorTextPopover` does NOT accept a custom colors prop — a custom popover component is required. |
| External CSS stylesheet injection (`theme.stylesheet`) | Allows the editor to load a design-system stylesheet so custom color CSS classes render correctly in the editor canvas | MEDIUM | `theme.stylesheet` is a URL string. At admin boot (or editor mount), inject a `<link rel="stylesheet">` into the document head if not already present. URL must already be reachable from the admin panel — no server-side serving needed. |
| `theme` config separate from `presets` — shared across all presets | Single color palette definition; no per-preset duplication | LOW | `TiptapPluginConfig` grows `theme?: TiptapThemeConfig`. Preset configs reference the shared palette. |
| Unset / remove color action in picker | Without a clear action, mis-applied colors are sticky | LOW | Both Color and Highlight extensions provide `unsetColor()` / `unsetHighlight()` commands. Include a "remove color" swatch or button in the popover. |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Free-form hex color input in the picker | "I want any color" | Breaks brand consistency; every editor session becomes a CSS override hunt for front-end developers | Supply a well-chosen `theme.colors` palette; `unsetColor()` restores default |
| Opacity / alpha channel in color picker | Finer control | Alpha in hex is a 4/8-digit color (e.g. `#ff000080`); browser support is uneven; inline `color: rgba(...)` styles require additional TextStyle parsing | Use solid hex values only; designers control opacity at the component level |
| Per-preset color palettes | "Different content types need different colors" | Multiplies config complexity; palettes diverge and become unmaintainable | One `theme.colors` palette per plugin instance is enough; preset controls whether color tools are enabled at all |
| Recent-colors tracking (localStorage) | "Remember my last picks" | localStorage is per-browser, not per-user; colors differ between devices; adds state management complexity | Not needed when palette is constrained to theme swatches |
| Background color (distinct from highlight) | Looks equivalent to users | Requires `BackgroundColor` extension (separate from `Highlight`); adds a third mark that serializes differently; highlight already serves this role for CMS content | Use `highlightColor` + `@tiptap/extension-highlight` which renders as a `<mark>` element with background-color |

---

## Feature Dependencies

```
textColor feature
    requires --> @tiptap/extension-text-style (TextStyle mark — the foundational span wrapper)
    requires --> @tiptap/extension-color (Color extension — attaches color attr to TextStyle)
    requires --> textColor key in TiptapPresetConfig + PRESET_FEATURE_KEYS
    requires --> buildExtensions() pushes [TextStyle, Color] when textColor enabled
    enhances --> theme.colors (swatch popover reads from theme config at render time)

highlightColor feature
    requires --> @tiptap/extension-highlight configured with multicolor: true
    requires --> highlightColor key in TiptapPresetConfig + PRESET_FEATURE_KEYS
    requires --> buildExtensions() pushes Highlight.configure({ multicolor: true }) when highlightColor enabled
    enhances --> theme.colors (same color palette can back both pickers)
    independent-from --> textColor (separate marks; can be enabled independently)

theme config
    requires --> TiptapThemeConfig type in shared/types.ts
    requires --> TiptapPluginConfig gains optional theme field
    requires --> server/src/config/index.ts validator covers theme shape
    requires --> admin reads theme via GET /tiptap-editor/presets endpoint OR a new /tiptap-editor/theme endpoint
    enhances --> textColor (color swatch popover reads theme.colors)
    enhances --> highlightColor (color swatch popover reads theme.colors)

theme.stylesheet injection
    requires --> theme.stylesheet string in config
    requires --> admin/src/index.ts (or register.ts) injects <link> tag at plugin load time
    independent-from --> textColor and highlightColor (stylesheet can exist without color features enabled)

color picker popover UI component
    requires --> textColor OR highlightColor feature enabled (at least one)
    requires --> theme.colors array passed as prop
    requires --> @strapi/design-system Popover primitive (existing in the project)
    conflicts-with --> official Tiptap ColorTextPopover (that component has no custom colors prop; must be custom-built)
```

### Dependency Notes

- **TextStyle is required by Color but not by Highlight.** If `textColor` is enabled, `TextStyle` must be in the extension list. If only `highlightColor` is enabled, `TextStyle` is not needed. Both can coexist without conflict.
- **`@tiptap/extension-text-style` vs `TextStyleKit`:** `TextStyleKit` bundles Color + FontFamily + FontSize + LineHeight + BackgroundColor. Only Color is needed here — import `TextStyle` from `@tiptap/extension-text-style` and `Color` from `@tiptap/extension-color` directly to avoid pulling in unused extensions.
- **Theme config delivery to admin:** The admin already fetches preset config via `GET /tiptap-editor/presets/:name`. Theme config is global (not per-preset) so it needs either its own endpoint (`GET /tiptap-editor/theme`) or be embedded in the preset response envelope. The former is cleaner.
- **Custom color picker popover is required.** Neither `ColorTextPopover` nor `ColorHighlightPopover` from `@tiptap/ui-components` accept a custom colors array — they use an internal `TEXT_COLORS` constant. A custom component backed by `theme.colors` is the only way to surface the developer-supplied palette.

---

## MVP Definition

### Launch With (v1.2)

- [ ] `TiptapThemeConfig` type: `{ stylesheet?: string; colors?: Array<{ label: string; color: string }> }` in `shared/types.ts`
- [ ] `TiptapPluginConfig` gains optional `theme?: TiptapThemeConfig` field
- [ ] `textColor` and `highlightColor` keys added to `TiptapPresetConfig`, `PRESET_FEATURE_KEYS`, `buildExtensions`, and config validator
- [ ] `@tiptap/extension-text-style` and `@tiptap/extension-color` installed at `3.20.x`; `@tiptap/extension-highlight` already in the Tiptap family (verify if installed)
- [ ] `buildExtensions` pushes `[TextStyle, Color]` when `textColor` enabled; pushes `Highlight.configure({ multicolor: true })` when `highlightColor` enabled
- [ ] New `GET /tiptap-editor/theme` admin route returning the global theme config
- [ ] `useThemeConfig` hook (mirrors `usePresetConfig`) fetching theme from the new endpoint
- [ ] Custom `ColorPickerPopover` component: receives `colors: Array<{ label, color }>`, `onSelect(color: string)`, `onClear()`. Renders color swatches using `@strapi/design-system` Popover primitive. Reused for both text color and highlight color toolbar buttons.
- [ ] `useTextColor` hook returning a toolbar popover element; gated by FeatureGuard on `config.textColor`
- [ ] `useHighlightColor` hook returning a toolbar popover element; gated by FeatureGuard on `config.highlightColor`
- [ ] Stylesheet injection: at plugin register/load time, if `theme.stylesheet` is present, inject `<link rel="stylesheet" href={theme.stylesheet}>` into document head (idempotent — check for existing link before injecting)
- [ ] Config validator: validate `theme.colors` entries have `label` (string) and `color` (string); validate `theme.stylesheet` is a string if present
- [ ] Tiptap JSON output for text color: `{ type: "text", text: "...", marks: [{ type: "textStyle", attrs: { color: "#hex" } }] }`
- [ ] Tiptap JSON output for highlight: `{ type: "text", text: "...", marks: [{ type: "highlight", attrs: { color: "#hex" } }] }`

### Add After Validation (v1.x)

- [ ] Free-form hex input field alongside swatches — only if content managers report the palette is insufficient; gated behind an opt-in config option
- [ ] Per-preset color palette override — only if multi-brand deployments are reported as a real need

### Future Consideration (v2+)

- [ ] Live stylesheet hot-reload in admin without server restart — requires WebSocket or polling; low value for static design systems

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| textColor gating + extension wiring | HIGH | LOW | P1 |
| highlightColor gating + extension wiring | HIGH | LOW | P1 |
| theme.colors + custom swatch popover | HIGH | MEDIUM | P1 (popover is the only way to expose theme colors) |
| theme.stylesheet injection | MEDIUM | LOW | P1 (needed for color classes to render in editor) |
| GET /tiptap-editor/theme endpoint | HIGH | LOW | P1 (required to deliver theme to admin) |
| TiptapThemeConfig type + validator | HIGH | LOW | P1 (type safety + boot-time validation) |
| Free-form hex input | LOW | MEDIUM | P3 |

---

## Implementation Reference: Tiptap Color Extensions

**Confidence: HIGH** — official Tiptap documentation verified 2026-03-16.

### JSON output shapes

Text color (Color + TextStyle marks):
```json
{
  "type": "text",
  "text": "Brand blue text",
  "marks": [
    {
      "type": "textStyle",
      "attrs": { "color": "#0c75af" }
    }
  ]
}
```

Highlight color (Highlight mark with multicolor: true):
```json
{
  "type": "text",
  "text": "Highlighted text",
  "marks": [
    {
      "type": "highlight",
      "attrs": { "color": "#ffd700" }
    }
  ]
}
```

### Extension registration in buildExtensions

```typescript
import TextStyle from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';

// In buildExtensions():
if (isFeatureEnabled(config.textColor)) {
  extensions.push(TextStyle);
  extensions.push(Color);
}

if (isFeatureEnabled(config.highlightColor)) {
  extensions.push(Highlight.configure({ multicolor: true }));
}
```

### Commands

```typescript
// Text color
editor.chain().focus().setColor('#0c75af').run();
editor.chain().focus().unsetColor().run();

// Highlight color
editor.chain().focus().setHighlight({ color: '#ffd700' }).run();
editor.chain().focus().unsetHighlight().run();
```

### Theme config shape (proposed)

```typescript
// In shared/types.ts
export type ThemeColor = {
  label: string;   // e.g. "Brand Blue"
  color: string;   // CSS hex, e.g. "#0c75af"
};

export type TiptapThemeConfig = {
  stylesheet?: string;               // URL to external CSS, e.g. "/theme.css"
  colors?: ThemeColor[];             // Shared palette for text + highlight color pickers
};

// TiptapPluginConfig addition:
export interface TiptapPluginConfig {
  presets: Record<string, TiptapPresetConfig>;
  theme?: TiptapThemeConfig;         // NEW — optional global theme
}
```

---

## Competitor Feature Analysis

| Feature | Strapi Blocks Editor | strapi-plugin-tinymce | This Plugin (v1.2 target) |
|---------|---------------------|----------------------|--------------------------|
| Text color | No | Yes (color picker) | Yes — theme-constrained swatches |
| Highlight color | No | Yes (background color) | Yes — theme-constrained swatches |
| Developer-supplied palette | N/A | No (free hex) | Yes (theme.colors) — differentiator |
| External stylesheet injection | No | No | Yes (theme.stylesheet) — differentiator |
| Preset-gated color features | N/A | N/A | Yes — matches plugin architecture |

---

## Sources

- Tiptap Color extension — https://tiptap.dev/docs/editor/extensions/functionality/color
- Tiptap Highlight extension — https://tiptap.dev/docs/editor/extensions/marks/highlight
- Tiptap TextStyle extension — https://tiptap.dev/docs/editor/extensions/marks/text-style
- Tiptap TextStyleKit (what it bundles) — https://tiptap.dev/docs/editor/extensions/functionality/text-style-kit
- Tiptap ColorTextPopover (official UI component, no custom colors prop) — https://tiptap.dev/docs/ui-components/components/color-text-popover
- Tiptap ColorHighlightPopover (official UI component) — https://tiptap.dev/docs/ui-components/components/color-highlight-popover
- Tiptap ColorTextButton (single-color button) — https://tiptap.dev/docs/ui-components/components/color-text-button
- `@tiptap/extension-color` npm — https://www.npmjs.com/package/@tiptap/extension-color (v3.20.1 current as of 2026-03-16)
- `@tiptap/extension-highlight` npm — https://www.npmjs.com/package/@tiptap/extension-highlight

---

## Appendix: v1.1 Feature Research (Image Support — Shipped)

The original v1.1 feature research is preserved below for reference. All items are shipped.

### Table Stakes (v1.1)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Toolbar button to open Media Library picker | Standard CMS editor UX | LOW | Single `ToolbarButton`; existing pattern reused |
| Insert selected image into editor as a Tiptap node | Core action | MEDIUM | `@tiptap/extension-image` + `editor.chain().setImage({ src, alt })` |
| Alt text pre-filled from Media Library metadata | `alternativeText` on asset object | LOW | `asset.alternativeText ?? asset.name` |
| Resolved image URL in Tiptap JSON output | `src` must survive round-trips | LOW | Standard `@tiptap/extension-image` `src` attribute |
| Preset toggle `{ mediaLibrary: true }` | Consistent feature gating | LOW | Added to `TiptapPresetConfig`, `PRESET_FEATURE_KEYS`, `buildExtensions` |
| Image visible in editor canvas | Content managers must see what they inserted | LOW | `max-width: 100%` in editor CSS |

### Differentiators (v1.1)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Store Strapi asset ID (`strapiId`) in JSON | Front-end can resolve canonical asset URL via Strapi API | LOW | `Image.extend()` with custom `strapiId` attribute |
| Image alignment (left / center / right) | Editorial standard | MEDIUM | `data-align` attribute + float/margin CSS |
| Alt text inline editing after insertion | Correction without re-inserting | MEDIUM | NodeViewRenderer + dialog; ships as v1.1 |

---

*Feature research for: text color, highlight color, theme config (v1.2 milestone)*
*Researched: 2026-03-16*
