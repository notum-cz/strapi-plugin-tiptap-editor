# Architecture Research: v1.2 Text Color, Highlight Color, Theme Config

**Domain:** Strapi 5 plugin — Tiptap editor with text color, highlight color, and theme config
**Researched:** 2026-03-16
**Confidence:** HIGH (derived from codebase inspection, installed node_modules, and official Tiptap docs)

---

## System Overview — v1.2 Layer Additions

v1.2 adds two new Tiptap mark extensions (Color, Highlight), two new preset feature keys, and a new top-level `theme` config object on `TiptapPluginConfig`. The theme config is separate from presets and flows through a dedicated server route and admin hook. CSS injection happens once at plugin bootstrap, not per editor mount.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           ADMIN LAYER (browser)                          │
├─────────────────────────────────────────────────────────────────────────┤
│  admin/src/index.ts  bootstrap()                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  useThemeConfig()  (NEW hook, called once)                        │   │
│  │  GET /tiptap-editor/theme  →  { stylesheet?, colors? }           │   │
│  │  if stylesheet → injectStylesheet(url)  (once, idempotent)       │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  RichTextInput (InnerEditor)                                             │
│  ┌──────────────────────┐  ┌──────────────────────────────────────────┐ │
│  │  FeatureGuard        │  │  useTextColor() hook  (NEW)              │ │
│  │  featureValue=       │  │  ┌────────────────────────────────────┐  │ │
│  │  config.textColor    │  │  │  ColorPickerPopover  (NEW)          │  │ │
│  └──────────────────────┘  │  │  colors from useThemeConfig()       │  │ │
│                             │  └────────────────────────────────────┘  │ │
│  ┌──────────────────────┐  └──────────────────────────────────────────┘ │
│  │  FeatureGuard        │  ┌──────────────────────────────────────────┐ │
│  │  featureValue=       │  │  useHighlightColor() hook  (NEW)         │ │
│  │  config.highlightColor│  │  ┌────────────────────────────────────┐  │ │
│  └──────────────────────┘  │  │  ColorPickerPopover  (NEW, shared)  │  │ │
│                             │  │  colors from useThemeConfig()       │  │ │
│                             │  └────────────────────────────────────┘  │ │
│                             └──────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────┤
│  buildExtensions(config)  — MODIFIED                                     │
│  if textColor → push TextStyle + Color                                   │
│  if highlightColor → push Highlight.configure({ multicolor: true })      │
│  (TextStyle registered at most once via deduplication)                   │
├─────────────────────────────────────────────────────────────────────────┤
│  shared/types.ts  — MODIFIED                                             │
│  TiptapPresetConfig: add textColor, highlightColor fields                │
│  TiptapPluginConfig: add optional theme field                            │
│  PRESET_FEATURE_KEYS: add 'textColor', 'highlightColor'                  │
│  NEW: TiptapThemeConfig type { stylesheet?: string; colors?: string[] }  │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                         SERVER LAYER — NEW ADDITIONS                     │
├─────────────────────────────────────────────────────────────────────────┤
│  GET /tiptap-editor/theme  →  TiptapThemeConfig | {}                     │
│  server/src/controllers/theme.ts  (NEW)                                  │
│  server/src/services/theme.ts     (NEW)                                  │
│  server/src/routes/index.ts       (MODIFIED — add theme route)           │
│  server/src/config/index.ts       (MODIFIED — validate theme shape)      │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                HOST APP config/plugins.ts  (developer writes)            │
│                                                                          │
│  export default {                                                        │
│    'tiptap-editor': {                                                    │
│      config: {                                                           │
│        theme: {                          // NEW top-level key            │
│          stylesheet: '/design-system.css',                               │
│          colors: ['#FF0000', '#00FF00', '#0000FF'],                      │
│        },                                                                │
│        presets: {                                                        │
│          full: {                                                         │
│            textColor: true,              // NEW preset feature key       │
│            highlightColor: true,         // NEW preset feature key       │
│            ...                                                           │
│          }                                                               │
│        }                                                                 │
│      }                                                                   │
│    }                                                                     │
│  }                                                                       │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Component Responsibilities

