# Pitfalls Research

**Domain:** Tiptap preset configuration system in a Strapi 5 plugin — v1.1 Media Library image support
**Researched:** 2026-03-16
**Confidence:** HIGH for codebase-specific pitfalls (direct inspection). MEDIUM for framework-level pitfalls (web-verified). LOW where noted.

---

## Critical Pitfalls

Mistakes that cause rewrites, editor crashes, or silent data loss.

---

### Pitfall 1: Wrong API to Open the Strapi Media Library Picker

**What goes wrong:**
`useLibrary` from `@strapi/helper-plugin` does not exist in Strapi 5. Developers copy v4 examples or Strapi documentation WYSIWYG field examples and get a runtime error because the hook is gone. The replacement pattern — `useStrapiApp('myId', (state) => state.components)` — works but has a documented failure mode: if `@strapi/strapi` is listed as a `devDependency` in the plugin's own `package.json`, the host app and plugin load two separate module instances and `useStrapiApp` returns `null` or `undefined`.

**Why it happens:**
Strapi 5 moved from a `useLibrary` hook in the deprecated `helper-plugin` to `useStrapiApp`. Documentation is sparse. Strapi GitHub issue #21957 shows this exact trap — the fix is to remove `@strapi/strapi` from plugin devDependencies so the plugin shares the host's module instance.

**How to avoid:**
- Use the correct v5 pattern:
  ```typescript
  import { useStrapiApp } from '@strapi/strapi/admin';
  const components = useStrapiApp('TiptapMediaLibrary', (state) => state.components);
  const MediaLibraryDialog = components['media-library'];
  ```
- Render `<MediaLibraryDialog onClose={onClose} onSelectAssets={handleSelectAssets} />` when picker is open.
- Do NOT list `@strapi/strapi` as a devDependency in `package.json`. Use `peerDependencies` only. Verify this is already the case before implementation.

**Warning signs:**
- `useStrapiApp` returns `null` or `state` is null — duplicate module instance.
- `components['media-library']` is `undefined` — `@strapi/strapi` version mismatch.
- Runtime error mentioning `"must be used within StrapiApp"` — component is not inside the Strapi admin React tree.

**Phase to address:** Phase implementing the MediaLibrary toolbar button and dialog.

---

### Pitfall 2: Image Node Schema Does Not Include Custom Attributes — Silent Strip on Load

**What goes wrong:**
Tiptap's built-in Image extension only supports `src`, `alt`, and `title`. If you store `{ type: 'image', attrs: { src, alt, alignment, strapiAssetId } }` in the database but later load the content against an Image extension that has no `alignment` or `strapiAssetId` attribute in its schema, ProseMirror silently strips those attributes. The image still renders but the alignment is lost and the asset ID is gone — unrecoverable without a database migration.

**Why it happens:**
ProseMirror's schema validation is strict: attributes not declared in `addAttributes()` are discarded during content parsing. Tiptap's `enableContentCheck` option is `false` by default, so no error is emitted. This is confirmed in the Tiptap "Invalid schema handling" guide: "Content which doesn't fit the schema is thrown away."

**How to avoid:**
- Create a custom `MediaLibraryImage` extension that **extends** the base Image extension (do not use Image directly) and declares all custom attributes in `addAttributes()`:
  ```typescript
  const MediaLibraryImage = Image.extend({
    addAttributes() {
      return {
        ...this.parent?.(),
        alignment: { default: 'center', parseHTML: el => el.getAttribute('data-align'), renderHTML: attrs => ({ 'data-align': attrs.alignment }) },
        strapiAssetId: { default: null, parseHTML: el => el.getAttribute('data-strapi-id'), renderHTML: attrs => attrs.strapiAssetId ? ({ 'data-strapi-id': String(attrs.strapiAssetId) }) : {} },
      };
    },
  });
  ```
- Define the schema in Phase 1 before writing any image content to the database. Never change attribute names once content is in production.
- Write a fixture test that round-trips `{ type: 'image', attrs: { src, alt, alignment, strapiAssetId } }` through the schema and asserts the attributes are preserved.

**Warning signs:**
- Images load but always appear centered regardless of what was saved.
- Asset ID in stored JSON is absent after a save/reload cycle.
- ProseMirror console warning about unknown attribute (only visible when `enableContentCheck: true`).

**Phase to address:** Image extension schema definition phase — must be done before any content is written.

---

### Pitfall 3: URL Breaks Across Environments — Storing Only the URL, Not the Asset ID

**What goes wrong:**
Strapi's local upload provider stores asset URLs as relative paths like `/uploads/my-image_abc123.jpg`. If image content is stored with only `src: "/uploads/my-image_abc123.jpg"` and the project later switches to an S3 or Cloudinary provider, those relative paths point nowhere. The same problem occurs when exporting data from staging to production or vice versa.

**Why it happens:**
The Media Library picker returns an asset object with both `id` (integer) and `url` (string). It is tempting to only store the `url` because it is what `<img src>` needs. But the `id` is what allows the image to be resolved via the Strapi upload API across environments and providers. Without the `id`, there is no programmatic way to reconstruct the correct URL after a provider switch.

**How to avoid:**
- Always store both `src` (the URL at time of insertion) AND `strapiAssetId` (the numeric `id` from the Media Library response) in the Tiptap image node attributes.
- Document that front-end rendering layers should use `strapiAssetId` to fetch the current URL via the Strapi API rather than relying on the stored `src` for long-lived or cross-environment use.
- Validate that `strapiAssetId` is always set when inserting via the picker (throw if missing, do not silently omit it).

**Warning signs:**
- Broken images in production after deploying a new Strapi instance with S3 provider.
- Images that work locally but not on staging.
- `strapiAssetId` is `null` in stored JSON content.

**Phase to address:** Image insertion handler, alongside the schema definition phase.

---

### Pitfall 4: Image Alignment Using `TextAlign` Extension — Conflict With Block Node Model

**What goes wrong:**
`TextAlign` adds a `textAlign` style attribute to nodes listed in its `types` array (typically `['heading', 'paragraph']`). Adding `'image'` to this array seems like the easiest way to get image alignment, but it breaks because:
1. `TextAlign` applies `style="text-align: left"` to the node wrapper, not the `<img>` tag itself, which has no visible effect for a block image element.
2. If the same `textAlign` attribute is declared both by `TextAlign` (via `addGlobalAttributes`) and by a custom Image extension (via `addAttributes`), Tiptap throws a schema conflict or silently uses one definition.
3. The stored JSON will contain `{ "textAlign": "left" }` which is semantically ambiguous (is this aligning text inside the image caption, or positioning the image?).

**Why it happens:**
`TextAlign` is designed for block containers that hold text content. The `image` node is a leaf node (no children). Developers see it is a block node and assume `TextAlign` applies uniformly.

**How to avoid:**
- Use a **custom `alignment` attribute** on the MediaLibraryImage extension, not `TextAlign`. Store as `data-align` in HTML.
- Control alignment via CSS on the image or its wrapper:
  ```css
  .ProseMirror img[data-align='left'] { display: block; margin-right: auto; }
  .ProseMirror img[data-align='center'] { display: block; margin: 0 auto; }
  .ProseMirror img[data-align='right'] { display: block; margin-left: auto; }
  ```
- Do NOT add `'image'` to `TextAlign`'s `types` array.
- The `buildExtensions` function already configures `TextAlign.configure({ types: ['heading', 'paragraph'] })` — do not modify those types when adding image support.

