# Domain Pitfalls

**Domain:** Tiptap preset configuration system in a Strapi 5 plugin
**Researched:** 2026-03-10
**Confidence note:** All pitfalls grounded in direct codebase inspection. Web search unavailable; pitfalls are derived from code structure analysis, dist type inspection, and Strapi/Tiptap architectural patterns. Confidence is HIGH for codebase-specific pitfalls and MEDIUM for framework-level pitfalls based on training knowledge.

---

## Critical Pitfalls

Mistakes that cause rewrites, editor crashes, or silent data loss.

---

### Pitfall 1: StarterKit Cannot Be Partially Omitted — Only Configured

**What goes wrong:** The preset system models features as individual flags (`bold`, `italic`, `bulletList`, etc.), but all of these live inside `@tiptap/starter-kit`. You cannot simply exclude `StarterKit` to remove `bold` — you must call `StarterKit.configure({ bold: false })`. If `buildExtensions()` constructs the extensions array by omitting `StarterKit` entirely when any StarterKit feature is disabled, all other StarterKit features (document, paragraph, text, hardBreak, history, gapcursor) silently disappear too, breaking the editor.

**Why it happens:** `TiptapPresetConfig` in `shared/types.d.ts` exposes `bold`, `italic`, `strike`, etc. as top-level keys, which looks like they could each map to a separate extension. But `bold` is `StarterKit`'s internal mark. The distinction between "StarterKit feature" and "standalone extension" is not visible in the flat config shape.

**Consequences:**
- Editor renders without `Document`/`Paragraph`/`Text` nodes → completely blank, no content, no cursor
- `useEditor` throws internally because required node types are missing
- Fails silently: no crash message, editor just refuses to render content

**Prevention:**
- `buildExtensions()` MUST always include `StarterKit` as a base, using `.configure()` to disable individual features: `StarterKit.configure({ bold: preset.bold === false ? false : {}, ... })`
- Keep a clear internal list of which keys belong to StarterKit vs which are standalone extensions (Table, TextAlign, Superscript, Subscript, HeadingWithSEOTag, Link)
- Write an explicit mapping: `STARTER_KIT_FEATURES = ['bold', 'italic', 'underline', 'strike', 'code', 'codeBlock', 'blockquote', 'bulletList', 'orderedList', 'hardBreak', 'horizontalRule', 'history']`

**Detection:** Editor mounts but shows no content and cursor does not appear. `editor.schema.nodes` will be missing `paragraph` or `text`.

**Phase:** Core preset-to-extension mapping (buildExtensions implementation).

---

### Pitfall 2: `useEditor` Extensions Array Must Be Stable Across Renders

**What goes wrong:** The current `RichTextInput.tsx` passes a module-level constant `extensions` array to `useTiptapEditor`. When presets are introduced, `buildExtensions(config)` will be called inside the component, producing a new array on each render. Tiptap's `useEditor` treats a changed extensions array as a signal to destroy and recreate the editor instance, losing all unsaved content and scroll position.

**Why it happens:** `useEditor` accepts `extensions` as a prop and watches it for changes (Tiptap v3 behavior). A new array reference on each render — even with identical contents — triggers editor re-creation.

**Consequences:**
- Content manager types text; React re-renders (e.g., from Strapi admin state changes); editor resets to last saved content
- Selection and cursor position lost on every re-render
- Potential infinite loops if `onChange` triggers a parent state update that re-renders the component

**Prevention:**
- Compute the extensions array outside the component (module level or in a separate memoization layer), OR
- Use `useMemo` with a stable dependency: `const extensions = useMemo(() => buildExtensions(config), [presetName])` — depend only on `presetName`, not on the full config object
- Never derive extensions inside the render body without memoization
- The dependency MUST be `presetName` (string), not `config` (object), because object identity changes on each fetch response parse

**Detection:** Editor content disappears when clicking UI outside the editor. Console shows multiple `useEditor` initialization logs.

**Phase:** RichTextInput refactor to support preset-driven extensions.

---

### Pitfall 3: Extension Hooks Call `useEditorState` Regardless of Whether the Extension Is Loaded