| Component | Status | Responsibility |
|-----------|--------|----------------|
| `TiptapThemeConfig` | NEW type | `{ stylesheet?: string; colors?: string[] }` — typed shape for theme |
| `TiptapPluginConfig` | MODIFIED | Add optional `theme?: TiptapThemeConfig` field |
| `TiptapPresetConfig` | MODIFIED | Add `textColor?` and `highlightColor?` fields |
| `PRESET_FEATURE_KEYS` | MODIFIED | Add `'textColor'`, `'highlightColor'` to array |
| `server/config/index.ts` | MODIFIED | Add theme shape validation: stylesheet must be string, colors must be string[] |
| `server/src/services/theme.ts` | NEW | `getTheme()` reads `plugin::tiptap-editor` config, returns `TiptapThemeConfig` |
| `server/src/controllers/theme.ts` | NEW | `find(ctx)` handler — returns theme config via JSON response |
| `server/src/routes/index.ts` | MODIFIED | Add `GET /theme` route pointing to `theme.find` |
| `useThemeConfig` | NEW hook | Fetches `GET /tiptap-editor/theme` once; returns `{ colors, stylesheet, isLoading }` |
| `injectStylesheet` | NEW util | Idempotent `<link>` tag injection into `document.head`; no-op if already injected |
| `buildExtensions` | MODIFIED | Add TextStyle + Color branch for textColor; Highlight branch for highlightColor |
| `useTextColor` | NEW hook | Returns `textColorButton`; uses `useEditorState` to track active color |
| `useHighlightColor` | NEW hook | Returns `highlightColorButton`; uses `useEditorState` to track active highlight |
| `ColorPickerPopover` | NEW component | Popover showing color swatches from theme; calls `setColor`/`setHighlight` on click |
| `RichTextInput` (InnerEditor) | MODIFIED | Call `useTextColor`, `useHighlightColor`; add two `FeatureGuard` blocks to toolbar |

---

## Integration Point 1: Theme Config Data Flow (Server → Admin)

### New server route

The theme is global config — one per plugin install, not per preset. It lives as `theme` inside `plugin::tiptap-editor` config alongside `presets`. A dedicated `GET /theme` route returns it so the admin can fetch it independently of any preset.

```typescript
// server/src/services/theme.ts
const createThemeService = ({ strapi }) => ({
  getTheme(): TiptapThemeConfig {
    const config = strapi.config.get('plugin::tiptap-editor', DEFAULT_CONFIG);
    return (config as TiptapPluginConfig).theme ?? {};
  },
});
```

```typescript
// server/src/controllers/theme.ts
const createThemeController = ({ strapi }) => ({
  async find(ctx) {
    const themeService = strapi.plugin('tiptap-editor').service('theme');
    ctx.body = themeService.getTheme();
  },
});
```

Route addition in `server/src/routes/index.ts`:

```typescript
{
  method: 'GET',
  path: '/theme',
  handler: 'theme.find',
  config: { policies: [], middlewares: [] },
}
```

### New admin hook

`useThemeConfig` is called once per editor instance (or once globally at bootstrap — see CSS injection below). It returns the theme config for use in color pickers.

```typescript
// admin/src/hooks/useThemeConfig.ts
export type ThemeConfigResult = {
  colors: string[];
  stylesheet: string | null;
  isLoading: boolean;
};

export function useThemeConfig(): ThemeConfigResult {
  const { get } = useFetchClient();
  const [colors, setColors] = useState<string[]>([]);
  const [stylesheet, setStylesheet] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    get('/tiptap-editor/theme').then((response) => {
      if (!mounted) return;
      setColors(response.data?.colors ?? []);
      setStylesheet(response.data?.stylesheet ?? null);
      setIsLoading(false);
    }).catch(() => {
      if (!mounted) return;
      setIsLoading(false);
    });
    return () => { mounted = false; };
  }, [get]);

  return { colors, stylesheet, isLoading };
}
```