**Warning signs:**
- Alignment toolbar buttons appear active but images do not shift position.
- Schema conflict error at editor initialization: `Duplicate attribute "textAlign" on node "image"`.
- Alignment attribute disappears after a save/reload cycle.

**Phase to address:** Image extension schema definition phase, before any CSS is written.

---

### Pitfall 5: Non-Image Assets Selected From the Media Library Picker

**What goes wrong:**
The Media Library picker allows selection of any asset type (images, videos, PDFs, audio). If the user selects a PDF or video and the handler calls `editor.commands.setImage({ src: file.url })`, the editor inserts an image node with a non-image `src`. The browser renders a broken `<img>` tag. There is no Tiptap-level validation of the `src` URL format.

**Why it happens:**
The `MediaLibraryDialog` component does not enforce a type filter by default. It shows all uploaded assets. The `onSelectAssets` callback receives whatever the user selected, including non-image MIME types. The Strapi asset object always has a `mime` field.

**How to avoid:**
- Filter the `onSelectAssets` callback: only process assets where `file.mime.startsWith('image/')`.
- If non-image assets are selected, show a Strapi design system `Notification` warning: "Only image files can be inserted into the editor."
- For multi-select (if permitted), insert only image assets and skip others with a warning count.
- Consider passing `allowedTypes: ['images']` if the MediaLibraryDialog component supports it — verify this prop exists in the Strapi 5 version before relying on it (MEDIUM confidence it exists; it is present in v4 and referenced in community examples but not confirmed in official v5 docs).

**Warning signs:**
- Broken image icons appearing in editor after selecting a PDF.
- No visible error when user selects video from picker.

**Phase to address:** Media Library picker integration phase.

---

### Pitfall 6: `mediaLibrary` Preset Key Not Added to `PRESET_FEATURE_KEYS` and `TiptapPresetConfig`

**What goes wrong:**
The preset system's config validator iterates `PRESET_FEATURE_KEYS` to reject unknown keys at boot. If `mediaLibrary` is added to `TiptapPresetConfig` as a TypeScript property but not added to `PRESET_FEATURE_KEYS`, the validator will either silently ignore it (if the validator only checks for unknown keys, not for missing known keys) or reject it as unknown (if the array is used as an allowlist). Either way, `isFeatureEnabled(config.mediaLibrary)` will be called correctly by TypeScript, but the validator won't cover it.

Similarly, the `fixtures/all-features-payload.json` Tiptap content fixture (per `CLAUDE.md` instructions) must be updated to exercise image nodes whenever the image extension is added.

**Why it happens:**
The `PRESET_FEATURE_KEYS` array and `TiptapPresetConfig` interface must be kept in sync manually — TypeScript does not enforce this. It is easy to update the interface and forget the array. The `CLAUDE.md` fixture maintenance rule exists precisely because this was identified as a recurring drift point.

**How to avoid:**
- Add `mediaLibrary` to `TiptapPresetConfig` AND `PRESET_FEATURE_KEYS` in the same commit.
- Define a `MediaLibraryConfig` type in `shared/types.ts` for the options object (e.g., `{ defaultAlignment?: 'left' | 'center' | 'right' }`).
- Update `fixtures/all-features-payload.json` to include at least one image node with `src`, `alt`, `alignment`, and `strapiAssetId` attributes — as required by `CLAUDE.md`.
- Add a compile-time check: `const _check: Record<keyof TiptapPresetConfig, true> = Object.fromEntries(PRESET_FEATURE_KEYS.map(k => [k, true])) as any` — this will fail TypeScript if the two lists diverge.

**Warning signs:**
- Config validator accepts `{ mediaLibrary: true }` without any validation.
- `isFeatureEnabled(config.mediaLibrary)` always returns `false` even when `mediaLibrary: true` — because the key is missing from the validator/config path.
- `fixtures/all-features-payload.json` does not contain an image node after shipping image support.

**Phase to address:** Type definition and preset gating phase — must be the first phase before any image UI.

---

### Pitfall 7: Image Node Stripped When `mediaLibrary` Preset Is Disabled

**What goes wrong:**
When a content type field's preset does not include `mediaLibrary: true`, the `buildExtensions` function will not add the MediaLibraryImage extension. If that field's stored JSON contains image nodes from when the feature was previously enabled, Tiptap will load the editor without the Image extension registered, and ProseMirror will silently drop all image nodes from the document. The content manager saves, and the images are permanently deleted from the content record.

**Why it happens:**
This is the same mechanism as Pitfall 2, but triggered by a legitimate configuration decision rather than a schema oversight. Removing an extension does not warn about content that was stored with that extension's node types.

**How to avoid:**
- Enable `enableContentCheck: true` in `useEditor` so `contentError` events are emitted when unknown nodes are encountered.
- On `contentError`, do NOT auto-save the document. Show a warning: "This content contains images but the media library feature is not enabled for this field. Images will be preserved but cannot be edited."
- Implement a read-only fallback: if `contentError` fires for image nodes, re-register a minimal read-only Image extension that preserves the node without toolbar controls.
- Document in the preset configuration guide: "Disabling mediaLibrary on a field that already has image content will cause images to become uneditable. Remove all images before disabling this feature."

**Warning signs:**
- Images present in database JSON content but not visible in editor after a config change.
- No error or warning when loading content with image nodes in a preset without `mediaLibrary: true`.

**Phase to address:** `buildExtensions` image extension gate, and `useEditor` configuration phase.

---

### Pitfall 8: Alt Text Prefill Logic Fails on Strapi `alternativeText` Being `null`

**What goes wrong:**
The Strapi asset object has an `alternativeText` field that is `null` by default (not an empty string). If the alt text prefill logic does `alt: file.alternativeText || file.name`, this correctly falls back to the filename. But if the UI pre-populates an alt text input field with `file.alternativeText` and the input does not handle `null`, it renders `"null"` as a string in the text field — a visible accessibility regression.

**Why it happens:**
JavaScript `null || file.name` works as expected, but `defaultValue={file.alternativeText}` in a React input with `null` renders the string `"null"` because `null` is coerced to the string `"null"` in some React input scenarios (particularly when the `value` or `defaultValue` prop transitions from `null` to a string during re-renders).

**How to avoid:**
- Always normalize: `const prefillAlt = file.alternativeText ?? file.name ?? '';` — use nullish coalescing, not `||`, to avoid collapsing empty string `""` to the filename.
- In the alt text input: `defaultValue={prefillAlt}` where `prefillAlt` is guaranteed to be a string.
- Write a unit test: if `file.alternativeText` is `null`, the prefilled value must be the filename, not the string `"null"`.

**Warning signs:**
- Alt text input field shows `"null"` text after selecting an asset with no alternative text set.
- `alt="null"` in the rendered HTML source.

**Phase to address:** Image insertion dialog / alt text UI phase.

---

## Moderate Pitfalls

---

### Pitfall 9: `useImage` Hook Called Even When `mediaLibrary` Is Disabled — Same `useEditorState` Crash Pattern

**What goes wrong:**
The existing extension hooks (`useTable`, `useLink`, etc.) all call `useEditorState` with selectors that query the editor for extension-specific commands. The pattern from Pitfall 3 (original PITFALLS.md) applies equally to the new image hook: if `useImage` is defined and called in `RichTextInput.tsx` unconditionally, it will call `editor.can().setImage(...)` on an editor where the Image extension is not loaded, either throwing or returning `undefined`.