**What goes wrong:** Every extension hook (`useTable`, `useLink`, `useHeading`, etc.) calls `useEditorState` with a selector that calls `editor.can().chain().insertTable().run()` or `editor.isActive('link')`. When the corresponding extension is not loaded (e.g., Table excluded from preset), `can().chain().insertTable()` does not just return `false` — in some Tiptap versions it throws because the command doesn't exist, or returns `undefined` and breaks the boolean coercion.

**Why it happens:** The hooks are designed to work with a full extension set. The `?? false` fallbacks in selectors protect against `null` but not against thrown exceptions from missing commands.

**Consequences:**
- `useEditorState` selector throws → React error boundary not present → entire Strapi admin panel page crashes
- The `CONCERNS.md` explicitly notes: "No React error boundaries around the editor. Editor crashes will propagate up and potentially crash the Strapi admin panel."

**Prevention:**
- Each extension hook should guard its `useEditorState` selector: `ctx.editor.extensionManager.extensions.some(e => e.name === 'table')` before calling table-specific commands
- OR: don't call extension hooks when the extension is absent — the conditional rendering of toolbar items must be matched by conditional hook calls (but React rules prevent conditional hook calls; use a wrapper component pattern instead)
- Preferred approach: extension hooks receive an `enabled: boolean` prop; when `false`, selectors return all-false defaults without querying the editor
- Add error boundaries around `BaseTiptapInput` before implementing preset conditional loading

**Detection:** Console shows `TypeError` or `Error: ... is not a function` from within a `useEditorState` selector when switching to a preset that excludes an extension.

**Phase:** Extension hook refactor must precede conditional loading implementation.

---

### Pitfall 4: Strapi Plugin Config vs. `registerPresets()` — Two Different Mechanisms With Different Timing

**What goes wrong:** The PROJECT.md describes a `registerPresets()` function called from Strapi's `register` or `bootstrap` lifecycle, but the dist types reveal the actual planned approach uses Strapi's built-in plugin config system (`config/index.ts` with `default: { presets: {} }`, and the service calling `strapi.config('plugin::tiptap-editor')`). Implementing both, or confusing which one is authoritative, creates a situation where presets registered via one mechanism are invisible to the service reading the other.

**Why it happens:** Strapi's plugin config system (defined in `plugins.ts` in the host application) and a custom `registerPresets()` call are superficially similar but completely separate code paths. The dist types show `TiptapPluginConfig` with `presets: Record<string, TiptapPresetConfig>`, which maps directly to Strapi config — not to a module-level registry.

**Consequences:**
- Developer calls `registerPresets(strapi, { myPreset: {...} })` per documentation, but `GET /tiptap-editor/presets` returns empty array because the service reads `strapi.config('plugin::tiptap-editor').presets` which was never populated
- Hard to debug: no error, just empty presets list

**Prevention:**
- Commit to one mechanism: Strapi plugin config is the correct, idiomatic approach for static configuration
- The host app configures in `config/plugins.ts`: `{ 'tiptap-editor': { enabled: true, config: { presets: { minimal: {...} } } } }`
- The service reads `strapi.config.get('plugin::tiptap-editor')` (note: Strapi 5 uses dot notation with `strapi.config.get`, not function call syntax)
- If `registerPresets()` is offered as a convenience API, it must write to the same config store — document this clearly

**Detection:** `GET /api/tiptap-editor/presets` returns empty list even after configuring presets.

**Phase:** Server-side preset service implementation.

---

### Pitfall 5: Content-API Route Without Auth Exposes Preset Config to Unauthenticated Requests

**What goes wrong:** The dist types show the preset route registered under `content-api` with `auth: false`. In Strapi 5, `content-api` routes are publicly accessible. Preset configuration is metadata-only (extension names and options, no user data), but `auth: false` means the endpoint is callable by anyone without a session, including bots. More critically, if the config accidentally exposes server-side logic or contains sensitive option values in the future, this becomes a leak vector.

**Why it happens:** The admin panel needs to fetch presets before the user is authenticated with the editor field (the field is inside content-type editing, where the user IS authenticated). Using `content-api` is the path of least resistance. The correct approach for Strapi plugin internal routes is the `admin` route type or verifying the request has a valid Strapi admin session.

