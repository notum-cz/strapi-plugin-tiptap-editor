# Architecture Patterns: Preset Configuration System

**Domain:** Strapi 5 plugin — server-to-admin config bridge, Tiptap extension composition
**Researched:** 2026-03-10
**Confidence:** HIGH (derived from actual codebase and installed package type definitions)

---

## Recommended Architecture

The preset system spans two physical layers (server, admin) bridged by an HTTP API. The core constraint is that Tiptap extension objects are live JavaScript and cannot serialize over HTTP. Only extension descriptors — plain JSON objects naming an extension and its options — cross the wire. The admin side holds a static registry that maps descriptor names to actual extension constructors.

```
Developer code (Strapi register/bootstrap)
  └─ calls registerPresets([{ name, label, extensions: [descriptor, ...] }])
       └─ stored in module-level PresetRegistry (server memory)

HTTP: GET /api/tiptap-editor/presets
  └─ PresetsController reads PresetRegistry
  └─ returns [{ name, label, extensions: [{ type, options }] }]

Admin: usePresetConfig(presetName)
  └─ calls useFetchClient().get(...)
  └─ returns PresetConfig | null

Admin: resolveExtensions(presetConfig)
  └─ looks up each descriptor.type in extensionRegistry
  └─ returns Extensions[] for useEditor()

Admin: RichTextInput
  └─ reads presetName from field attribute options
  └─ fetches + resolves extensions
  └─ conditionally renders toolbar hooks based on active extension set
```

---

## Component Boundaries

| Component | Layer | Responsibility | Communicates With |
|-----------|-------|---------------|-------------------|
| `PresetRegistry` | Server module | Holds registered presets in memory; exposes `register()` and `getAll()` | `register.ts`, `PresetsController` |
| `registerPresets()` export | Server public API | Function exported from plugin's server index; called by host app | `PresetRegistry` |
| `PresetsController` | Server controller | Handles `GET /presets`; reads `PresetRegistry`; returns serializable metadata | Strapi router, `PresetRegistry` |
| `presetsRoute` | Server route | Maps `GET /tiptap-editor/presets` to `PresetsController` | Strapi routing layer |
| `extensionRegistry` | Admin module | Static map of `ExtensionType` → factory function returning configured Tiptap extension(s) | `usePresetConfig`, `RichTextInput` |
| `usePresetConfig` | Admin hook | Fetches preset from API using field's stored preset name; handles loading/fallback | `useFetchClient`, `extensionRegistry` |
| `RichTextInput` | Admin component | Top-level editor component; composes extensions and toolbar from preset | `usePresetConfig`, extension hooks |
| Extension hooks (`useStarterKit`, etc.) | Admin hooks | Unchanged — return toolbar JSX for their extension | `RichTextInput` (conditionally called) |
| `TiptapInputProps` attribute options | Field schema | Stores preset name as `options.preset` in content-type JSON | Content-Type Builder, `RichTextInput` |

---

## Data Flow

### Preset Registration (server startup)

```
Host app register/bootstrap
  → calls plugin-exported registerPresets(presets)
  → PresetRegistry.register(presets)        // module-level Map<name, PresetDefinition>
  → registry sealed; no hot-reload
```

The default preset (full extension set) is pre-populated in `PresetRegistry` at module init time. It exists before any host app code runs and serves as the fallback.

### Preset Enumeration (Content-Type Builder)

```
Content-Type Builder field config UI
  → calls GET /api/tiptap-editor/presets
  → PresetsController reads PresetRegistry.getAll()
  → returns [{ name: string, label: string }]
  → CTB renders preset dropdown from response
  → selected name stored in field attribute: { options: { preset: "my-preset" } }
```

The attribute `options` bag in the field schema JSON is the persistence mechanism. This is untyped from Strapi's perspective but is passed through to the Input component via `InputProps`. **Important**: `CustomFieldOptions` (admin UI builder config) only supports a fixed set of option names. The preset dropdown must be registered as a custom option input in the `richTextField` admin definition using one of the supported `CustomFieldOptionName` slots, or implemented as a separate CTB-injected UI component. The cleanest approach is to add `options.preset` as a `'select'` type custom field option in the admin `richTextField.options.advanced` array — this uses the built-in CTB option rendering.

### Editor Initialization (content editing)