**Why it happens:**
React rules of hooks prevent calling hooks conditionally. The existing pattern is to call all extension hooks always, then use `FeatureGuard` to conditionally render the toolbar UI. But the hook's `useEditorState` selector runs regardless of `FeatureGuard`.

**How to avoid:**
- Follow the existing pattern for gating: use `FeatureGuard` for the toolbar button rendering.
- The `useImage` selector must guard against missing extension: `ctx.editor.extensionManager.extensions.some(e => e.name === 'mediaLibraryImage')` before calling `setImage` commands.
- Alternatively, pass `enabled: boolean` to the hook and return all-false defaults when `enabled` is false, without querying the editor.

**Warning signs:**
- Console throws when a preset without `mediaLibrary: true` loads an editor.
- Same pattern as the existing Pitfall 3 warning signs.

**Phase to address:** `useImage` hook implementation phase.

---

### Pitfall 10: Image Alignment CSS Conflicts With Existing `.ProseMirror` Styles

**What goes wrong:**
`TiptapInputStyles.ts` already defines `.ProseMirror *:first-child { margin-top: 0 }` and `img` elements inherit from `*`. The existing table styles use `table-layout: fixed; width: 100%`. If image alignment uses `float` (float-left / float-right approach), it will conflict with adjacent table cells and the `overflow: auto` on the editor's scrollable region. The `max-height: 60vh; overflow-y: auto` on `.ProseMirror` will clip floated images in unexpected ways.

**Why it happens:**
Float-based alignment is tempting because it produces text wrapping, but it breaks out of normal document flow in ways that interact badly with the existing table and scrolling CSS. The `data-align` + margin approach is safer because it keeps images in normal document flow.

**How to avoid:**
- Use the `data-align` attribute approach (confirmed by Tiptap ImageAlignButton documentation), not CSS floats.
- Add image styles as a separate block in `TiptapInputStyles.ts`, not inline in the extension:
  ```css
  .ProseMirror img {
    max-width: 100%;
    height: auto;
    display: block;
  }
  .ProseMirror img[data-align='left'] { margin-right: auto; }
  .ProseMirror img[data-align='center'] { margin: 0 auto; }
  .ProseMirror img[data-align='right'] { margin-left: auto; }
  ```
- Do not add `float` to any image alignment CSS.
- Test alignment with a table immediately before and after the image.

**Warning signs:**
- Images overlap table borders when aligned left or right.
- Scrollbar behaves erratically when editor contains floated images.
- Image escapes the `.ProseMirror` container boundaries.

**Phase to address:** Image CSS / `TiptapInputStyles.ts` update phase.

---

### Pitfall 11: Strapi Asset Object Shape — `url` May Be Relative, `formats` May Be Absent

**What goes wrong:**
The Strapi upload plugin returns asset objects with:
- `url`: string, may be relative (`/uploads/img.jpg`) with local provider or absolute (`https://...`) with S3/Cloudinary.
- `formats`: object with responsive variants, may be `null` or absent for SVGs, GIFs, and files below the responsive breakpoints.
- `alternativeText`: string or `null`.
- `mime`: string like `"image/png"`.

Code that assumes `file.url` is always absolute will break in local development. Code that does `file.formats.thumbnail.url` will throw when `formats` is `null`.

**How to avoid:**
- Always treat `url` as potentially relative. If it starts with `/`, prefix with the Strapi backend URL. Use `window.location.origin` as a fallback only; prefer a config-driven base URL.
- Guard all `formats` access: `file.formats?.thumbnail?.url ?? file.url`.
- Use `file.url` as the canonical `src` for insertion, not `file.formats.large.url` (which may not exist).

**Warning signs:**
- Images load in development but broken in production (relative vs absolute URL).
- TypeError: Cannot read property 'thumbnail' of null.

**Phase to address:** Media Library asset selection handler phase.

---

### Pitfall 12: `buildExtensions` Memoization — `presetName` Dependency Must Still Work for Image Extension Changes

**What goes wrong:**
The current `RichTextInput.tsx` correctly memoizes extensions on `presetName` string rather than the `config` object. This is documented in the existing PITFALLS.md (Pitfall 2). When adding `mediaLibrary` to the preset, this memoization is still correct — the extension set changes only when the preset name changes. However, if `MediaLibraryConfig` adds an option like `defaultAlignment: 'left'` and this option is consumed at extension configuration time (e.g., passed to `MediaLibraryImage.configure({ defaultAlignment })`), the memoization on `presetName` alone would miss a re-configuration when only the option changes with the same preset name.

**How to avoid:**
- If `MediaLibraryConfig` options affect extension configuration (not just toolbar behavior), either include the relevant option values in the memoization key or restructure so extension configuration uses sensible defaults and options are applied at command time (not extension registration time).
- Simpler: do not configure `defaultAlignment` at the extension level. Apply it in the `setImage` command call instead.

**Warning signs:**
- Default alignment setting in preset has no effect until the page is reloaded.
- Changing `defaultAlignment` in config and restarting Strapi shows no change in the editor.

**Phase to address:** `buildExtensions` update to add MediaLibraryImage extension.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Store only `src` URL, no `strapiAssetId` | Simpler schema, fewer attributes | URL breaks on provider switch; no way to re-resolve asset | Never — always store asset ID |
| Use `TextAlign` for image alignment | Reuses existing extension | Attribute conflict, no visual effect on leaf nodes | Never |
| Prefill alt text with filename without null-guard | Less boilerplate | `"null"` string appears in alt text | Never |
| Skip `mime` type guard on `onSelectAssets` | Fewer lines of code | PDFs/videos inserted as broken `<img>` tags | Never — always guard mime type |
| Use float-based alignment CSS | Text wraps around images | Breaks scroll container and table layout | Never in this editor's CSS context |
| Omit `enableContentCheck` | Less noisy during dev | Silent image deletion when preset is disabled | Acceptable for MVP if documented; add in hardening phase |

---

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Strapi Media Library picker (v5) | Using `useLibrary` from `helper-plugin` (v4 API) | `useStrapiApp` from `@strapi/strapi/admin`, accessing `state.components['media-library']` |
| Strapi Media Library picker (v5) | Plugin has `@strapi/strapi` as devDependency, causing duplicate module instance | Remove `@strapi/strapi` from devDependencies; use peerDependencies only |
| Strapi asset object | Assuming `url` is always absolute | Guard for relative path; prepend backend origin when `url.startsWith('/')` |
| Strapi asset object | Accessing `file.formats.thumbnail` directly | Guard: `file.formats?.thumbnail?.url ?? file.url` |
| Tiptap Image extension | Using base `Image` extension without `addAttributes` override | Always extend Image and declare all custom attributes in `addAttributes()` |
| Tiptap schema | Loading stored content without the Image extension registered | Enable `enableContentCheck`, handle `contentError` event, do not auto-save on schema error |