**Why not cache globally:** React hooks are the natural fit here; the fetch result is small and cached by the browser. If performance becomes a concern, a module-level cache can be added later.

---

## Integration Point 2: CSS Stylesheet Injection

### Where injection happens

CSS injection must happen **once at plugin bootstrap**, not on every editor mount. Injecting per mount would create duplicate `<link>` tags. The `bootstrap()` function in `admin/src/index.ts` runs once when Strapi admin initializes.

### Mechanism

Direct DOM manipulation is the correct approach. Strapi's admin panel API offers `injectComponent` (for React components into specific zones) but no API for `<link>` stylesheet injection. Using `document.createElement('link')` in bootstrap is standard browser practice and is safe inside Strapi's SPA context.

```typescript
// admin/src/utils/injectStylesheet.ts

const INJECTED_ATTR = 'data-tiptap-editor-theme';

export function injectStylesheet(url: string): void {
  // Idempotent: skip if already injected
  if (document.querySelector(`link[${INJECTED_ATTR}]`)) {
    return;
  }
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = url;
  link.setAttribute(INJECTED_ATTR, 'true');
  document.head.appendChild(link);
}
```

### Bootstrap wiring

The `bootstrap()` function in `admin/src/index.ts` must fetch the theme and inject the stylesheet. Because `bootstrap` can be async, this fits naturally:

```typescript
// admin/src/index.ts  (MODIFIED bootstrap)
async bootstrap(app: StrapiApp) {
  // ... existing CTB component registration ...

  // Fetch theme config and inject stylesheet if configured
  try {
    const response = await fetch('/tiptap-editor/theme', {
      headers: { 'Content-Type': 'application/json' },
    });
    const theme = await response.json();
    if (typeof theme.stylesheet === 'string' && theme.stylesheet.length > 0) {
      injectStylesheet(theme.stylesheet);
    }
  } catch {
    // Non-critical: theme fetch failure should not break plugin initialization
  }
}
```

**Note:** Using raw `fetch` (not `useFetchClient`) because `bootstrap` is not a React component — `useFetchClient` is a hook that requires React context. The `/tiptap-editor/theme` route uses `type: 'admin'` routing so it requires the admin auth token. The admin token is available as a cookie at bootstrap time but not trivially accessible outside React context. Two alternatives:

**Option A (recommended):** Use Strapi's `@strapi/strapi/admin`'s `getFetchClient()` utility if available outside React context. Check if Strapi 5 exposes this.

**Option B (fallback):** Inject stylesheet lazily inside `useThemeConfig` hook on first call, using a module-level flag to prevent re-injection:

```typescript
// admin/src/utils/injectStylesheet.ts
let injected = false;

export function injectStylesheetOnce(url: string): void {
  if (injected) return;
  injected = true;
  const existing = document.querySelector(`link[data-tiptap-editor-theme]`);
  if (existing) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = url;
  link.setAttribute('data-tiptap-editor-theme', 'true');
  document.head.appendChild(link);
}
```

With Option B, `useThemeConfig` calls `injectStylesheetOnce(stylesheet)` after fetching the theme. The module-level `injected` flag guarantees injection happens exactly once per page load regardless of how many editor instances mount.

**Recommendation: Option B.** It avoids the auth token problem entirely, reuses the existing `useFetchClient` pattern, and the module-level flag is a proven pattern in browser JS for one-time initialization.

---

## Integration Point 3: Tiptap Extensions for Color and Highlight

### Packages to install

Neither `@tiptap/extension-color` nor `@tiptap/extension-highlight` is currently installed. Both are at version `3.20.1` matching the existing Tiptap ecosystem.

The `Color` extension depends on `TextStyle` (from `@tiptap/extension-text-style`). `TextStyle` must be registered in the Tiptap editor before `Color` can apply `style="color: ..."` to `<span>` elements. `Highlight` is independent — it uses `<mark>` tags.