```
Strapi admin renders RichTextInput
  → props.attribute.options.preset = "my-preset" (from field schema)
  → usePresetConfig("my-preset") fires
      → useFetchClient().get("/api/tiptap-editor/presets/my-preset")
      → if 200: resolve extension descriptors → Tiptap Extension[]
      → if 404 / name not found: fall back to default preset
      → if loading: render skeleton or disabled editor
  → resolveExtensions(descriptors)
      → extensionRegistry["starterKit"] → StarterKit.configure(options)
      → extensionRegistry["heading"]    → HeadingWithSEOTag.configure(options)
      → etc.
  → useTiptapEditor(name, defaultValue, resolvedExtensions)
  → toolbar rendered conditionally based on activeExtensionTypes set
```

### Toolbar Conditional Rendering

```
activeExtensionTypes = new Set(preset.extensions.map(d => d.type))

// In RichTextInput JSX:
const starterKit = activeExtensionTypes.has('starterKit')
  ? useStarterKit(editor, props)
  : null

// Toolbar renders:
{starterKit?.boldButton}
{starterKit?.italicButton}
// etc.
```

React hooks cannot be called conditionally, so the implementation needs one of two approaches:
- **Approach A (recommended)**: Each hook accepts an `enabled` flag; when disabled it returns null for all buttons. Avoids React rules-of-hooks violations while keeping hook call sites unconditional.
- **Approach B**: Extract toolbar button rendering into non-hook helper functions. Hooks always initialize but accept the extensions array and self-disable when their extension is absent.

Approach A is simpler and matches existing hook signature patterns in the codebase.

---

## Patterns to Follow

### Pattern 1: Module-Level Preset Registry (Server)

**What:** A singleton module that holds presets in a plain `Map`. Initialized with defaults; host code appends via `registerPresets()`.

**When:** Any time server needs to hold plugin-scoped config that outlives a request.

**Why this over Strapi config:** Strapi's `config/` system requires static values at startup. Dynamic registration via user code in `register/bootstrap` needs a separate accumulation point. No DB is needed because presets are code, not data.

```typescript
// server/src/presets/registry.ts
const DEFAULT_PRESET_NAME = 'default';

const registry = new Map<string, PresetDefinition>();

// Populated at module load — before any host code runs
registry.set(DEFAULT_PRESET_NAME, defaultPreset);

export const presetRegistry = {
  register(presets: PresetDefinition[]) { ... },
  get(name: string): PresetDefinition { return registry.get(name) ?? registry.get(DEFAULT_PRESET_NAME)! },
  getAll(): PresetDefinition[] { return [...registry.values()] },
};
```

### Pattern 2: Extension Descriptor Type

**What:** A serializable plain object that names an extension and carries its configuration options.

**When:** Any time an extension needs to cross the server-admin boundary.

```typescript
// shared/ or server/src/types.ts
export type ExtensionType =
  | 'starterKit'
  | 'heading'
  | 'link'
  | 'table'
  | 'textAlign'
  | 'script';  // superscript + subscript

export interface TiptapPresetExtension {
  type: ExtensionType;
  options?: Record<string, unknown>;  // must be JSON-serializable
}

export interface PresetDefinition {
  name: string;
  label?: string;
  extensions: TiptapPresetExtension[];
}
```

The `ExtensionType` union is closed — only extensions bundled with the plugin are valid. The type is shared between server (type export for host apps) and admin (extension registry keying).

### Pattern 3: Admin Extension Registry

**What:** A static object mapping `ExtensionType` → factory function that returns one or more Tiptap `Extension` instances.

**When:** Admin side needs to convert a preset descriptor into live extension objects.

```typescript
// admin/src/extensions/registry.ts
type ExtensionFactory = (options?: Record<string, unknown>) => Extensions;

export const extensionRegistry: Record<ExtensionType, ExtensionFactory> = {
  starterKit: (opts) => [StarterKit.configure({ heading: false, link: { openOnClick: false }, ...opts })],
  heading:    (_opts) => [HeadingWithSEOTag],
  link:       (_opts) => [],  // included via StarterKit; no separate extension needed
  table:      (opts) => [Gapcursor, TableKit.configure({ table: { resizable: true }, ...opts })],
  textAlign:  (opts) => [TextAlign.configure({ types: ['heading', 'paragraph'], ...opts })],
  script:     (_opts) => [Superscript, Subscript],
};
```

### Pattern 4: Strapi Plugin Route (Admin-Accessible)

**What:** A Strapi plugin route with `auth: false` or scoped to authenticated admin users, using the `plugin` router type so it's prefixed correctly.

**When:** Plugin needs to expose data to the admin panel.

```typescript
// server/src/routes/index.ts
export default {
  'preset-routes': {
    type: 'admin',
    routes: [
      {
        method: 'GET',
        path: '/presets',
        handler: 'presets.findAll',
        config: { policies: [], auth: false },
      },
      {
        method: 'GET',
        path: '/presets/:name',
        handler: 'presets.findOne',
        config: { policies: [], auth: false },
      },
    ],
  },
};
```