---

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Opening MediaLibraryDialog without lazy loading | Strapi media library loads all assets upfront on picker open | MediaLibraryDialog has built-in pagination; do not pre-fetch assets yourself | N/A — the dialog handles this; avoid bypassing it |
| Re-creating editor on every render when MediaLibraryDialog closes | Editor resets content when picker is dismissed | MediaLibraryDialog open/close state must be managed outside `useEditor`; closing the picker must not trigger `buildExtensions` recomputation | Noticeable immediately — editor flickers on every picker close |
| Storing base64-encoded images in JSON content | Works in dev with copy-paste | JSON field grows unboundedly; Strapi database row size limit hit; API payload becomes huge | At ~5 images with base64 encoding the field content exceeds reasonable JSON column sizes |

---

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Allowing arbitrary `src` URLs in `setImage` command (not from Media Library picker only) | XSS via `javascript:` URI in image `src` | Validate that `src` is http/https and matches the Strapi backend origin or a configured allowed CDN domain before calling `setImage` |
| Storing `strapiAssetId` in client-visible JSON without access control | Exposes internal Strapi asset IDs to API consumers | Asset IDs are not secret (they are returned by the public upload API), but document that this is by design |

---

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No loading state while Media Library picker opens | UI appears frozen for 1–2 seconds while the picker mounts | Show a spinner or disable the toolbar button until the dialog mounts |
| Alt text is not pre-filled from Media Library metadata | Content manager must type alt text manually every time | Pre-fill from `file.alternativeText ?? file.name`, with the field editable |
| No visual indicator that image is selected in editor | Content manager cannot tell which image they are about to align | The image node should show a selected state (Tiptap NodeSelection class handles this; add a selected-state CSS rule) |
| Alignment buttons always active even when no image is selected | Clicking alignment with cursor in a paragraph throws or has no effect | Disable alignment buttons when `editor.isActive('mediaLibraryImage')` is false |
| Picker inserts all selected images at once with no cursor position feedback | Multiple images inserted in wrong order or location | Insert images sequentially at the current cursor position, one after another |

---

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Image insertion**: Image appears in editor — verify `strapiAssetId` is stored in the JSON output, not just `src`.
- [ ] **Alt text**: Dialog shows pre-filled alt — verify the stored `alt` attribute in the JSON is the edited value, not the pre-fill.
- [ ] **Alignment**: Alignment buttons toggle active state — verify the `data-align` attribute is persisted in the JSON and applied as CSS on reload.
- [ ] **Preset gating**: Image toolbar hidden when `mediaLibrary` is absent from preset — verify the Image extension is also absent from `buildExtensions` output (not just the toolbar button).
- [ ] **Content preservation**: Image appears in editor — verify enabling `enableContentCheck` and loading content without Image extension does NOT silently save (deleting) the images.
- [ ] **MIME guard**: Image inserts from picker — verify that selecting a PDF from the picker shows a warning and does NOT insert a broken `<img>` element.
- [ ] **PRESET_FEATURE_KEYS sync**: `mediaLibrary` in `TiptapPresetConfig` — verify `PRESET_FEATURE_KEYS` array contains `'mediaLibrary'`.
- [ ] **Fixture updated**: Image support shipped — verify `fixtures/all-features-payload.json` contains an image node with all custom attributes (per `CLAUDE.md` requirement).

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Image attributes stripped (Pitfall 2) | HIGH | Write a database migration script that reads all JSON field values, identifies image nodes missing `alignment` or `strapiAssetId`, and re-inserts default values. Requires knowing which Strapi content types use the tiptap-editor field. |
| URL stored without asset ID (Pitfall 3) | HIGH | Match stored URLs to Strapi Upload API asset list by URL. Re-populate `strapiAssetId` via a one-time script. Only possible while the assets still exist on the same Strapi instance. |
| Images silently deleted by preset disable (Pitfall 7) | HIGH | Restore from database backup. There is no programmatic recovery once ProseMirror has parsed and saved the stripped content. |
| Alt text shows "null" in production (Pitfall 8) | LOW | Deploy fix; existing content has `alt="null"` stored — write a content migration to null-out the `alt` attribute on affected nodes so front-ends fall back gracefully. |
| TextAlign conflict with image (Pitfall 4) | MEDIUM | Remove `'image'` from TextAlign `types`, add `alignment` attribute to Image extension, write a migration that converts `{ textAlign: 'left' }` on image nodes to `{ alignment: 'left' }`. |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Wrong Media Library picker API (Pitfall 1) | Phase: Media Library picker integration | `useStrapiApp` returns non-null; picker opens and returns asset objects |
| Image node schema missing custom attributes (Pitfall 2) | Phase: Image extension schema definition | Round-trip fixture test: `alignment` and `strapiAssetId` survive parse/serialize cycle |
| URL without asset ID (Pitfall 3) | Phase: Image insertion handler | Stored JSON contains both `src` and `strapiAssetId` for every inserted image |
| TextAlign conflict (Pitfall 4) | Phase: Image extension schema definition | `editor.schema.nodes.mediaLibraryImage.spec.attrs` contains `alignment`, not `textAlign` |
| Non-image asset MIME guard (Pitfall 5) | Phase: Media Library picker integration | Selecting a PDF shows warning, does not insert image node |
| `PRESET_FEATURE_KEYS` sync (Pitfall 6) | Phase: Type definitions and preset gating | Compile-time check; fixture maintenance check |
| Image stripped when feature disabled (Pitfall 7) | Phase: `buildExtensions` gating + `enableContentCheck` | Load image-containing JSON in a preset without `mediaLibrary`; `contentError` fires, no auto-save |
| Alt text null prefill (Pitfall 8) | Phase: Image insertion dialog | Unit test: `alternativeText: null` → prefilled value is filename string, not `"null"` |
| `useImage` hook crash when disabled (Pitfall 9) | Phase: `useImage` hook implementation | Load preset without `mediaLibrary: true`; no console errors from `useEditorState` selector |
| CSS alignment conflicts (Pitfall 10) | Phase: CSS / `TiptapInputStyles.ts` update | Visual test: aligned image adjacent to table shows no overlap |
| Strapi asset shape edge cases (Pitfall 11) | Phase: Media Library picker integration | Test with local provider (relative URL) and assert absolute URL is inserted |
| Memoization with config options (Pitfall 12) | Phase: `buildExtensions` update | Change `defaultAlignment` in preset config; editor applies new default on next mount |

---

## Sources

- Direct inspection of `admin/src/components/RichTextInput.tsx` — extension hook call pattern, FeatureGuard usage
- Direct inspection of `admin/src/utils/buildExtensions.ts` — TextAlign types configuration, extension array construction
- Direct inspection of `shared/types.ts` — `TiptapPresetConfig`, `PRESET_FEATURE_KEYS`, `isFeatureEnabled`, `getFeatureOptions`
- Direct inspection of `admin/src/components/TiptapInputStyles.ts` — existing CSS, ProseMirror styles
- Strapi GitHub issue #21957: `useStrapiApp` hook with ImageDialog throws error in Strapi 5 plugin (duplicate module instance root cause) — MEDIUM confidence
- Strapi GitHub issue #22625: `useLibrary` deprecated in v5, replacement pattern confirmed as `useStrapiApp` — HIGH confidence (multiple community confirmations)
- Strapi GitHub issue #22667: Correct MediaLibraryDialog props (`onClose`, `onSelectAssets`) — MEDIUM confidence
- Tiptap documentation, "Invalid schema handling": ProseMirror silently strips unknown node attributes — HIGH confidence (official docs)
- Tiptap documentation, Image extension: built-in attributes are `src`, `alt`, `title` only — HIGH confidence (official docs)
- Tiptap documentation, ImageAlignButton component: uses `data-align` attribute approach, not TextAlign — HIGH confidence (official docs)
- Strapi upload API response format: `id`, `url`, `alternativeText`, `mime`, `formats` fields — HIGH confidence (official docs)
- Strapi media provider documentation: local provider stores relative `/uploads/` URLs; cloud providers store absolute URLs — HIGH confidence (official docs)
- Web search: TextAlign extension `types` array controls which nodes get `textAlign` attribute; adding `'image'` is a documented community pattern but conflicts with custom alignment attributes — MEDIUM confidence
- `.planning/PROJECT.md` — v1.1 milestone goals, existing architecture constraints