```bash
npm install @tiptap/extension-color@3.20.1 @tiptap/extension-highlight@3.20.1 @tiptap/extension-text-style@3.20.1
```

### How Color works

`Color` adds a `setColor(color)` / `unsetColor()` command that applies `style="color: #hex"` via a `TextStyle` `<span>`. The `TextStyle` extension itself is a thin mark that wraps text in `<span style="...">`.

### How Highlight works

`Highlight` with `multicolor: true` adds `setHighlight({ color })` / `unsetHighlight()` commands that apply `style="background-color: #hex"` via a `<mark>` tag.

### buildExtensions changes

```typescript
// admin/src/utils/buildExtensions.ts  (MODIFIED)

import TextStyle from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';

export function buildExtensions(config: TiptapPresetConfig): Extensions {
  // ... existing code unchanged ...

  // TextStyle is required by Color; register it if either textColor or highlightColor is enabled.
  // Only register once — Tiptap deduplicates extensions by name, but explicit single-push is cleaner.
  const needsTextStyle = isFeatureEnabled(config.textColor);
  if (needsTextStyle) {
    extensions.push(TextStyle);
    extensions.push(Color);
  }

  if (isFeatureEnabled(config.highlightColor)) {
    extensions.push(Highlight.configure({ multicolor: true }));
  }

  extensions.push(Gapcursor);
  return extensions;
}
```

**Why TextStyle is only needed for Color, not Highlight:** `Highlight` renders as `<mark>` (an independent mark), not as a `<span>`. `TextStyle` is only required for extensions that piggyback on `<span style="...">`.

**TextStyle deduplication:** If both `textColor` and some future feature (e.g., font-size) both push `TextStyle`, Tiptap's extension registry deduplicates by extension name. However, the codebase's existing pattern is explicit conditional pushes — it is cleaner to keep a single `needsTextStyle` variable that aggregates all features requiring it.

---

## Integration Point 4: Color Picker UI Component

### Responsibility boundary

The color picker is purely a UI concern — it renders swatches and emits a color string. It does not know about the editor directly; the parent hook passes callbacks.

### ColorPickerPopover design

```typescript
// admin/src/components/ColorPickerPopover.tsx

type ColorPickerPopoverProps = {
  colors: string[];           // from useThemeConfig
  currentColor: string | null;
  onColorSelect: (color: string) => void;
  onClear: () => void;
  triggerLabel: string;
  disabled?: boolean;
};
```

The component renders a `ToolbarButton` as trigger and an `@strapi/design-system` `Popover` containing color swatches. Each swatch is a small clickable box. A "clear" button removes the color.

**Why a shared component for both textColor and highlightColor:** The only difference between text color and highlight color pickers is the callback — `setColor` vs `setHighlight`. Everything else (swatch grid, active state, clear button) is identical. A single `ColorPickerPopover` with `onColorSelect` and `onClear` props covers both.

### useTextColor hook

```typescript
// admin/src/extensions/TextColor.tsx

export function useTextColor(
  editor: Editor | null,
  colors: string[],
  props: { disabled?: boolean } = {}
) {
  const { formatMessage } = useIntl();
  const editorState = useEditorState({
    editor,
    selector: (ctx) => ({
      currentColor: ctx.editor?.getAttributes('textStyle').color ?? null,
    }),
  });

  const handleColorSelect = (color: string) => {
    editor?.chain().focus().setColor(color).run();
  };
  const handleClear = () => {
    editor?.chain().focus().unsetColor().run();
  };

  return {
    textColorButton: (
      <ColorPickerPopover
        colors={colors}
        currentColor={editorState?.currentColor ?? null}
        onColorSelect={handleColorSelect}
        onClear={handleClear}
        triggerLabel={formatMessage({ id: 'tiptap-editor.toolbar.textColor', defaultMessage: 'Text color' })}
        disabled={props.disabled || !editor}
      />
    ),
  };
}
```

### useHighlightColor hook

Identical structure to `useTextColor` but uses `getAttributes('highlight').color` for active state and `setHighlight`/`unsetHighlight` commands.

---