**Consequences:**
- Low immediate risk for metadata-only endpoints
- Potentially breaks if Strapi 5 default middleware blocks unauthenticated requests to content-api in some configurations
- Admin panel may encounter CORS or auth errors fetching from the wrong route namespace

**Prevention:**
- Use the `admin` route type instead of `content-api` for plugin internal endpoints consumed only by the Strapi admin panel
- Admin routes are automatically protected by Strapi's admin JWT middleware
- The fetch call in `usePresetConfig` must use `useFetchClient` from `@strapi/strapi/admin` which automatically appends the admin auth token
- If `content-api` is kept, document explicitly why (e.g., future public preset discovery) and add at minimum an API token policy

**Detection:** Fetch from admin panel returns 401 or 403. Or: endpoint accessible from curl without auth header.

**Phase:** API route and admin fetch hook implementation.

---

## Moderate Pitfalls

---

### Pitfall 6: `useEditor` Receives `null` During Async Preset Fetch — Hooks Called With Null Editor

**What goes wrong:** When `usePresetConfig` fetches the preset from the server, there is a loading window (`isLoading: true`, `config: null`). During this window, `useTiptapEditor` is called with an empty or null extensions array, and the editor initializes with no extensions. All extension hooks receive this editor. `useEditorState` with a null-like editor will either throw or produce stale state, depending on how `useEditor` handles a null return.

**Why it happens:** React hooks must be called unconditionally. If the component waits for `isLoading` to be false before calling `useTiptapEditor`, it violates the rules of hooks. If it calls `useTiptapEditor` with an empty array, then updates extensions after load, Tiptap v3 may not support runtime extension updates cleanly.

**Consequences:**
- Brief flash of unstyled/broken editor before preset loads
- Extension hooks receive stale `editor` reference during transition
- If extensions change after initial mount, editor content may be re-parsed against new schema, potentially corrupting it

**Prevention:**
- Show a loading skeleton (not a partially initialized editor) while `isLoading` is true
- Pass `editable: false` to `useEditor` during loading state instead of showing a broken toolbar
- Consider pre-computing the default preset client-side so there is always a valid extension set before any fetch completes, with the fetched preset applied on first load only
- `MINIMAL_PRESET_CONFIG` is already exported from `usePresetConfig.d.ts` — use this as the immediate starting state

**Detection:** Brief flash of empty toolbar on field load. Network throttling reveals the broken intermediate state.

**Phase:** RichTextInput loading state handling.

---

### Pitfall 7: Schema-Stored Preset Name Diverges From Server-Side Preset Registry

**What goes wrong:** Content-Type Builder saves the selected preset name in the field's `options` schema (e.g., `options: { preset: 'minimal' }`). If that preset is later renamed, deleted, or never deployed to a new environment, the stored name refers to nothing. The current PROJECT.md requirement says "fall back to default preset." If this fallback is not explicitly implemented in `usePresetConfig`, the hook returns `null` and `buildExtensions(null)` receives a null config.

**Why it happens:** There is no foreign-key constraint on preset names — they are strings in a JSON schema. Drift happens across environments, after refactoring, or when a new team member deploys without configuring the plugin.

**Consequences:**
- `buildExtensions(null)` called → if null guard is absent, throws at runtime
- Content manager opens a field and sees no toolbar (silent fallback to empty extensions)
- Existing content may not render (missing marks) if the default preset has fewer extensions than the original

**Prevention:**
- `usePresetConfig` must return `MINIMAL_PRESET_CONFIG` (or full default preset) when the requested name is not found — never return `null` to `buildExtensions`
- Server `getPreset(name)` must return the default preset, not `null`, when name is missing
- Log a console warning (not error) when falling back: developer needs to know, but the editor should still work
- Test this path explicitly: load a field with `preset: 'does-not-exist'`

**Detection:** Field opens with empty toolbar in staging but not local. `GET /api/tiptap-editor/presets/does-not-exist` returns 404 or empty.

**Phase:** Preset service and usePresetConfig fallback logic.

---

### Pitfall 8: `HeadingWithSEOTag` Is a Custom Extension — Its Name Is Not Registered as 'heading' Without a Configure Call