---

## Preserved v1.0 Pitfalls (Still Applicable)

The original pitfalls from the preset system implementation remain valid. Key ones most relevant to v1.1:

- **Pitfall 2 (original): `useEditor` extensions array must be stable** — still applies; `buildExtensions` memoization on `presetName` must be maintained when adding the Image extension.
- **Pitfall 3 (original): Extension hooks call `useEditorState` regardless of extension presence** — applies directly to the new `useImage` hook (see new Pitfall 9 above).
- **Pitfall 6 (original): `useEditor` receives null during async preset fetch** — still applies; image toolbar must not render during the loading state.

Full original pitfall list is preserved in git history at commit before 2026-03-16.

---

*Pitfalls research for: Tiptap editor Strapi 5 plugin — v1.1 Media Library image support*
*Researched: 2026-03-16*

---
---

# v1.2 Addendum: Text Color, Highlight Color, and Theme Configuration

**Domain:** Adding text color, highlight color, and theme config (stylesheet + colors array) to existing Tiptap editor plugin
**Researched:** 2026-03-16
**Confidence:** HIGH for Tiptap extension behavior (official docs + GitHub issues). MEDIUM for Strapi stylesheet injection (community forum, no official API). LOW where noted.

---

## Critical Pitfalls (v1.2)

---

### Pitfall 13: Color Extension Requires TextStyle — Not Included in StarterKit

**What goes wrong:**
`@tiptap/extension-color` declares `@tiptap/extension-text-style` as a required dependency. If `TextStyle` is not registered in the extensions array, `setColor()` silently does nothing — no error, no console warning. The toolbar button appears to work (no throw), but the color is never applied because there is no `textStyle` mark to attach the `color` attribute to.

**Why it happens:**
StarterKit does not include TextStyle. Developers see that Color is its own package and install it alone, not realizing it piggybacks on a separate `TextStyle` mark extension. The Tiptap docs state clearly "This extension requires the TextStyle mark" but this is easy to overlook when following the install instructions.

**How to avoid:**
- Register `TextStyle` explicitly in `buildExtensions` whenever `textColor` or `highlightColor` is enabled in the preset config:
  ```typescript
  import TextStyle from '@tiptap/extension-text-style';
  import Color from '@tiptap/extension-color';

  if (isFeatureEnabled(config.textColor)) {
    extensions.push(TextStyle, Color);
  }
  ```
- `TextStyle` must appear before `Color` in the extensions array (by convention, though Tiptap resolves dependencies at runtime).
- If both `textColor` and `highlightColor` are enabled, push `TextStyle` once. Pushing it twice does not throw but creates a duplicate mark definition warning in development.
- Write a unit test in `buildExtensions.test.ts`: when `textColor: true`, the output extensions array must contain both `textStyle` and `color` by name.

**Warning signs:**
- `editor.commands.setColor('#ff0000')` returns `true` (command ran) but no span appears in the document.
- `editor.getAttributes('textStyle').color` returns `undefined` even after `setColor` was called.
- No `textStyle` mark in `editor.schema.marks` when inspecting via devtools.

**Phase to address:** `buildExtensions` extension registration phase — before color picker UI is built.

---

### Pitfall 14: Highlight Extension `multicolor: false` Stores No Color Attribute in JSON

**What goes wrong:**
`@tiptap/extension-highlight` defaults to `multicolor: false`. In this mode, the extension adds a `<mark>` element with no `color` attribute — it simply toggles highlighting on/off with a fixed background. When a color picker is shown in the toolbar and the user selects a color, calling `editor.commands.setHighlight({ color: '#ff0000' })` silently discards the color value because the schema does not declare a `color` attribute when `multicolor` is false. The JSON output contains `{ "type": "highlight" }` with no attrs, and reloading always shows the default highlight color regardless of what was selected.

**Why it happens:**
The `multicolor` flag changes the underlying ProseMirror mark schema. With `multicolor: false`, the mark has no `color` attribute in its spec. Calling `setHighlight({ color: '#ff0000' })` when `multicolor: false` is a no-op on the color value — the mark is applied but the attribute is dropped. This is not documented prominently.

**How to avoid:**
- Always configure Highlight with `multicolor: true` in `buildExtensions` when the feature is enabled:
  ```typescript
  import Highlight from '@tiptap/extension-highlight';

  if (isFeatureEnabled(config.highlightColor)) {
    extensions.push(Highlight.configure({ multicolor: true }));
  }
  ```
- Write a fixture round-trip test: `{ type: 'highlight', attrs: { color: '#ffcc00' } }` must survive parse/serialize without losing the `color` attribute.
- Document in `TiptapPresetConfig` that `highlightColor` always implies `multicolor: true`.

**Warning signs:**
- Color picker appears to apply colors, but the editor content always shows the same highlight color.
- JSON output for a highlight node contains no `attrs` object, or `attrs: {}`.
- `editor.getAttributes('highlight').color` returns `undefined` after calling `setHighlight({ color: '#ff0000' })`.

**Phase to address:** `buildExtensions` extension registration phase, alongside the highlight color UI phase.

---

### Pitfall 15: `unsetColor` Removes All Text Styles When Multiple Style Extensions Are Active