## Integration Point 5: RichTextInput Changes

`InnerEditor` receives colors via `useThemeConfig`, then passes them to the extension hooks.

```typescript
// admin/src/components/RichTextInput.tsx  (MODIFIED InnerEditor)

import { useThemeConfig } from '../hooks/useThemeConfig';
import { useTextColor } from '../extensions/TextColor';
import { useHighlightColor } from '../extensions/HighlightColor';

const InnerEditor = forwardRef<HTMLDivElement, InnerEditorProps>(
  ({ config, presetName, ...props }, forwardedRef) => {
    const { colors } = useThemeConfig();   // colors available to all pickers

    // ... existing hooks unchanged ...
    const textColor = useTextColor(editor, colors, { disabled: props.disabled });
    const highlightColor = useHighlightColor(editor, colors, { disabled: props.disabled });

    // ... existing JSX ...
    // Add inside toolbar, after strike/superscript/subscript group:
    // <FeatureGuard featureValue={config?.textColor}>
    //   {textColor.textColorButton}
    // </FeatureGuard>
    // <FeatureGuard featureValue={config?.highlightColor}>
    //   {highlightColor.highlightColorButton}
    // </FeatureGuard>
  }
);
```

**Important:** `useThemeConfig` is called unconditionally (rules-of-hooks). The `FeatureGuard` around the returned buttons handles suppression when features are disabled. The `colors` array is empty `[]` when no theme is configured — the picker renders with no swatches, which is graceful degradation.

---

## Integration Point 6: Config Validator Changes

`server/src/config/index.ts` must validate the new `theme` key. Validation rules:

- `theme` is optional; if absent, config is valid
- `theme.stylesheet` if present must be a non-empty string
- `theme.colors` if present must be an array of strings (no format validation — hex, RGB, named colors all accepted)

```typescript
// server/src/config/index.ts  (MODIFIED validator section)

const typedConfig = pluginConfig as { presets?: unknown; theme?: unknown };
const { presets, theme } = typedConfig;

if (theme !== undefined) {
  if (!isPlainObject(theme)) {
    throw new Error('tiptap-editor config.theme must be a plain object');
  }
  const t = theme as { stylesheet?: unknown; colors?: unknown };
  if (t.stylesheet !== undefined && typeof t.stylesheet !== 'string') {
    throw new Error('tiptap-editor config.theme.stylesheet must be a string');
  }
  if (t.colors !== undefined) {
    if (!Array.isArray(t.colors) || !t.colors.every((c) => typeof c === 'string')) {
      throw new Error('tiptap-editor config.theme.colors must be an array of strings');
    }
  }
}
```

---

## Integration Point 7: Tiptap JSON Round-Trip

### Text color in JSON

```json
{
  "type": "text",
  "text": "Red text",
  "marks": [
    {
      "type": "textStyle",
      "attrs": { "color": "#FF0000" }
    }
  ]
}
```

The `textStyle` mark stores the color in `attrs.color`. `TextStyle` is the container mark; `Color` extends it by adding the `color` attribute.

### Highlight color in JSON

```json
{
  "type": "text",
  "text": "Highlighted text",
  "marks": [
    {
      "type": "highlight",
      "attrs": { "color": "#FFFF00" }
    }
  ]
}
```

`Highlight` with `multicolor: true` stores color in `attrs.color` on its own `highlight` mark type, independent of `textStyle`.

### Mixed example (both applied)

Both marks can coexist on the same text node:

```json
{
  "type": "text",
  "text": "Colored and highlighted",
  "marks": [
    { "type": "textStyle", "attrs": { "color": "#FF0000" } },
    { "type": "highlight", "attrs": { "color": "#FFFF00" } }
  ]
}
```

---

## New Files