**What goes wrong:** `HeadingWithSEOTag` is defined by calling `Heading.extend({...}).configure({ levels: [1,2,3,4] })`. When `buildExtensions` includes it based on `preset.heading !== false`, it must be added with the correct name so `editor.isActive('heading')` works. If `buildExtensions` accidentally includes both `HeadingWithSEOTag` AND the default `StarterKit` heading (by forgetting to pass `heading: false` to StarterKit), Tiptap throws a duplicate-extension error or silently uses one and ignores the other.

**Why it happens:** `RichTextInput.tsx` already handles this with `StarterKit.configure({ heading: false })` before adding `HeadingWithSEOTag`. But when `buildExtensions` re-implements this logic, the `heading: false` in `StarterKit.configure` must still happen even when `preset.heading` is truthy.

**Consequences:**
- Duplicate `heading` node type registered → Tiptap throws `Error: Extension "heading" is already registered`
- Or: heading content is stored with the custom `tag` attribute, then re-loaded against the base Heading extension, stripping the attribute silently

**Prevention:**
- `buildExtensions` must always pass `heading: false` to `StarterKit.configure()` and manage heading via `HeadingWithSEOTag` independently
- Write a specific test case: build extensions with `heading: true` and verify `editor.schema.nodes.heading` has the `tag` attribute

**Detection:** Console shows `Extension "heading" is already registered` at editor init. Or: SEO tag attribute disappears after save/reload cycle.

**Phase:** buildExtensions implementation for heading feature.

---

### Pitfall 9: Strapi Plugin Config Validator Runs at Boot — Type Errors Kill Server Start

**What goes wrong:** The `config/index.ts` has a `validator(config: unknown): void` function. If this validator uses Zod or throws on unexpected keys, a developer who passes a `TiptapPresetConfig` with an unsupported key (e.g., a typo: `boldd: true`) will see a cryptic Strapi boot error rather than a TypeScript error.

**Why it happens:** Strapi calls the validator at startup. TypeScript types for the config are only checked at compile time in the host app if the host app imports the plugin's types — which requires explicit type re-export from the plugin package.

**Consequences:**
- Server refuses to start with a validation error message pointing at the plugin config, not the specific field
- Developer wastes time debugging Strapi bootstrap rather than their config typo

**Prevention:**
- Export `TiptapPresetConfig` and `TiptapPluginConfig` types from the plugin's main entry point so host apps can use them: `import type { TiptapPresetConfig } from '@notum-cz/strapi-plugin-tiptap-editor'`
- The validator should produce specific error messages: `"Unknown preset key: boldd. Valid keys are: bold, italic, ..."`
- Do not use a strict validator that throws on unknown keys at boot; use a warning-only approach for unknown extension keys (forward compatibility)

**Detection:** `yarn develop` crashes with a Strapi bootstrap error mentioning `plugin::tiptap-editor` config.

**Phase:** TypeScript export surface and config validator implementation.

---

## Minor Pitfalls

---

### Pitfall 10: `useFetchClient` vs. `fetch` for Admin API Calls

**What goes wrong:** `usePresetConfig` must fetch from the plugin's API route. Using bare `fetch('/api/tiptap-editor/presets')` from the admin panel will fail because: (a) the path prefix may differ between Strapi installations, (b) the admin auth token is not automatically appended, (c) the Strapi admin uses its own CSRF/cookie mechanism.

**Prevention:** Use `useFetchClient` from `@strapi/strapi/admin`. This hook provides a `get`, `post`, etc. that are pre-configured with auth headers, base URL, and error handling consistent with the Strapi admin panel. The path should be relative: `/tiptap-editor/presets`.

**Phase:** usePresetConfig admin hook implementation.

---

### Pitfall 11: Table Manipulation Buttons Render From `useTable` But Are Context-Dependent — They Must Remain Hidden When Table Is Excluded

**What goes wrong:** In `RichTextInput.tsx`, the table manipulation buttons (`addColumnButton`, `removeColumnButton`, etc.) are rendered as siblings in the toolbar. They use `hidden` prop controlled by `editorState.canAddColumn` etc. When the Table extension is excluded from a preset, these buttons must not be rendered at all — not just hidden — because `useTable` will call `editor.can().chain().addColumnAfter()` on an editor with no Table extension, potentially throwing.

**Prevention:** When Table is excluded from the active preset, do not call `useTable` at all. Use the component-split pattern: a `TableToolbarSection` component that is only rendered when `config.table !== false`, encapsulating the `useTable` hook call.