**What goes wrong:**
When both `textColor` (Color + TextStyle) and another TextStyle-based extension (e.g., a future FontFamily or FontSize extension) are active, calling `editor.commands.unsetColor()` on a selection that has both a color and another TextStyle attribute can remove all TextStyle formatting — not just the color. This was a confirmed bug in Tiptap (GitHub issue #4311, also #4853) caused by `removeEmptyTextStyle` examining only the first mark in the selection.

**Why it happens:**
`unsetColor` calls `removeEmptyTextStyle`, which is designed to clean up `<span style="">` tags left after removing the last style. A bug in the implementation caused it to evaluate only the first mark in the selection: if that mark had no remaining styles, it removed the entire TextStyle mark from all selected content — even marks that still had other style attributes.

The bug was fixed (PRs #5836, #5905, #5909 merged). However, it existed in Tiptap 2.x and may have been re-introduced or partially present depending on the exact version.

**How to avoid:**
- Pin `@tiptap/extension-text-style` to a version that includes the fix. Verify by calling `unsetColor()` on text that has both `color` and another TextStyle attribute; the other attribute must survive.
- Add a regression test: apply color and bold (if TextStyle is ever extended), then `unsetColor`, and assert bold is preserved. This test catches if the bug re-appears on a version bump.
- Until multiple TextStyle-dependent extensions coexist, the risk is low for v1.2 (only Color uses TextStyle). Flag for re-verification if FontFamily or FontSize is added later.

**Warning signs:**
- `unsetColor()` removes underline, font family, or other inline styles from the selected text.
- After calling `editor.commands.unsetColor()`, `editor.getAttributes('textStyle')` returns `{}` even though other style attributes were present.

**Phase to address:** Color unset behavior testing phase. Flag for re-verification in any future milestone that adds more TextStyle-dependent extensions.

---

### Pitfall 16: Color Values Stored as CSS Variables (`var(--)`) Break in Frontend Rendering Contexts Without the Stylesheet

**What goes wrong:**
If the theme's color palette uses CSS variable tokens (e.g., `var(--brand-primary)` as a swatch value), and a content manager applies that color, the Tiptap JSON stores `{ "type": "textStyle", "attrs": { "color": "var(--brand-primary)" } }`. The `renderHTML` output is `<span style="color: var(--brand-primary)">`. In the Strapi admin panel, the stylesheet is injected so the variable resolves correctly. But frontend consumers rendering the stored HTML — a Next.js website, a mobile app, a PDF renderer — may not have that CSS variable defined. The text appears in the browser's default color or the CSS variable falls back to nothing.

**Why it happens:**
Inline `style` attributes that reference CSS variables are only resolved when the variable is defined in the CSS cascade at that element. A consumer rendering the Strapi API's HTML output will not automatically have the plugin's theme stylesheet unless they explicitly include it.

**How to avoid:**
- Store concrete hex/rgb values in the `color` attribute, not CSS variable tokens. Resolve the CSS variable to its computed hex value at the moment the user selects a swatch in the picker, before calling `setColor()`.
- In the color picker, store `{ label: 'Brand Primary', value: '#2563eb' }` — never `var(--brand-primary)`.
- The `colors` array in theme config should define both a label (for the picker UI) and a value (the actual color stored in content). CSS variable tokens in the theme are fine for the admin UI's visual rendering of swatches, but must not be the stored color value.
- Document this constraint clearly in the theme config API.

**Warning signs:**
- Swatch in the color picker shows a color, but the editor text appears in the default color.
- JSON output contains `"color": "var(--something)"` strings.
- Frontend rendering shows unstyled text where colored text was expected.

**Phase to address:** Color picker swatch data model phase — the `colors` array shape must enforce concrete values before any UI is built.

---

### Pitfall 17: Stylesheet Injection Runs Multiple Times — Duplicate `<link>` Tags in `<head>`

**What goes wrong:**
The Strapi admin panel calls `bootstrap(app)` once per page load, making a single `document.head.appendChild(link)` call straightforward. However, during development with Vite HMR, the `bootstrap` function may be called again after a module hot-reload. Without an idempotency guard, each reload appends a new `<link>` tag for the same stylesheet URL. The stylesheet is fetched again, and if the external stylesheet contains CSS custom properties or global rules that depend on specificity ordering, duplicate injection can cause subtle visual glitches or specificity conflicts.

**Why it happens:**
HMR replaces module instances at runtime. The `admin/src/index.ts` `bootstrap` hook is re-executed on relevant file changes. There is no built-in deduplication in the browser's `<head>` management.

**How to avoid:**
- Guard injection with an idempotency check based on the stylesheet URL:
  ```typescript
  bootstrap(app: StrapiApp) {
    const stylesheetUrl = getThemeStylesheet(app); // read from plugin config
    if (stylesheetUrl && !document.querySelector(`link[data-tiptap-theme="${CSS.escape(stylesheetUrl)}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = stylesheetUrl;
      link.setAttribute('data-tiptap-theme', stylesheetUrl);
      document.head.appendChild(link);
    }
  }
  ```
- The `data-tiptap-theme` attribute on the `<link>` element acts as the idempotency key.
- Clean up the injected tag if the plugin is unregistered (in the `destroy` lifecycle), though this is rarely needed in practice.

**Warning signs:**
- Multiple `<link>` tags with the same `href` in the browser's `<head>` (visible in DevTools Elements panel after a file change).
- Visual flash or style recalculation visible during development hot-reloads.
- CSS specificity bugs that only appear after a hot-reload and resolve on full page refresh.

**Phase to address:** Stylesheet injection implementation — must be done before testing theme CSS in development.

---

### Pitfall 18: Theme Config Served to Admin Exposes Private Color Tokens

**What goes wrong:**
The `theme` config is stored in `config/plugins.ts` on the server. The existing `GET /tiptap-editor/presets/:name` route returns preset config objects. If a new `GET /tiptap-editor/theme` route is added to serve the colors array to the admin panel (so the color picker can show swatches), it exposes the entire theme config — including stylesheet URL path — over the network to any authenticated admin user.

In most Strapi setups this is acceptable. But if the theme stylesheet URL contains environment-specific secrets (e.g., a signed CDN URL), or if color token names reveal internal design system naming conventions that are considered confidential, this is a mild information leak.

**Why it happens:**
Plugin config is server-side only by default. Serving it via an admin route makes it accessible to the browser. The `type: 'admin'` route policy limits it to authenticated Strapi admin users — not the public — but it is still network-visible.

**How to avoid:**
- Keep the existing `type: 'admin'` route policy (already done for preset routes). This limits exposure to logged-in Strapi users.
- Serve only the data the picker actually needs: the `colors` array of `{ label, value }` objects. Do not serve the raw `stylesheet` URL over the API — inject the stylesheet server-side at render time or directly in `bootstrap()` from a config variable.
- Document that the colors array is visible to authenticated admin users.

**Warning signs:**
- `GET /tiptap-editor/theme` returns the full `TiptapPluginConfig` object including private fields.
- Stylesheet URL containing access tokens appears in browser network requests.

**Phase to address:** Theme API route design phase.

---

## Moderate Pitfalls (v1.2)

---

### Pitfall 19: Color Picker Focus Steals Editor Selection — Applied Color Targets Empty Range

**What goes wrong:**
When a user selects text, then clicks the color picker toolbar button to open a popover or dropdown, the click event on the picker trigger causes the editor to lose its text selection. By the time the user picks a color and the `setColor()` command fires, the ProseMirror selection is an empty cursor or has collapsed to a single position. The color is applied to zero characters, appearing to do nothing.

**Why it happens:**
Clicking outside the ProseMirror editable area triggers a blur event, which collapses the selection in many browsers. The Tiptap toolbar buttons that invoke commands (e.g., `editor.chain().focus().toggleBold().run()`) call `focus()` to restore focus before the command, which works for instant toggle commands. But color pickers require the user to interact with a separate UI element (the picker), then click to apply — by which point the selection is gone.

This is a known Tiptap issue (GitHub issue #2334: "Color Extension — Input Color Picker closes immediately upon selection"; discussion #4963: "Highlighted selection — not to lose focus when focusing on other element on the page").

**How to avoid:**
- Use a swatch-grid popover (not a native `<input type="color">`) that keeps focus management within the admin panel. Native `<input type="color">` triggers an OS-level color picker dialog that reliably destroys the ProseMirror selection.
- On the popover trigger button, save the current selection before the picker opens:
  ```typescript
  const savedSelection = editor.state.selection;
  ```
- Before applying the color, restore the saved selection:
  ```typescript
  editor.chain().setTextSelection({ from: savedSelection.from, to: savedSelection.to }).setColor(color).run();
  ```
- This is the same pattern used by `useLink` in `Link.tsx` via `selectionRef` — reuse that pattern.
- Wrap the color picker popover trigger with `onMouseDown={(e) => e.preventDefault()}` to prevent the editor blur on click.

**Warning signs:**
- Color is applied but no text changes color in the editor.
- `editor.state.selection` is empty (`from === to`) when the color command fires.
- Color picker opens but clicking a swatch has no visible effect.

**Phase to address:** Color picker UI component implementation — before any integration testing.

---

### Pitfall 20: `textColor` and `highlightColor` Preset Keys Not Added to `PRESET_FEATURE_KEYS`

**What goes wrong:**
Same drift pattern as Pitfall 6 (v1.1). Adding `textColor` and `highlightColor` to `TiptapPresetConfig` without adding them to `PRESET_FEATURE_KEYS` means the server-side config validator does not validate them. A developer who types `textcolour: true` (typo) in `config/plugins.ts` gets no boot-time error — the key is silently ignored and the feature silently doesn't work.

Additionally, `fixtures/all-features-payload.json` and `fixtures/all-features-preset.json` must be updated per the `CLAUDE.md` fixture maintenance rule. If either fixture is not updated, the fixture tests will not exercise the color mark round-trip.

**Why it happens:**
Same root cause as Pitfall 6: manual sync between `TiptapPresetConfig`, `PRESET_FEATURE_KEYS`, and the fixtures. TypeScript cannot enforce array completeness.

**How to avoid:**
- Add `textColor` and `highlightColor` to `PRESET_FEATURE_KEYS` in `shared/types.ts` in the same commit as the interface update.
- Define `TextColorConfig` and `HighlightColorConfig` option types if needed.
- Update `fixtures/all-features-preset.json` to include `"textColor": true, "highlightColor": true`.
- Update `fixtures/all-features-payload.json` to include nodes with `textStyle` marks carrying `color` and `highlight` marks carrying `color` (per `CLAUDE.md`).

**Warning signs:**
- Boot-time validator accepts `{ textColour: true }` (typo) without error.
- `fixtures/all-features-payload.json` contains no `textStyle` or `highlight` marks after v1.2 ships.

**Phase to address:** Type definitions and validator update — first phase before any extension work.

---

### Pitfall 21: TextStyle Paste Contamination — Browser-Inherited Styles Captured on Paste

**What goes wrong:**
A confirmed Tiptap bug (GitHub issue #6102): when `TextStyle` is registered and content is pasted from the browser, the `parseHTML` handler for `TextStyle` captures the browser's computed/inherited inline styles — not just the explicitly set ones. Pasted content ends up wrapped in `<span style="font-family: Segoe UI, Helvetica Neue, ...">` spans because the browser's CSS inheritance is serialized into inline `style` attributes during paste parsing.

This results in unintentional inline styles contaminating pasted content. In a Strapi admin context, content managers often paste from Google Docs, Notion, or Word — prime sources of rich inline styles.

**Why it happens:**
Tiptap's `TextStyle` `parseHTML` method calls `element.style` during paste, which returns the computed style including all inherited properties, not just the properties explicitly set as inline styles on the element. This is a browser behavior that Tiptap does not filter at the mark parsing stage.

**How to avoid:**
- This is a known upstream bug. Until it is fixed in `@tiptap/extension-text-style`, mitigate by adding a `transformPastedHTML` hook that strips all inline `style` attributes from pasted content before Tiptap parses it:
  ```typescript
  // In useEditor options
  editorProps: {
    transformPastedHTML(html: string) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      doc.querySelectorAll('[style]').forEach(el => el.removeAttribute('style'));
      return doc.body.innerHTML;
    },
  }
  ```
  Caveat: this strips intentional inline styles too. For a CMS context where only the theme palette colors should appear, this is the correct behavior.
- Alternatively, configure `TextStyle` with a restrictive `parseHTML` that only matches elements with specific known style properties.

**Warning signs:**
- Pasting text from Google Docs or a webpage results in text wrapped in unexpected `<span>` tags with large `style` attribute values.
- JSON output for pasted content has `textStyle` marks with `color` or `fontFamily` values that were never set by the user.
- Editor content grows unexpectedly large after paste operations.

**Phase to address:** Editor initialization and paste behavior phase. Add `transformPastedHTML` as part of the `useTiptapEditor` hook options when TextStyle is registered.

---

### Pitfall 22: Stylesheet URL Relative vs Absolute — Admin Panel Origin May Differ From API Origin

**What goes wrong:**
The `stylesheet` field in theme config accepts a URL string. If a developer writes `stylesheet: '/design-tokens.css'`, this relative URL is resolved against the admin panel's origin, which may be the same as the Strapi API origin in a single-domain deployment, but differs in configurations where the admin panel is served from a subdomain or CDN (e.g., `https://admin.example.com` for admin vs `https://api.example.com` for backend).