```
admin/src/
├── components/
│   └── ColorPickerPopover.tsx      # NEW — shared color swatch UI
├── extensions/
│   ├── TextColor.tsx               # NEW — useTextColor hook
│   └── HighlightColor.tsx          # NEW — useHighlightColor hook
├── hooks/
│   └── useThemeConfig.ts           # NEW — fetches GET /tiptap-editor/theme
└── utils/
    ├── buildExtensions.ts          # MODIFIED — add Color/Highlight branches
    └── injectStylesheet.ts         # NEW — idempotent <link> injection util
server/src/
├── controllers/
│   ├── index.ts                    # MODIFIED — add theme controller
│   └── theme.ts                    # NEW — find() handler
├── routes/
│   └── index.ts                    # MODIFIED — add GET /theme route
└── services/
    ├── index.ts                    # MODIFIED — add theme service
    └── theme.ts                    # NEW — getTheme() service
shared/
└── types.ts                        # MODIFIED — TiptapThemeConfig type,
                                    #            theme field on TiptapPluginConfig,
                                    #            textColor/highlightColor on TiptapPresetConfig
```

No new fields/ files. No new content-types. No middleware additions.

---

## Data Flow Diagrams

### Theme config flow (one-time at bootstrap)

```
config/plugins.ts
  { theme: { stylesheet: '/ds.css', colors: ['#FF0000'] } }
         │
         ▼
  Strapi config system → plugin::tiptap-editor
         │
         ▼
  GET /tiptap-editor/theme
  themeService.getTheme()
         │
         ▼
  useThemeConfig() hook  (called in InnerEditor)
         │
         ├─ stylesheet → injectStylesheetOnce('/ds.css')
         │               → <link rel="stylesheet" href="/ds.css" data-tiptap-editor-theme>
         │               → appended to document.head (once, module-level flag)
         │
         └─ colors ['#FF0000', ...]  → passed to useTextColor / useHighlightColor
```

### Text color flow (per toolbar interaction)

```
Preset config JSON (from server)
  { textColor: true, ... }
         │
         ▼
  buildExtensions(config)
         │
         ├─ isFeatureEnabled(config.textColor) === true
         │        │
         │        └─ extensions.push(TextStyle, Color)
         │
         ▼
  useEditor({ extensions: [..., TextStyle, Color] })
         │
         ▼
  useTextColor(editor, colors)
         │
         └─ textColorButton → <ColorPickerPopover colors={['#FF0000', ...]} />
                 │
                 ▼  (user clicks swatch)
         editor.chain().focus().setColor('#FF0000').run()
                 │
                 ▼
  Tiptap JSON:
    { "type": "text", "marks": [{ "type": "textStyle", "attrs": { "color": "#FF0000" } }] }
```

### Highlight color flow (identical structure, different extension)

```
  isFeatureEnabled(config.highlightColor) === true
         │
         └─ extensions.push(Highlight.configure({ multicolor: true }))
                 │
         useHighlightColor(editor, colors)
                 │
         editor.chain().focus().setHighlight({ color: '#FFFF00' }).run()
                 │
  Tiptap JSON:
    { "type": "text", "marks": [{ "type": "highlight", "attrs": { "color": "#FFFF00" } }] }
```

---

## Suggested Build Order

Build order is determined by compile-time dependencies. Each step unlocks downstream work.

**Step 1 — shared/types.ts (no dependencies)**
Add `TiptapThemeConfig` type. Add `theme?: TiptapThemeConfig` to `TiptapPluginConfig`. Add `textColor?` and `highlightColor?` to `TiptapPresetConfig`. Add `'textColor'` and `'highlightColor'` to `PRESET_FEATURE_KEYS`. Update `fixtures/all-features-payload.json` to include `textStyle` and `highlight` mark nodes.

**Step 2 — server: theme service + controller + route (depends on Step 1)**
Create `server/src/services/theme.ts`. Create `server/src/controllers/theme.ts`. Register both in their index files. Add `GET /theme` route. Extend the config validator for theme shape. Test: `GET /tiptap-editor/theme` returns `{}` with no theme config; returns configured values when theme is set.

**Step 3 — admin: useThemeConfig hook (depends on Step 2)**
Implement `useThemeConfig` in `admin/src/hooks/useThemeConfig.ts`. Test: returns `{ colors: [], stylesheet: null, isLoading: false }` on empty response; returns configured values when theme is set. Add unit test mocking the fetch client.