**Phase:** Toolbar auto-detection / conditional rendering implementation.

---

### Pitfall 12: Content-Type Builder Dropdown Uses Preset Names as Keys — Renaming Breaks Existing Fields

**What goes wrong:** The preset `name` stored in field schema options is the string key used in `config.presets`. If the developer renames a preset (e.g., `minimal` → `simple`), all existing content-type fields that stored `preset: 'minimal'` will silently fall back to the default. Content managers won't know their field configuration changed.

**Prevention:** Document that preset names are stable identifiers — treat them like database migration names, not display labels. Use `label` for human-readable display and `name` (the key) as the permanent identifier. The dropdown in Content-Type Builder should display `label ?? name`.

**Phase:** Content-Type Builder integration (preset dropdown design).

---

### Pitfall 13: `isFeatureEnabled` / `getFeatureOptions` Utility Pattern Must Handle All Config Shapes

**What goes wrong:** The dist reveals `isFeatureEnabled(value)` and `getFeatureOptions(value, defaultValue)` utilities that will interpret `boolean | Record<string, unknown>` config values. If `isFeatureEnabled(undefined)` is not handled (e.g., when a key is absent from the preset entirely), `buildExtensions` may include an extension when the key is absent rather than applying the default behavior.

**Prevention:** `isFeatureEnabled(undefined)` must return `true` (absent = use default = enabled) for all extensions. The default preset is "everything enabled," so missing keys should fall through to enabled. This must be explicitly tested: a preset `{}` (empty object) should produce the full default extension set.

**Phase:** buildExtensions and featureToggle utility implementation.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|----------------|------------|
| `buildExtensions` implementation | StarterKit partial disable (Pitfall 1), HeadingWithSEOTag duplicate (Pitfall 8), featureToggle undefined handling (Pitfall 13) | Implement as pure function with exhaustive tests for each extension flag combination |
| RichTextInput preset integration | Extensions array instability (Pitfall 2), null editor during load (Pitfall 6) | Memoize on presetName string, show skeleton during load |
| Extension hook conditional rendering | useEditorState crash on missing extension (Pitfall 3), table buttons with no Table (Pitfall 11) | Add error boundaries before this phase; split hooks into per-extension components |
| Server-side preset service | Config vs registerPresets mechanism confusion (Pitfall 4), config validator crashes boot (Pitfall 9) | Commit to Strapi plugin config pattern; use warning-only validator |
| API route + usePresetConfig fetch | Auth on content-api route (Pitfall 5), useFetchClient vs fetch (Pitfall 10) | Use admin route type + useFetchClient |
| Content-Type Builder preset dropdown | Preset name rename breaks fields (Pitfall 12), missing preset fallback (Pitfall 7) | Treat names as permanent keys; always implement fallback to default preset |

---

## Sources

- Direct inspection of `admin/src/components/RichTextInput.tsx` — extension array structure and hook call pattern
- Direct inspection of `admin/src/extensions/*.tsx` — `useEditorState` selectors for each extension hook
- Direct inspection of `dist/shared/types.d.ts` — `TiptapPresetConfig`, `TiptapPluginConfig` type shapes
- Direct inspection of `dist/admin/src/hooks/usePresetConfig.d.ts` — `MINIMAL_PRESET_CONFIG` export, hook signature
- Direct inspection of `dist/admin/src/utils/buildExtensions.d.ts` — `buildExtensions`, `isFeatureEnabled`, `getFeatureOptions` signatures
- Direct inspection of `dist/server/src/index.d.ts` — route structure, auth: false, content-api type
- Direct inspection of `dist/server/src/services/preset.d.ts` — service reads config, returns null on missing preset
- `.planning/codebase/CONCERNS.md` — missing error boundaries, `useEditorState` re-render risks
- `.planning/PROJECT.md` — requirements, constraints, key architectural decisions
- Tiptap v3 `useEditor` extension stability behavior: MEDIUM confidence (training knowledge, not verified against Tiptap 3.19.0 docs)
- Strapi 5 plugin config system (`strapi.config.get`, validator timing): MEDIUM confidence (training knowledge aligned with observed config/index.d.ts shape)