The injected `<link href="/design-tokens.css">` resolves to `https://admin.example.com/design-tokens.css`, which 404s because the stylesheet is served by the backend, not the admin CDN.

**Why it happens:**
The existing codebase already notes this limitation: `window.location.origin` URL prefixing "only works for single-domain Strapi deployments" (from `PROJECT.md`). The same constraint applies to theme stylesheet URLs.

**How to avoid:**
- In the `bootstrap` function, if the stylesheet URL starts with `/`, prefix it with the Strapi backend URL, not `window.location.origin`. The backend URL should be derived from the Strapi admin app's `backendURL` utility, not hardcoded:
  ```typescript
  import { getFetchClient } from '@strapi/strapi/admin';
  // Use the same base URL as the fetch client
  ```
- Prefer absolute URLs in the `stylesheet` config field. Document this requirement prominently.
- If relative URLs must be supported, document that they resolve against the admin origin, not the backend.

**Warning signs:**
- Theme stylesheet 404s in staging/production but works locally.
- CSS variables from the theme are undefined in the admin panel on deployed environments.
- No error in the browser console from the `<link>` tag — browsers silently ignore 404 stylesheets; the symptom is swatches appearing blank or using fallback colors.

**Phase to address:** Stylesheet injection implementation — add URL resolution logic before testing in non-trivial deploy configurations.

---

## Technical Debt Patterns (v1.2 Additions)

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Store CSS variable tokens as color values | Swatches can reference design system tokens | Color values break in frontend renderers without the stylesheet | Never — always resolve to concrete hex/rgb |
| Use native `<input type="color">` for color picker | Zero implementation effort | Destroys ProseMirror selection; OS picker dialog is unpredictable | Never in a Tiptap toolbar context |
| Register TextStyle only when textColor is enabled, not also for highlightColor | Feels cleaner | Highlight with `multicolor: true` also outputs inline `style`, and removing color from a highlight could trigger `removeEmptyTextStyle` bugs | Acceptable if Highlight uses `class`-based rendering; not acceptable if it uses inline `style` |
| Skip idempotency guard on stylesheet injection | Less code | Duplicate `<link>` tags accumulate during HMR; subtle CSS specificity bugs in dev | Never — one-liner guard costs nothing |
| Omit `textColor`/`highlightColor` from `PRESET_FEATURE_KEYS` initially | Ship faster | Validator silently accepts typos; fixture tests don't cover color marks | Never — sync cost is a single line |

---