**Step 4 — admin: injectStylesheet util (no dependencies)**
Implement `injectStylesheetOnce` in `admin/src/utils/injectStylesheet.ts`. Unit test: calling twice only creates one `<link>` tag; `data-tiptap-editor-theme` attribute is set.

**Step 5 — npm install new packages (no code dependencies)**
Install `@tiptap/extension-color@3.20.1 @tiptap/extension-highlight@3.20.1 @tiptap/extension-text-style@3.20.1`.

**Step 6 — admin: buildExtensions changes (depends on Step 1, Step 5)**
Add `TextStyle` + `Color` branch for `textColor` and `Highlight` branch for `highlightColor`. Unit test: `buildExtensions({ textColor: true })` includes `TextStyle` and `Color`; `buildExtensions({ highlightColor: true })` includes `Highlight`; `buildExtensions({})` excludes all three.

**Step 7 — admin: ColorPickerPopover component (depends on Step 3)**
Implement `ColorPickerPopover`. No editor dependency — accepts `colors`, `currentColor`, callbacks. Unit test with a colors array; verify swatch count; verify `onColorSelect` called with correct color on click.

**Step 8 — admin: useTextColor + useHighlightColor hooks (depends on Step 6, Step 7)**
Implement `useTextColor` and `useHighlightColor` in `admin/src/extensions/`. Each calls `useEditorState` for active color and wires callbacks to `ColorPickerPopover`. Unit test with a mocked editor.

**Step 9 — admin: RichTextInput wiring (depends on Step 3, Step 8)**
Call `useThemeConfig()` and both new hooks in `InnerEditor`. Add two `FeatureGuard` blocks in toolbar JSX. This is where everything integrates — verify end-to-end with a real preset.

**Step 10 — Manual verification**
Test with a preset containing `{ textColor: true, highlightColor: true }` and `theme: { colors: ['#FF0000', '#00FF00'], stylesheet: '/test.css' }`:
- Color picker shows 2 swatches
- Text color applies `style="color:"` in rendered HTML
- Highlight applies `style="background-color:"` via `<mark>`
- Stylesheet `<link>` tag is present in `document.head`
- Colors round-trip correctly through Tiptap JSON serialization

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Registering TextStyle Twice

**What people do:** Both textColor and a future font-size feature each push `TextStyle` into the extensions array.

**Why it's wrong:** While Tiptap deduplicates by extension name at runtime, two pushes create confusing code and potential issues if extension options differ between pushes.

**Do this instead:** Use a single guard: `const needsTextStyle = isFeatureEnabled(config.textColor) /* || isFeatureEnabled(config.fontSize) */`. Push `TextStyle` once when the guard is true.

### Anti-Pattern 2: Injecting the Stylesheet Per Editor Mount

**What people do:** Call `injectStylesheet(url)` inside `RichTextInput` or `InnerEditor` on every render.

**Why it's wrong:** If a page has multiple `RichText` fields (common in Strapi content types), this injects duplicate `<link>` tags on every mount. Even with an idempotent check on the `data-tiptap-editor-theme` attribute, it's unnecessary network/DOM work.

**Do this instead:** Use a module-level boolean flag in `injectStylesheetOnce`. The flag persists for the lifetime of the SPA page — first call injects, subsequent calls are no-ops.

### Anti-Pattern 3: Fetching Theme Config Inside the Color Hook

**What people do:** Call `useThemeConfig()` inside `useTextColor` and separately inside `useHighlightColor`.

**Why it's wrong:** Two simultaneous fetch calls to the same endpoint. Even if both resolve to the same data, it's wasted network traffic.

**Do this instead:** Call `useThemeConfig()` once in `InnerEditor` and pass `colors` as a prop to `useTextColor` and `useHighlightColor`. The hooks take `colors: string[]` as a parameter, not a fetched value.

### Anti-Pattern 4: Putting theme Validation Inside Preset Validation Loop