Routes of type `admin` are prefixed `/tiptap-editor/` and served under `/api/`. The admin fetches from `/api/tiptap-editor/presets`.

**Confidence note (MEDIUM):** Route type `admin` vs `content-api` and exact URL prefix behavior verified against `@strapi/types/dist/core/route.d.ts` and `@strapi/types/dist/plugin/config/strapi-server/routes.d.ts`. Exact URL prefix (`/api/` vs `/`) needs verification against a running Strapi 5 instance or official plugin docs.

### Pattern 5: Enabled Flag on Extension Hooks

**What:** Each extension hook accepts an `enabled` boolean. When `false`, hook runs normally (avoids rules-of-hooks violation) but returns null for every button/dialog.

**When:** Toolbar rendering needs to be conditional based on active preset extensions.

```typescript
export function useStarterKit(
  editor: Editor,
  props: { disabled?: boolean; enabled?: boolean } = {}
) {
  const enabled = props.enabled ?? true;
  // ... existing useEditorState logic unchanged ...

  return {
    boldButton: enabled ? (<ToolbarButton ... />) : null,
    // ... rest of buttons
  };
}
```

`RichTextInput` passes `enabled={activeExtensionTypes.has('starterKit')}` to each hook. No conditional hook calls; rules of hooks satisfied.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Passing Tiptap Extension Objects Through API

**What:** Serializing Tiptap extension objects to JSON and returning them from the API.

**Why bad:** Tiptap extensions contain functions, ProseMirror plugin instances, and class methods. `JSON.stringify` will silently drop them, producing corrupted or empty extension objects. The editor will initialize without expected schema nodes, causing silent data loss.

**Instead:** API returns only `{ type: ExtensionType, options: Record<string, unknown> }`. The admin resolves these against its local registry.

### Anti-Pattern 2: Conditional Hook Calls in JSX

**What:** `if (activeExtensions.has('table')) { const table = useTable(editor) }`

**Why bad:** Violates React's rules of hooks. Hook call count must be stable across renders. React will throw in strict mode and produce undefined behavior in production.

**Instead:** Always call all hooks; pass `enabled` flag to suppress output. See Pattern 5.

### Anti-Pattern 3: Storing Preset Full Definition in Field Schema

**What:** Saving the entire `PresetDefinition` (all extension descriptors) in the field's content-type attribute options.

**Why bad:** Bloats every schema file. Creates sync problems — schema-stored definition diverges from server-registered definition when code changes. No single source of truth.

**Instead:** Store only the preset name string in `attribute.options.preset`. The canonical definition lives on the server. Admin fetches at render time.

### Anti-Pattern 4: Fetching Preset on Every Keystroke

**What:** Calling `usePresetConfig` inside the `onUpdate` callback, or without caching.

**Why bad:** The preset doesn't change while the editor is open. Refetching per-update hammers the API for no reason.

**Instead:** `usePresetConfig` fetches once on mount (when `presetName` is known). Cache with `useRef` or standard React `useState` + `useEffect` pattern. The preset is stable for the lifetime of the editor component.

### Anti-Pattern 5: Registering Presets After Bootstrap

**What:** Calling `registerPresets()` from outside Strapi's `register` or `bootstrap` lifecycle hooks, or lazy-loading from a route handler.

**Why bad:** The admin may request `/presets` before server-side registration code runs. Produces empty or partial preset lists. Race condition between admin boot and lazy registration.

**Instead:** Registration must complete in `register` or `bootstrap`. The module-level registry is read-only after bootstrap ends.

---

## Scalability Considerations

| Concern | Current Scale | Notes |
|---------|--------------|-------|
| Number of presets | 1–20 | Module-level Map lookup is O(1); no concern |
| Number of extensions per preset | 1–10 | Extension array is traversed once per editor mount; negligible |
| Admin API calls | Per editor mount, not per keystroke | One GET per field render; acceptable |
| Preset registry size | In-process memory | No persistence needed; resets on server restart which is expected behavior |
| Multiple Strapi instances | Each instance has its own registry | Not a concern for typical single-node deployments; note for cluster setups |

---

## Suggested Build Order

Dependencies flow in this order. Each step can only start when the previous is complete and verified.

**Step 1 — Shared types**
Define `ExtensionType`, `TiptapPresetExtension`, `PresetDefinition` in `shared/` or `server/src/types.ts`. These types are the contract between all other components.

