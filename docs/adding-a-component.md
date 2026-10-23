# Adding a Rich-Text Component

How to add a new component to the Tiptap editor: what to write, where it lives, how it looks in the
Strapi admin, and how the frontend renders it.

- [How it works](#how-it-works)
- [Built-in or project-level?](#built-in-or-project-level)
- [Add a built-in component](#add-a-built-in-component)
- [Add a project-level component](#add-a-project-level-component)
- [How it looks in the Strapi editor](#how-it-looks-in-the-strapi-editor)
- [How it renders on the frontend](#how-it-renders-on-the-frontend)
- [Removing a component](#removing-a-component)
- [Checklist](#checklist)
- [Limitations & next steps](#limitations--next-steps)

---

## How it works

A component is one **node type** in the document. It exists in three layers, and each layer knows as
little as possible about the others:

| Layer | File | Contains |
| --- | --- | --- |
| **Schema** | `shared/src/components/<name>.ts` | `name`, `attributes` (defaults + which form control edits them), optional `content`. Plain object — no React, no Tiptap. |
| **Admin definition** | `admin/src/builtins/<name>.tsx` | The schema plus admin-only extras: `icon`, translated `label`, `preview`, custom `form`, `validate`. |
| **Frontend renderer** | your Next.js app | The actual markup a visitor sees. |

The schema is the contract. The admin and the frontend both build their Tiptap node from it, so they
agree on the node's shape by construction.

### The runtime flow

```
config/plugins.ts                      src/admin/app.tsx (or the plugin itself)
  presets.blog.components.callout        registerRichTextComponent(definition)
                     \                            /
                      resolveRichTextComponents(config)  ->  { definition, enabled, options }
                                        |
                      createComponentExtension()  ->  a Tiptap Node
                          - schema: name, attrs, atom/container
                          - node view: the card you see in the editor
                                        |
              toolbar "Insert component" -> dialog -> node inserted in the document
                                        |
                     saved as Tiptap JSON in the field's text column
                                        |
        Next.js: @tiptap/static-renderer + nodeMapping  ->  your React component
```

Three rules worth internalising:

1. **The preset only gates inserting and editing.** Every *registered* component is always part of
   the editor schema, whatever the preset says. A document written under a richer preset keeps
   round-tripping through a narrower one instead of silently dropping nodes on save — a disabled
   component just renders read-only.
2. **Registration happens once, at admin boot**, before any field mounts.
   ([`admin/src/index.ts`](../admin/src/index.ts) for built-ins, `src/admin/app.tsx` for project ones.)
3. **Stored JSON is the contract with the frontend.** The server doesn't validate it (the field is a
   plain `text` column), so both readers tolerate node types they don't know. The admin editor strips
   unknown nodes and marks on load, logs a `[TiptapEditor]` warning, and shows a notice above the
   toolbar. Nothing is written back on load: the content is only lost if an editor saves afterwards.

---

## Built-in or project-level?

|  | Built-in (this repo) | Project-level (host app) |
| --- | --- | --- |
| Ships with | The plugin, for every consumer | One Strapi app |
| Register in | `admin/src/index.ts` | `src/admin/app.tsx` |
| Use when | Generic and reusable (Button, Callout, Embed) | Specific to one project's design system |

Both are documented below and share everything that matters: the same schema shape, the same card,
the same dialog, the same frontend rendering. Only *where the files live* differs.

---

## Add a built-in component

Worked example: a `callout` — a coloured box with an editable body (a *container*, unlike `button`,
which is an *atom* with no editable content).

### 1. Write the schema

```ts
// shared/src/components/callout.ts
import type { RichTextComponentSchema } from './types';

export const CALLOUT_TONES = ['info', 'success', 'warning'] as const;
export type CalloutTone = (typeof CALLOUT_TONES)[number];

export const calloutSchema: RichTextComponentSchema = {
  name: 'callout',
  label: 'Callout',
  // Present -> container with editable content. Omit it -> atom (like `button`).
  content: 'block+',
  attributes: {
    tone: {
      default: 'info',
      form: {
        type: 'select',
        label: 'Tone',
        options: CALLOUT_TONES.map((value) => ({ value, label: value })),
      },
    },
    title: {
      default: '',
      form: { type: 'text', label: 'Title', placeholder: 'Good to know' },
    },
  },
};
```

Rules for `name`: must match `^[a-zA-Z][\w-]*$` and must not be one of the
[reserved node names](../shared/src/components/names.ts) (`paragraph`, `heading`, `table`, …).

**Attribute form types** — this is what an editor actually sees in the dialog:

| `form.type` | Control | Stored as |
| --- | --- | --- |
| `text` / `url` | Text input (`url` uses the browser URL input) | `string` |
| `textarea` | Multi-line input | `string` |
| `number` | Number input, optional `min`/`max` | `number \| null` |
| `boolean` | Toggle | `boolean` |
| `select` | Dropdown built from `options` | `string` |
| `json` | Multi-line raw JSON, parsed on submit | any JSON value |

Add `required: true` to get a "This field is required" check on submit. An attribute with **no**
`form` is stored and round-tripped but never shown in the dialog — useful for machine-set values.

### 2. Export it

```ts
// shared/src/components/index.ts
export * from './callout';
import { buttonSchema } from './button';
import { calloutSchema } from './callout';

export const BUILT_IN_COMPONENT_SCHEMAS: readonly RichTextComponentSchema[] = [
  buttonSchema,
  calloutSchema,
];
```

`BUILT_IN_COMPONENT_SCHEMAS` is what a frontend imports to render built-ins without redeclaring them.

### 3. Write the admin definition

```tsx
// admin/src/builtins/callout.tsx
import { Lightbulb } from '@strapi/icons';
import { calloutSchema, type CalloutTone } from '../../../shared/src/components/callout';
import { defineRichTextComponent } from '../registry/richTextComponents';

export type CalloutAttrs = { tone: CalloutTone; title: string };

export const calloutComponent = defineRichTextComponent<CalloutAttrs>({
  ...calloutSchema,
  label: { id: 'tiptap-editor.components.callout.label', defaultMessage: 'Callout' },
  icon: <Lightbulb />,
});
```

`defineRichTextComponent` does nothing at runtime — it only attaches the attribute type so the rest of
the file is type-checked against it.

Optional fields, all covered under [How it looks in the Strapi editor](#how-it-looks-in-the-strapi-editor):
`defaultAttrs`, `validate`, `preview`, `form`, `extension`.

### 4. Register it

```ts
// admin/src/index.ts
import { calloutComponent } from './builtins/callout';

register(app: StrapiApp) {
  registerRichTextComponent(buttonComponent);
  registerRichTextComponent(calloutComponent); // <-- add
  ...
}
```

If the component exposes types a host app needs, re-export them at the bottom of the same file
(`export type { CalloutAttrs } from './builtins/callout';`).

### 5. Add translations

```jsonc
// admin/src/translations/en.json
"tiptap-editor.components.callout.label": "Callout"
```

### 6. Update the fixtures

Required by [`CLAUDE.md`](../CLAUDE.md): the fixtures must exercise every node and attribute.

```jsonc
// fixtures/all-features-preset.json
"components": { "button": true, "callout": true }
```

```jsonc
// fixtures/all-features-payload.json — inside the doc's content array
{
  "type": "callout",
  "attrs": { "tone": "warning", "title": "Heads up" },
  "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Body copy." }] }]
}
```

### 7. Add tests

Mirror the existing ones: [`tests/shared/components.test.ts`](../tests/shared/components.test.ts) for
the schema, [`tests/admin/createComponentExtension.test.ts`](../tests/admin/createComponentExtension.test.ts)
for the generated node, [`tests/admin/componentAttrs.test.ts`](../tests/admin/componentAttrs.test.ts)
for validation. Run `yarn test`.

### 8. Enable it in a preset

In the consuming app:

```ts
// config/plugins.ts
presets: {
  blog: {
    bold: true,
    components: { callout: true },           // or: { callout: { maxTones: 2 } }
  },
},
```

The object form is passed straight through to your `preview` / `form` / `extension` as `options` —
the plugin never interprets it.

---

## Add a project-level component

Nothing here touches the plugin — no fork, no publish. Worked example: the same `callout`, wired into
a Next.js monorepo ([strapi-next-monorepo-starter](https://github.com/notum-cz/strapi-next-monorepo-starter)).

### Where the files go

```
packages/rich-text/                                  # schemas — imported by BOTH apps
  callout.ts
  index.ts
apps/strapi/src/admin/tiptap/                        # admin definitions (icon, preview, validation)
  callout.tsx
  index.ts
apps/strapi/src/admin/app.tsx                        # registers them at admin boot
apps/strapi/config/plugins/tiptap.ts                 # enables them per preset
apps/ui/src/components/elementary/tiptap-editor/     # frontend renderers
  components/callout.tsx
  components/index.ts
```

The one structural decision: **schemas live in their own workspace package**, not inside `apps/strapi`.
The Next.js app has to import the same objects, and it cannot reach into the Strapi app's source.

### 1. Schema package

```ts
// packages/rich-text/callout.ts
import type { RichTextComponentSchema } from '@notum-cz/strapi-plugin-tiptap-editor/shared';

export const CALLOUT_TONES = ['info', 'success', 'warning', 'danger'] as const;
export type CalloutTone = (typeof CALLOUT_TONES)[number];

export const calloutSchema: RichTextComponentSchema = {
  name: 'callout',
  label: 'Callout',
  content: 'block+',
  attributes: {
    tone: {
      default: 'info',
      form: {
        type: 'select',
        label: 'Tone',
        options: CALLOUT_TONES.map((value) => ({ value, label: value })),
      },
    },
    title: { default: '', form: { type: 'text', label: 'Title' } },
  },
};
```

```ts
// packages/rich-text/index.ts
import { BUILT_IN_COMPONENT_SCHEMAS, type RichTextComponentSchema }
  from '@notum-cz/strapi-plugin-tiptap-editor/shared';
import { calloutSchema } from './callout.js';

// Re-export the plugin's shared entry so both apps have a single import for everything.
export * from '@notum-cz/strapi-plugin-tiptap-editor/shared';
export * from './callout.js';

export const PROJECT_COMPONENT_SCHEMAS: readonly RichTextComponentSchema[] = [calloutSchema];
export const ALL_COMPONENT_SCHEMAS: readonly RichTextComponentSchema[] = [
  ...BUILT_IN_COMPONENT_SCHEMAS,
  ...PROJECT_COMPONENT_SCHEMAS,
];
```

The package's only runtime dependency is `@notum-cz/strapi-plugin-tiptap-editor` — no React, no Tiptap.
The [attribute form types](#1-write-the-schema) and naming rules are identical to the built-in path.

### 2. Admin definition

```tsx
// apps/strapi/src/admin/tiptap/callout.tsx
import {
  defineRichTextComponent,
  type RichTextComponentPreviewProps,
} from '@notum-cz/strapi-plugin-tiptap-editor/strapi-admin';
import { calloutSchema, type CalloutTone } from '@repo/rich-text';
import { Information } from '@strapi/icons';

type CalloutAttrs = { tone: CalloutTone; title: string };

const TONE_BACKGROUNDS: Record<CalloutTone, string> = {
  info: '#e6f0ff',
  success: '#e6f7ea',
  warning: '#fff4e0',
  danger: '#fdecea',
};

function CalloutPreview({ attrs, children }: RichTextComponentPreviewProps<CalloutAttrs>) {
  return (
    <div style={{ background: TONE_BACKGROUNDS[attrs.tone] ?? TONE_BACKGROUNDS.info, padding: 8 }}>
      {/* contentEditable={false} — without it ProseMirror treats the title as editable text */}
      {attrs.title ? <p contentEditable={false}>{attrs.title}</p> : null}
      {children}
    </div>
  );
}

export const calloutComponent = defineRichTextComponent<CalloutAttrs>({
  ...calloutSchema,
  icon: <Information />,
  preview: CalloutPreview,
});
```

`label` comes from the schema as a plain string — the `{ id, defaultMessage }` form is only needed if
your admin is translated.

```ts
// apps/strapi/src/admin/tiptap/index.ts
import { calloutComponent } from './callout';

/** Project components registered on admin start; append new ones here. */
export const PROJECT_RICH_TEXT_COMPONENTS = [calloutComponent];
```

### 3. Register at admin boot

```tsx
// apps/strapi/src/admin/app.tsx
import { registerRichTextComponent } from '@notum-cz/strapi-plugin-tiptap-editor/strapi-admin';
import { PROJECT_RICH_TEXT_COMPONENTS } from './tiptap';

export default {
  register(app: StrapiApp) {
    // The plugin's own register() has already run and the editor input is lazy-loaded,
    // so the registry is complete before any rich-text field builds its extensions.
    for (const component of PROJECT_RICH_TEXT_COMPONENTS) {
      registerRichTextComponent(component);
    }
  },
};
```

Prefer not to import from the plugin package at all? The same functions are on the plugin object:

```ts
const { register, define, list } = app.getPlugin('tiptap-editor').apis.richTextComponents;
```

> **Never import `@tiptap/*` directly in `src/admin/`.** `app.tsx` is loaded eagerly at admin boot,
> while the editor (and all of Tiptap) loads lazily when a field mounts — a direct import pulls a
> second, possibly mismatched copy of Tiptap into the eager bundle. If you need Tiptap primitives,
> take them from the `helpers` argument of [`extension(helpers, ctx)`](#three-levels-of-control-over-the-body).

### 4. Enable it in a preset

```ts
// apps/strapi/config/plugins/tiptap.ts
presets: {
  everything: {
    /* … */
    components: { button: true, callout: true },
  },
  baseText: {
    bold: true,
    components: { button: true },        // callout deliberately not offered here
  },
},
```

A name the plugin has never heard of is accepted by config validation — the registry lives in the
admin app, not on the server. If nothing registered it, the editor logs one console warning instead of
failing to boot.

### 5. Render it on the frontend

Same as [How it renders on the frontend](#how-it-renders-on-the-frontend), but import the schema from
your own package. Keep one registry so a new component is a one-line change:

```tsx
// apps/ui/.../tiptap-editor/components/index.ts
import { buttonSchema, calloutSchema } from '@repo/rich-text';

export const RICH_TEXT_COMPONENTS: Record<string, RichTextComponentRenderer> = {
  button: { extension: createRendererNode(buttonSchema), render: renderButton },
  callout: { extension: createRendererNode(calloutSchema), render: renderCallout },
};

export const RICH_TEXT_COMPONENT_EXTENSIONS = Object.values(RICH_TEXT_COMPONENTS).map((c) => c.extension);
export const richTextComponentNodeMapping = Object.fromEntries(
  Object.entries(RICH_TEXT_COMPONENTS).map(([name, c]) => [name, c.render])
);
```

Spread `RICH_TEXT_COMPONENT_EXTENSIONS` into the renderer's extension list and
`richTextComponentNodeMapping` into `options.nodeMapping`.

### 6. Test it

Worth covering: the schema is listed in `ALL_COMPONENT_SCHEMAS`, the preset enables what you expect,
and the frontend renders a stored node. In the starter these live next to the code they test
(`apps/strapi/tests/`, `apps/ui/src/components/.../index.test.tsx`).

### Promoting a project component into the plugin

If a component turns out to be generic, moving it is mechanical: schema file →
`shared/src/components/`, definition → `admin/src/builtins/`, then follow the built-in checklist. The
stored JSON does not change, so existing documents keep working.

---

## How it looks in the Strapi editor

Every generated component renders inside the same card:

```
┌──────────────────────────────────────────────┐
│ 💡 Callout            [Read-only?]  ✏️  🗑️  │  .rich-text-component__header  (drag handle)
├──────────────────────────────────────────────┤
│ Tone: warning · Title: Heads up              │  .rich-text-component__body
│ ┌──────────────────────────────────────────┐ │
│ │ editable content                         │ │  .rich-text-component__content (containers only)
│ └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

### Three levels of control over the body

| You provide | Body shows | Use when |
| --- | --- | --- |
| nothing | Auto summary: `"Tone: warning · Title: Heads up"` from the form-visible attributes | The attributes speak for themselves |
| `preview` | Your React component, props `{ attrs, options, enabled, selected, children }` | You want a real visual preview. `children` is the editable content slot (containers only) |
| `extension` | Whatever your own Tiptap node renders | You need custom commands, shortcuts, or a hand-built node view |

```tsx
// admin/src/builtins/CalloutPreview.tsx
import type { RichTextComponentPreviewProps } from '../registry/types';
import type { CalloutAttrs } from './callout';

export function CalloutPreview({ attrs, children }: RichTextComponentPreviewProps<CalloutAttrs>) {
  return (
    <div className="callout-preview" data-tone={attrs.tone}>
      {attrs.title && <strong>{attrs.title}</strong>}
      {children}
    </div>
  );
}
```

> **Never import `@tiptap/*` directly from host admin code.** Use the `helpers` argument of
> `extension(helpers, ctx)`. Inside this repo it doesn't matter, but host apps would pull a second,
> possibly mismatched copy of Tiptap into the eagerly-loaded admin bundle.

### Where the card styling lives

The card chrome is a styled-component in
[`admin/src/components/TiptapInputStyles.ts`](../admin/src/components/TiptapInputStyles.ts#L258) and
uses Strapi's theme tokens, so it follows light/dark mode. The hooks you can target:

| Selector | What it is |
| --- | --- |
| `.rich-text-component` | The whole card |
| `.rich-text-component[data-type="callout"]` | Cards of one component |
| `.rich-text-component[data-selected]` | Selected in the editor |
| `.rich-text-component__header` / `__body` / `__content` | Header, body, editable slot |

**To change a built-in's card look**, edit `TiptapInputStyles.ts`.
**To restyle it per project without touching the plugin**, use `theme.css` — a `<style>` tag injected
into the admin's `<head>` at boot (see [Theme](../README.md#custom-stylesheet)):

```ts
// config/plugins.ts
theme: { css: readFileSync(require.resolve('@repo/design-system/strapi-styles.css'), 'utf-8') },
```

```css
/* strapi-styles.css — target data-type, it out-specifies the plugin's single class */
.rich-text-component[data-type='callout'] .rich-text-component__body {
  border-left: 4px solid #e5a000;
}
```

The same file is the way to make the preview look like production: import your frontend's component
CSS into it and use the same class names in `preview`. The admin will never be pixel-identical to the
frontend — it runs inside Strapi's own theme — so treat the preview as *recognisable*, not as WYSIWYG.

---

## How it renders on the frontend

The API returns plain Tiptap JSON:

```json
{
  "type": "callout",
  "attrs": { "tone": "warning", "title": "Heads up" },
  "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Body copy." }] }]
}
```

Import the schema — never retype it — turn it into a schema-only node with `toNodeSpec`, then map the
node name to your component. Built-ins come from `@notum-cz/strapi-plugin-tiptap-editor/shared`;
project components come from your own schema package (`@repo/rich-text` below), which re-exports that
same entry, so one import covers both:

```tsx
import { Node, getSchema } from '@tiptap/core';
import { renderToReactElement } from '@tiptap/static-renderer/pm/react';
import { buttonSchema, calloutSchema, stripUnknownContent, toNodeSpec } from '@repo/rich-text';

function rendererNode(schema) {
  const spec = toNodeSpec(schema); // drops the form metadata; keeps name/atom/content/attr defaults
  return Node.create({
    name: spec.name,
    group: spec.group,
    atom: spec.atom,
    content: spec.content,
    addAttributes: () => spec.attributes,
  });
}

const extensions = [/* StarterKit, … */ rendererNode(buttonSchema), rendererNode(calloutSchema)];

const html = renderToReactElement({
  extensions,
  content: stripUnknownContent(storedContent, getSchema(extensions)).content,
  options: {
    nodeMapping: {
      callout: ({ node, children }) => <Callout tone={node.attrs.tone}>{children}</Callout>,
    },
  },
});
```

From here it is an ordinary React component — **styling on the frontend is entirely yours**; the
plugin ships no frontend CSS.

> 💡 **Watch the rich-text body styles.** Apps usually style the prose container globally
> (`.tiptap-rich-text a { … }`). Those rules are unlayered, so they outrank the utility classes on
> your component. Mark the component's root and exclude it:
> `<a data-rich-text-component="button" …>` + `.tiptap-rich-text a:not([data-rich-text-component])`.

> ⚠️ **Strip unknown nodes first.** `Node.fromJSON` throws if the stored JSON contains a node type
> your renderer doesn't define — which happens the moment Strapi enables a component the frontend
> hasn't wired up yet. The plugin exports `stripUnknownContent(content, schema)` from
> `@notum-cz/strapi-plugin-tiptap-editor/shared` (the admin editor uses the same function); pass it
> the renderer's `getSchema(extensions)`. It returns the sanitised document plus
> `unknownNodeTypes` / `unknownMarkTypes` so you can log a warning.

**Roll-out order that avoids broken pages:** ship the frontend renderer → deploy → then enable the
component in the Strapi preset.

---

## Removing a component

1. Unregister it in the admin (drop the `registerRichTextComponent` call or the registry entry).
2. Delete its key from every preset's `components`.
3. Remove the frontend renderer.

Existing documents keep the node until someone edits them. Until then both the admin editor and the
frontend drop it when rendering; the admin shows a notice, and saving that document removes the node
for good.

---

## Checklist

### Built-in

| # | File | Why |
| --- | --- | --- |
| 1 | `shared/src/components/<name>.ts` | The schema |
| 2 | `shared/src/components/index.ts` | Export + add to `BUILT_IN_COMPONENT_SCHEMAS` |
| 3 | `admin/src/builtins/<name>.tsx` | Icon, label, preview, validation |
| 4 | `admin/src/index.ts` | `registerRichTextComponent(...)` + type re-exports |
| 5 | `admin/src/translations/en.json` | Label |
| 6 | `fixtures/all-features-preset.json` + `fixtures/all-features-payload.json` | Required by `CLAUDE.md` |
| 7 | `tests/**` | Schema, node, validation |
| 8 | `README.md` | Mention it if consumers need to know |

Then: `yarn test && yarn test:ts:front && yarn test:ts:shared`.

### Project-level

| # | File | Why |
| --- | --- | --- |
| 1 | `packages/rich-text/<name>.ts` | The schema |
| 2 | `packages/rich-text/index.ts` | Export + add to `PROJECT_COMPONENT_SCHEMAS` |
| 3 | `apps/strapi/src/admin/tiptap/<name>.tsx` | Icon, preview, validation |
| 4 | `apps/strapi/src/admin/tiptap/index.ts` | Add to `PROJECT_RICH_TEXT_COMPONENTS` |
| 5 | `apps/strapi/config/plugins/tiptap.ts` | Enable it in the presets that should offer it |
| 6 | `apps/ui/.../tiptap-editor/components/<name>.tsx` + `components/index.ts` | Frontend renderer + registry entry |
| 7 | Tests | Schema listed, preset enabled, node renders |

No plugin change, no publish, no version bump.

---

## Limitations & next steps

### Data & validation
- **Nothing validates stored content server-side.** The field is a `text` column; the server never
  parses the JSON. A bad payload written through the REST API reaches the frontend untouched.
  *Next:* a lifecycle hook validating documents against the registered schemas.
- **Unknown nodes are stripped, not preserved.** When a stored document contains a node or mark type
  the editor doesn't know (a component that was unregistered or renamed), the admin removes it on
  load, warns in the console, and shows a notice above the toolbar. Loading never rewrites the field;
  the node is only lost if the editor saves afterwards. Shapes the sanitizer can't fix (invalid
  attributes, content that breaks a content expression) are logged via Tiptap's content-error event.
- **No schema migrations.** Renaming or removing an attribute leaves old documents with the old
  shape. Missing attributes fall back to the schema default; renamed ones are silently lost.
  *Next:* a `version` on the schema plus a migration hook.
- **Component `options` from a preset are untyped and unvalidated** (`Record<string, unknown>`). A
  typo in `config/plugins.ts` fails silently inside your `preview`.
- **Clipboard round-trip is lossy at the edges.** Attributes are encoded as `data-*` on a
  `<div data-type="…">`; a cleared string attribute is indistinguishable from its default, and an
  unparseable non-string value falls back to the default rather than erroring.

### Editing UX
- **The insert menu is a flat list** — no grouping, search, or slash-command. It gets unwieldy past
  ~10 components.
- **The generated form has six field types.** No media picker, no colour picker, no relation picker,
  no repeatable/array field. Anything else needs a custom `form` — and `json` (a raw textarea) is a
  poor fallback for editors.
- **No duplicate action** on the card, and no keyboard shortcuts for insert/edit.
- **Containers accept any `content` expression**, so components can nest arbitrarily deep with no
  guard rails.
- **Preview ≠ production.** No shared rendering path between the admin card and the frontend
  component; keeping them in sync is manual.

### Plugin internals
- **The registry is a module-level singleton** with no `unregister`, and registering the same name
  twice silently replaces (with a `console.info`). Fine in practice, awkward in tests.
- **Built-in labels are only translated to `en`.**
- **No RBAC per component** — if a preset enables it, every editor with field access can use it.
- **No automated test in a real Strapi instance**; coverage is unit-level only.