## Integration Gotchas (v1.2 Additions)

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Tiptap Color extension | Installing without TextStyle; `setColor` silently no-ops | Always push `TextStyle` before `Color` when `textColor` is enabled |
| Tiptap Highlight extension | Using `multicolor: false` (default) with a color picker | Configure `Highlight.configure({ multicolor: true })` whenever color selection is offered |
| External CSS stylesheet | Injecting via `document.head.appendChild` without idempotency guard | Check for existing `link[data-tiptap-theme]` before appending |
| External CSS stylesheet | Using relative URL that resolves to admin origin, not backend | Document absolute URL requirement; or resolve relative to Strapi backend URL |
| Color picker UI | Using native `<input type="color">` | Use a swatch-grid popover; save/restore ProseMirror selection around open/close |

---

## UX Pitfalls (v1.2 Additions)

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No "remove color" option in the picker | Content manager cannot unset a color once applied | Always include an "unset / default" option that calls `unsetColor()` or `unsetHighlight()` |
| Color picker shows hex values as labels | Content managers do not know what `#2563eb` is | Show label text (e.g., "Brand Blue") from the colors config; show hex value as a secondary detail |
| Color picker has no active-state indicator | No visual feedback for which color is currently applied at cursor | Read `editor.getAttributes('textStyle').color` and highlight the matching swatch as active |
| Highlight and text color both active, removing one removes both | Unexpected loss of formatting | Use the `unsetColor` / `unsetHighlight` commands specifically, not `clearFormatting` |
| Color swatches too small for mouse target | Misclicks apply wrong color | Minimum swatch size 24×24px with 4px gap; match Strapi design-system spacing |

---

## "Looks Done But Isn't" Checklist (v1.2 Additions)

- [ ] **Text color**: Color picker applies color visually — verify the JSON mark is `{ "type": "textStyle", "attrs": { "color": "#hex" } }`, not `"color": "var(--...)"`.
- [ ] **Highlight color**: Color picker applies highlight — verify JSON has `{ "type": "highlight", "attrs": { "color": "#hex" } }`, not an empty `attrs` object.
- [ ] **Color roundtrip**: Color applied, saved, reloaded — verify the color is identical after a full Strapi save/reload cycle.
- [ ] **Unset color**: "Remove color" option in picker — verify `unsetColor()` removes the span without stripping other inline styles.
- [ ] **TextStyle registration**: `textColor: true` in preset — verify `editor.schema.marks.textStyle` exists (TextStyle was registered).
- [ ] **Highlight multicolor**: `highlightColor: true` in preset — verify `Highlight.configure({ multicolor: true })` is in the extensions array.
- [ ] **Stylesheet injected once**: External stylesheet configured — verify only one `<link>` tag with `data-tiptap-theme` exists in `<head>` after hot-reload.
- [ ] **Empty selection guard**: Color picker selects a color with no text selected — verify no color mark is applied (or a sensible UX fallback is shown).
- [ ] **PRESET_FEATURE_KEYS sync**: `textColor`/`highlightColor` in `TiptapPresetConfig` — verify both appear in `PRESET_FEATURE_KEYS`.
- [ ] **Fixture updated**: v1.2 shipped — verify `fixtures/all-features-payload.json` contains both `textStyle` marks with `color` and `highlight` marks with `color` (per `CLAUDE.md`).
- [ ] **Fixture preset updated**: `fixtures/all-features-preset.json` — verify it contains `"textColor": true` and `"highlightColor": true`.

---

## Pitfall-to-Phase Mapping (v1.2)

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Color without TextStyle (Pitfall 13) | Phase: `buildExtensions` extension registration | Unit test: `textColor: true` config produces extensions array containing `textStyle` and `color` names |
| Highlight `multicolor: false` (Pitfall 14) | Phase: `buildExtensions` extension registration | Fixture round-trip: `highlight` mark with `color` attr survives parse/serialize |
| `unsetColor` removes all styles (Pitfall 15) | Phase: Color unset behavior testing | Test: `unsetColor` on text with two TextStyle attrs removes only `color` |
| CSS variable tokens in stored content (Pitfall 16) | Phase: Color picker swatch data model | Unit test: `colors` array shape requires concrete `value` field; picker calls `setColor(value)` not `setColor(cssVar)` |
| Duplicate stylesheet injection (Pitfall 17) | Phase: Stylesheet injection implementation | Inspect `<head>` after three hot-reloads; exactly one `data-tiptap-theme` link present |
| Theme config exposes sensitive data (Pitfall 18) | Phase: Theme API route design | Route returns only `{ colors: [...] }`, not raw stylesheet URL |
| Color picker steals selection (Pitfall 19) | Phase: Color picker UI component | Integration test: select text, open picker, select swatch — text color changes on selected range |
| `PRESET_FEATURE_KEYS` sync (Pitfall 20) | Phase: Type definitions and validator update | Compile-time check; fixture maintenance check |
| TextStyle paste contamination (Pitfall 21) | Phase: Editor initialization / paste behavior | Integration test: paste from external source; JSON contains no unexpected `textStyle` marks |
| Stylesheet URL relative vs absolute (Pitfall 22) | Phase: Stylesheet injection implementation | Test with `stylesheet: '/tokens.css'`; verify URL is resolved correctly for both single-domain and split-domain deployments |

---

## Sources (v1.2)

- Tiptap documentation, Color extension: requires TextStyle mark, `types` default `['textStyle']` — HIGH confidence (official docs)
- Tiptap documentation, TextStyle extension: foundational mark for inline style attributes; `removeEmptyTextStyle` command — HIGH confidence (official docs)
- Tiptap documentation, Highlight extension: `multicolor` configuration, `setHighlight({ color })` command — HIGH confidence (official docs)
- Tiptap GitHub issue #4311: `unsetColor`/`unsetFontFamily` broken by `removeEmptyTextStyle` — confirmed fixed via PRs #5836, #5905, #5909 — HIGH confidence (issue closed)
- Tiptap GitHub issue #4853: same `removeEmptyTextStyle` bug with broader reproduction cases — HIGH confidence
- Tiptap GitHub issue #6102: TextStyle extension captures browser-inherited styles on paste — MEDIUM confidence (open issue as of research date)
- Tiptap GitHub issue #2334: native `<input type="color">` closes immediately on color palette interaction — MEDIUM confidence
- Tiptap GitHub discussion #4963: maintaining editor highlight/selection when focus moves to external UI — MEDIUM confidence
- Tiptap UI Components docs, Color Text Popover + Color Highlight Popover: swatch-grid pattern with focus management — HIGH confidence (official docs)
- Direct inspection of `admin/src/extensions/Link.tsx`: `selectionRef` pattern for saving/restoring ProseMirror selection across dialog open/close — HIGH confidence (codebase)
- Direct inspection of `admin/src/index.ts`: `bootstrap(app)` lifecycle location for stylesheet injection — HIGH confidence (codebase)
- Direct inspection of `server/src/config/index.ts`: config validator structure, `PRESET_FEATURE_KEYS` usage — HIGH confidence (codebase)
- Direct inspection of `admin/src/utils/buildExtensions.ts`: extension registration pattern, TextStyle not present — HIGH confidence (codebase)
- `.planning/PROJECT.md`: v1.2 milestone goals, `window.location.origin` single-domain limitation note — HIGH confidence (project context)
- Web search corroboration: CSS variable tokens in inline styles; TextStyle paste contamination bug — MEDIUM confidence

---

*Pitfalls research for: Tiptap editor Strapi 5 plugin — v1.2 Text Color, Highlight Color, Theme Configuration*
*Researched: 2026-03-16*