**What people do:** Add theme validation inside the existing `for (const [presetName, presetConfig] of Object.entries(presets))` loop.

**Why it's wrong:** Theme is a peer of `presets`, not a preset. Mixing their validation creates confusing error messages and makes the validator harder to reason about.

**Do this instead:** Validate `theme` in a separate block in the config validator, before or after the `presets` loop.

### Anti-Pattern 5: Using hex Input Field Instead of Swatches for Color Entry

**What people do:** Render a `<input type="color">` or free-text hex field in the color picker.

**Why it's wrong:** Strapi's design system doesn't include a native color input. A free-text hex field allows any color, defeating the purpose of the theme color palette (design system consistency). The `colors` array from theme config is the approved palette.

**Do this instead:** Render only the colors from `theme.colors` as swatches. If no colors are configured, show a "no colors configured" message. This enforces design system consistency.

---

## Integration Points Summary

| Boundary | What Crosses | How |
|----------|-------------|-----|
| Host config → plugin | `{ theme: { stylesheet, colors } }` in `TiptapPluginConfig` | Same `plugin::tiptap-editor` config, new key |
| Server → admin (theme) | `TiptapThemeConfig` JSON | New `GET /tiptap-editor/theme` route |
| Admin (theme) → DOM | `<link rel="stylesheet">` in `document.head` | `injectStylesheetOnce` util, module-level flag |
| Admin (theme) → color pickers | `colors: string[]` | `useThemeConfig()` in `InnerEditor`, passed as prop |
| Preset config → extensions | `textColor: true`, `highlightColor: true` | Existing `buildExtensions` + `isFeatureEnabled` pattern |
| `buildExtensions` → Tiptap | `TextStyle`, `Color`, `Highlight` extension objects | New conditional branches in `buildExtensions` |
| Color picker → editor | `editor.chain().setColor(color).run()` | `useTextColor` / `useHighlightColor` callbacks |
| Editor → JSON storage | `textStyle` mark with `color` attr; `highlight` mark with `color` attr | Standard Tiptap JSON serialization |

---

## Sources

**Verified from codebase inspection (HIGH confidence):**
- `shared/types.ts` — `TiptapPresetConfig`, `TiptapPluginConfig`, `PRESET_FEATURE_KEYS`, `isFeatureEnabled`, `getFeatureOptions`
- `admin/src/utils/buildExtensions.ts` — existing conditional extension branch pattern
- `admin/src/components/RichTextInput.tsx` — `InnerEditor` hook composition and `FeatureGuard` usage
- `admin/src/hooks/usePresetConfig.ts` — hook pattern to follow for `useThemeConfig`
- `server/src/services/preset.ts` — service pattern to follow for theme service
- `server/src/controllers/preset.ts` — controller pattern to follow for theme controller
- `server/src/routes/index.ts` — route registration pattern
- `server/src/config/index.ts` — config validator pattern and structure
- `node_modules/@tiptap/starter-kit/dist/index.d.ts` — confirmed TextStyle NOT in StarterKit

**Verified from official Tiptap documentation (MEDIUM confidence):**
- [Color extension docs](https://tiptap.dev/docs/editor/extensions/functionality/color) — requires `@tiptap/extension-text-style`; `setColor()`/`unsetColor()` API
- [Highlight extension docs](https://tiptap.dev/docs/editor/extensions/marks/highlight) — `multicolor: true` config; `setHighlight({ color })`/`unsetHighlight()` API
- [TextStyleKit docs](https://tiptap.dev/docs/editor/extensions/functionality/text-style-kit) — TextStyleKit bundles Color; not relevant here as we install individually

**WebSearch cross-referenced (MEDIUM confidence):**
- `@tiptap/extension-color` and `@tiptap/extension-highlight` both at version `3.20.1` — confirmed current version matches existing project Tiptap versions

---

*Architecture research for: Strapi plugin Tiptap editor v1.2 Text Color, Highlight Color, Theme Config*
*Researched: 2026-03-16*