**Step 2 — Server: PresetRegistry module**
Implement module-level registry with default preset pre-populated. No Strapi dependencies; pure TypeScript. Can be tested in isolation.

**Step 3 — Server: registerPresets() export**
Export the registration function from the server plugin index. Wire `register.ts` or `bootstrap.ts` to call it. Verify host app can call it before the API starts.

**Step 4 — Server: PresetsController + route**
Implement `findAll` and `findOne` handlers reading `PresetRegistry`. Add route definition. Verify with curl or REST client that `GET /api/tiptap-editor/presets` returns correct JSON.

**Step 5 — Admin: extensionRegistry**
Implement the static `ExtensionType → factory` map. This is pure code, no API calls; can be written and verified independently.

**Step 6 — Admin: usePresetConfig hook**
Implement fetch + resolve logic. Inputs: preset name string. Output: resolved `Extensions[]` and `Set<ExtensionType>`. Write with loading and fallback states.

**Step 7 — Admin: richTextField options config**
Add `preset` as a `select` option in the admin field definition's `options.advanced` array. This makes the CTB dropdown appear. Populate choices dynamically by fetching `/presets` or statically if CTB doesn't support dynamic option fetching.

**Step 8 — Admin: RichTextInput refactor**
Replace hardwired extensions array and unconditional hook calls with preset-aware version. Add `enabled` prop to each extension hook. Wire `usePresetConfig` result into both `useTiptapEditor` extensions argument and each hook's `enabled` flag.

**Step 9 — Backward compatibility verification**
Verify existing fields (no preset stored) fall back to default preset without crashes or empty editors.

---

## Key Architectural Decision: CTB Preset Dropdown

The `CustomFieldOptions` admin type allows adding options that appear in Content-Type Builder's field configuration UI. The `name` field is constrained to a fixed union (`min`, `max`, `default`, etc.) — `preset` is not in this union. Two viable paths:

**Path A — Use existing `options` mechanism with type assertion (LOW risk)**
Register a custom option with `name: 'preset' as CustomFieldOptionName` and `type: 'select'`. The underlying Strapi CTB code stores any string in `attribute.options[name]`. The TypeScript constraint is a compile-time check, not a runtime one. This is low risk but requires `as any` or a type assertion.

**Path B — Dynamic select using API-populated values (MEDIUM risk)**
The built-in `select` option type in CTB takes static `options`. To populate it from the API (i.e., show actual registered preset names), a custom CTB injection or a different mechanism is needed. This is more work and the CTB injection API surface is not in the analyzed types.

**Recommendation:** Use Path A for the initial implementation. Hardcode a `'preset'` name in the custom field option definition with a `select` input type. Accept the type assertion cost. The CTB stores the selected value in `attribute.options.preset` where `RichTextInput` can read it from `props.attribute.options.preset`.

**Confidence:** MEDIUM — verified that `CustomFieldOption.name` is constrained in types, and that the actual CTB storage uses the `name` string as an `attribute.options` key. The assertion approach is confirmed by the pattern used in the existing codebase (`as any` cast present in `admin/src/extensions/Heading.tsx`).

---

## Sources

- `admin/src/components/RichTextInput.tsx` — current extension composition and toolbar wiring
- `admin/src/extensions/StarterKit.tsx`, `Heading.tsx`, `Link.tsx`, `Table.tsx` — extension hook patterns
- `admin/src/utils/tiptapUtils.tsx` — `useTiptapEditor` hook signature and extension injection point
- `server/src/register.ts`, `bootstrap.ts` — server lifecycle entry points (currently minimal)
- `server/src/controllers/index.ts`, `routes/index.ts`, `services/index.ts` — confirmed empty stubs
- `node_modules/@strapi/types/dist/modules/custom-fields.d.ts` — `CustomFieldServerOptions` type
- `node_modules/@strapi/admin/dist/admin/src/core/apis/CustomFields.d.ts` — `CustomFieldOptions`, `CustomFieldOptionName` constraint
- `node_modules/@strapi/admin/dist/admin/src/hooks/useFetchClient.d.ts` — admin HTTP client
- `node_modules/@strapi/admin/dist/admin/src/utils/getFetchClient.d.ts` — `FetchClient` interface
- `node_modules/@strapi/types/dist/core/route.d.ts` — `RouteInput`, `RouteConfig`, `RouterType`
- `node_modules/@strapi/types/dist/plugin/config/strapi-server/routes.d.ts` — `NamedRoutes` with `type` field
- `.planning/PROJECT.md` — requirements and key decisions
- `.planning/codebase/ARCHITECTURE.md` — existing architecture baseline
