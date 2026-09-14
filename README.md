<div align="center">
  <picture>
    <img src="https://raw.githubusercontent.com/notum-cz/strapi-plugin-tiptap-editor/main/assets/notum-tiptap-icon.png" height="250" alt="Notum Tiptap Plugin Logo"/>
  </picture>

  <h1>TipTap Editor Plugin for Strapi V5</h1>
  <p>by<br />
  <a href="https://notum.tech/?utm_source=strapi-plugin&utm_medium=github&utm_campaign=tiptap-readme">
    <img style="margin-top: 0.5rem" src="https://raw.githubusercontent.com/notum-cz/strapi-plugin-tiptap-editor/main/assets/notum-logo.svg" alt="Notum Technologies" />
  </a>
  </p>

  <p>
    A drop-in TipTap WYSIWYG editor for Strapi v5. <br />
    Rich text, tables, images, and more, configured in minutes.
  </p>

  <!-- Badges -->
  <p>
    <a
      href="https://github.com/notum-cz/strapi-plugin-tiptap-editor/graphs/contributors"
    >
      <img
        src="https://img.shields.io/github/contributors/notum-cz/strapi-plugin-tiptap-editor"
        alt="contributors"
      />
    </a>
    <a href="https://github.com/notum-cz/strapi-plugin-tiptap-editor/commits">
      <img
        src="https://img.shields.io/github/last-commit/notum-cz/strapi-plugin-tiptap-editor"
        alt="last update"
      />
    </a>
    <a href="https://github.com/notum-cz/strapi-plugin-tiptap-editor/issues/">
      <img
        src="https://img.shields.io/github/issues/notum-cz/strapi-plugin-tiptap-editor"
        alt="open issues"
      />
    </a>
    <a
      href="https://github.com/notum-cz/strapi-plugin-tiptap-editor/blob/main/LICENSE"
    >
      <img
        src="https://img.shields.io/github/license/notum-cz/strapi-plugin-tiptap-editor"
        alt="license"
      />
    </a>
    <a
      href="https://github.com/notum-cz/strapi-plugin-tiptap-editor/stargazers"
    >
      <img
        src="https://img.shields.io/github/stars/notum-cz/strapi-plugin-tiptap-editor"
        alt="stars"
      />
    </a>
  </p>

  <h4>
    <a href="https://github.com/notum-cz/strapi-plugin-tiptap-editor/issues/"
      >Report Bug or Request Feature</a
    >
  </h4>
</div>

<br />

<!-- Table of Contents -->

# Table of Contents

- [Table of Contents](#table-of-contents)
  - [About the Project](#about-the-project)
    - [Features](#features)
    - [Screenshots](#screenshots)
    - [Supported Versions](#supported-versions)
  - [Getting Started](#getting-started)
    - [Installation](#installation)
      - [1. Install the plugin via npm or yarn](#1-install-the-plugin-via-npm-or-yarn)
      - [2. Rebuild Strapi and test the plugin](#2-rebuild-strapi-and-test-the-plugin)
  - [Configuration](#configuration)
    - [Defining Presets](#defining-presets)
    - [Assigning a Preset to a Field](#assigning-a-preset-to-a-field)
    - [Multiple Presets](#multiple-presets)
  - [Custom components](#custom-components)
    - [The `components` Preset Key](#the-components-preset-key)
    - [Registering a Component](#registering-a-component)
    - [The `extension()` Escape Hatch](#the-extension-escape-hatch)
    - [Editor UX](#editor-ux)
    - [Rendering Components on the Frontend](#rendering-components-on-the-frontend)
    - [The `richTextComponents` API](#the-richtextcomponents-api)
  - [Available Extensions](#available-extensions)
    - [Inline Formatting](#inline-formatting)
    - [Block Elements](#block-elements)
    - [Headings](#headings)
    - [Links](#links)
    - [Tables](#tables)
    - [Text Alignment](#text-alignment)
    - [Text Color \& Highlight Color](#text-color--highlight-color)
    - [Images](#images)
      - [Rendering images on the frontend](#rendering-images-on-the-frontend)
  - [Theme](#theme)
    - [Colors](#colors)
    - [Custom Stylesheet](#custom-stylesheet)
  - [Configuration Reference](#configuration-reference)
    - [Feature Values](#feature-values)
    - [Full Preset Example](#full-preset-example)
    - [Config Validation](#config-validation)
  - [🤝 Community](#-community)
    - [Maintained by Notum Technologies](#maintained-by-notum-technologies)
      - [Current maintainer](#current-maintainer)
      - [Contributors](#contributors)
    - [Contributing](#contributing)

<!-- About the Project -->

## About the Project

<!-- Features -->

### Features

- **Rich text editing** powered by [TipTap](https://tiptap.dev/) - a modern, extensible WYSIWYG editor built on ProseMirror
- **Headings** (H1–H6), **bold**, **italic**, **underline**, **strikethrough**
- **Ordered & unordered lists**, task lists
- **Links**, **tables** with an optional cell background picker
- **Images** from Strapi Media Library with alt text editing and alignment
- **Code blocks** with syntax highlighting
- **Blockquotes**, **horizontal rules**
- Full **keyboard shortcut** support
- Seamless integration with Strapi's content management system

<!-- Screenshots -->

### Screenshots

<div align="center"> 
  <picture>
    <source srcset="https://raw.githubusercontent.com/notum-cz/strapi-plugin-tiptap-editor/main/assets/tiptap-plugin-dark.png" media="(prefers-color-scheme: dark)">
    <img src="https://raw.githubusercontent.com/notum-cz/strapi-plugin-tiptap-editor/main/assets/tiptap-plugin-light.png" alt="Strapi Plugin TipTap Editor Interface" />
  </picture>
</div>

<!-- Supported Versions -->

### Supported Versions

This plugin is compatible with Strapi `v5.x.x` and has been tested on Strapi `v5.34.0`. We expect it should also work on older version of Strapi V5.

| Plugin version | Strapi Version | Full Support |
| -------------- | -------------- | ------------ |
| 1.0.0          | 5.34.0         | ✅           |

<!-- Getting Started -->

## Getting Started

<!-- Installation -->

### Installation

#### 1. Install the plugin via npm or yarn

```bash
# NPM
npm i @notum-cz/strapi-plugin-tiptap-editor

# Yarn
yarn add @notum-cz/strapi-plugin-tiptap-editor

```

#### 2. Rebuild Strapi and test the plugin

```bash
  yarn build
  yarn start
```

## Configuration

The plugin uses a **preset** system. A preset is a named configuration that defines which editor tools are available. You define presets in your Strapi plugin config file, then assign them to individual fields via the Content-Type Builder.

### Defining Presets

Create or update the plugin configuration file at `config/plugins.ts` (or `config/plugins.js`):

```ts
// config/plugins.ts

export default () => ({
  'tiptap-editor': {
    config: {
      presets: {
        // Preset name -> feature configuration
        minimal: {
          bold: true,
          italic: true,
          link: true,
        },
      },
    },
  },
});
```

Only features explicitly set to `true` (or an options object) will appear in the toolbar. Any feature not listed, or set to `false`, will be hidden.

### Assigning a Preset to a Field

1. In the Strapi admin, open the **Content-Type Builder**.
2. Add or edit a field and choose the **Rich Text (Tiptap)** custom field type.
3. In the **Advanced Settings** tab, select a preset from the **Editor Preset** dropdown.
4. Save the content type.

The editor for that field will now show only the tools defined in the selected preset.

### Multiple Presets

You can define as many presets as you need. Different fields (even within the same content type) can use different presets:

```ts
// config/plugins.ts

export default () => ({
  'tiptap-editor': {
    config: {
      presets: {
        // A minimal preset for short-form content like titles or captions
        minimal: {
          bold: true,
          italic: true,
          underline: true,
        },

        // A standard preset for blog posts and articles
        standard: {
          bold: true,
          italic: true,
          underline: true,
          strike: true,
          heading: true,
          bulletList: true,
          orderedList: true,
          blockquote: true,
          link: true,
        },

        // A full preset with every feature enabled
        full: {
          bold: true,
          italic: true,
          underline: true,
          strike: true,
          code: true,
          codeBlock: true,
          heading: true,
          blockquote: true,
          bulletList: true,
          orderedList: true,
          link: true,
          table: true,
          textAlign: true,
          superscript: true,
          subscript: true,
          mediaLibrary: true,
        },
      },
    },
  },
});
```

## Custom components

On top of the built-in extensions above, the plugin supports **custom rich-text components**: named, schema-driven blocks (a call-to-action button, a callout box, a pricing table, anything your project needs) that plug into the same preset system, the same editor UI, and the same stored JSON as every built-in node. One component — `button` — ships with the plugin itself; everything else is defined by your project.

> Adding a component **to the plugin itself** (a new built-in like `button`), or want the short version of everything below? See [docs/adding-a-component.md](docs/adding-a-component.md).

### The `components` Preset Key

Components are enabled per preset exactly like any other feature, under a `components` key. Its value is a map from component name to `true`, `false`, or an options object:

```ts
presets: {
  blog: {
    bold: true,
    italic: true,
    components: {
      button: true,
      callout: { tones: ['info', 'warning'] },
    },
  },
},
```

`button` is registered by the plugin itself; `callout` here is a project-defined component (see [Registering a Component](#registering-a-component)). The object you write for a component (`{ tones: [...] }` above) is passed through unchanged to that component's `preview`, `form`, and `extension` as `options` — the preset only decides *who may insert and edit* a component, not what it renders as. See [Editor UX](#editor-ux) for what happens to a component a preset doesn't enable.

The `components` key is validated at startup, independently of the feature-key check in [Config Validation](#config-validation):

- It must be a plain object (or omitted entirely).
- Each value must be `true`, `false`, or a plain object.
- Each name must match `^[a-zA-Z][\w-]*$` — a letter, then any mix of letters, digits, `_`, and `-`.
- A name the editor already uses internally (`doc`, `text`, `paragraph`, `heading`, `blockquote`, `codeBlock`, `bulletList`, `orderedList`, `listItem`, `hardBreak`, `horizontalRule`, `image`, `table`, `tableRow`, `tableCell`, `tableHeader`) is rejected — a component can never shadow a built-in node.
- A well-formed name the plugin has never heard of is **accepted**. The component registry lives in the admin app (next section), not in this server-side config, so a name the config doesn't recognize yet just means nothing has registered it — the editor logs one console warning the first time it resolves that name, instead of failing to boot.

Two small helpers read this key at runtime, exported from `./shared` alongside the config types: `isComponentEnabled(config, name)` returns whether the active preset lets editors insert/edit a given component, and `getComponentOptions(config, name)` returns its options object (or `null` when absent or disabled).

### Registering a Component

Register components from your Strapi admin customization entry point, `src/admin/app.tsx`, inside `register(app)` — before any rich-text field mounts:

```tsx
// src/admin/app.tsx
import type { StrapiApp } from '@strapi/strapi/admin';
import {
  defineRichTextComponent,
  registerRichTextComponent,
} from '@notum-cz/strapi-plugin-tiptap-editor/strapi-admin';
import type { RichTextComponentSchema } from '@notum-cz/strapi-plugin-tiptap-editor/shared';
import { CalloutIcon } from './icons/CalloutIcon';
import { CalloutPreview } from './components/CalloutPreview';

// A plain schema — no React, no admin-only fields. Share this module with your
// frontend renderer too (see "Rendering Components on the Frontend") so both sides
// agree on the node's shape by construction.
export const calloutSchema: RichTextComponentSchema = {
  name: 'callout',
  label: 'Callout',
  content: 'block+', // present -> container with editable content; omit for an atom like `button`
  attributes: {
    tone: {
      default: 'info',
      form: {
        type: 'select',
        label: 'Tone',
        options: [
          { value: 'info', label: 'Info' },
          { value: 'warning', label: 'Warning' },
        ],
      },
    },
  },
};

type CalloutAttrs = { tone: 'info' | 'warning' };

const calloutComponent = defineRichTextComponent<CalloutAttrs>({
  ...calloutSchema,
  label: { id: 'app.components.callout.label', defaultMessage: 'Callout' },
  icon: <CalloutIcon />,
  preview: CalloutPreview,
  defaultAttrs: { tone: 'info' },
  validate: (attrs) => (attrs.tone ? null : { tone: 'Tone is required' }),
});

export default {
  register(app: StrapiApp) {
    registerRichTextComponent(calloutComponent);
  },
};
```

`defineRichTextComponent` does nothing at runtime — it just hands the definition object back with its attribute type (`CalloutAttrs`) attached, so the rest of the file is checked against it. `registerRichTextComponent` is what actually makes the component available; call it once per component, every time the admin app boots.

A definition builds on the same `name` / `content` / `attributes` shape as `RichTextComponentSchema` (spread above from `calloutSchema`), plus admin-only fields:

- **`label`** — a plain string, or `{ id, defaultMessage }` for `react-intl` — shown in the Insert menu and dialog title.
- **`icon`** — a `ReactNode` shown next to the label in the menu and on the component's card.
- **`defaultAttrs`** — overrides the schema's own attribute defaults for a freshly inserted node.
- **`validate`** — runs after the generated field checks on submit; return `{ [attribute]: message }` for the ones that fail, or `null`/nothing.
- **`preview`** — rendered inside the generic card instead of the default attribute summary. Receives `{ attrs, options, enabled, selected, children }`; `children` is the editable content slot, passed only for containers (components with `content`):

  ```tsx
  // src/admin/components/CalloutPreview.tsx
  import type { RichTextComponentPreviewProps } from '@notum-cz/strapi-plugin-tiptap-editor/strapi-admin';

  type CalloutAttrs = { tone: 'info' | 'warning' };

  export function CalloutPreview({ attrs, children }: RichTextComponentPreviewProps<CalloutAttrs>) {
    return (
      <div data-tone={attrs.tone} style={{ borderLeft: '4px solid', padding: '0.5rem 1rem' }}>
        {children}
      </div>
    );
  }
  ```

- **`form`** — replaces the generated dialog body entirely with your own component, receiving `{ attrs, onChange, errors, mode, options }`. Use this when an attribute needs a control the generated dialog doesn't have (a media picker, a rich color swatch, cross-field logic); otherwise the generated form (see [Editor UX](#editor-ux)) is usually enough.

### The `extension()` Escape Hatch

For full control over the node — custom ProseMirror commands, keyboard shortcuts, a hand-built NodeView — skip the generated node and return your own Tiptap extension from `extension(helpers, ctx)`:

```tsx
const calloutComponent = defineRichTextComponent<CalloutAttrs>({
  ...calloutSchema,
  label: 'Callout',
  extension: (helpers, ctx) => {
    const { Node, mergeAttributes, ReactNodeViewRenderer } = helpers;
    return Node.create({
      name: calloutSchema.name,
      group: 'block',
      content: calloutSchema.content,
      addOptions: () => ({ enabled: ctx.enabled, component: ctx.options }),
      addAttributes: () => ({ tone: { default: 'info' } }),
      parseHTML: () => [{ tag: 'div[data-type="callout"]' }],
      renderHTML: ({ HTMLAttributes }) => [
        'div',
        mergeAttributes({ 'data-type': 'callout' }, HTMLAttributes),
        0,
      ],
      addNodeView: () => ReactNodeViewRenderer(MyCalloutNodeView),
    });
  },
});
```

`helpers` bundles every Tiptap primitive the plugin itself uses — `Node`, `Mark`, `Extension`, `mergeAttributes`, `ReactNodeViewRenderer`, `NodeViewWrapper`, `NodeViewContent` — and `ctx` carries the same `{ enabled, options }` the generic card receives for the active preset. `name`/`label`/`icon` on the definition still drive the Insert menu regardless of `extension`; everything about the node itself is up to you.

**Never import `@tiptap/*` packages directly in host admin code — always go through `helpers`.** The rich-text input (and everything it imports, including all of Tiptap) loads through a dynamic `import()` only when a field actually mounts; `src/admin/app.tsx` is loaded eagerly at admin boot. Importing `@tiptap/core` (or any other `@tiptap/*` package) directly there would pull a second copy of Tiptap into that eager bundle and risk it drifting out of sync with the version the plugin ships.

### Editor UX

- **Insert menu** — when the active preset enables at least one component, the toolbar shows an **Insert component** button. It lists every enabled component by icon and label; picking one opens the insert dialog.
- **Generated dialog** — when a definition has no `form`, the insert/edit dialog is generated from `attributes[*].form`:

  | `form.type` | Renders as |
  | --- | --- |
  | `text` / `url` | Single-line text input (`url` uses the browser's URL input type) |
  | `textarea` | Multi-line text input |
  | `number` | Number input, with optional `min`/`max` |
  | `boolean` | Toggle |
  | `select` | Single-select dropdown built from `options` |
  | `json` | Multi-line input edited as raw JSON text, parsed (and validated) on submit |

  An attribute with no `form` is stored and round-tripped but never shown in the dialog.

- **Generic card** — every component node renders inside the same card shape: a header (drag handle, icon, label, and Edit/Delete actions) and a body (the definition's `preview`, or a generated "Label: value" summary of its form-visible attributes when there's no `preview`). A container's editable ProseMirror content flows into `preview` as `children`; without a `preview`, it renders directly below the summary.
- **Read-only behaviour** — a component your project has registered but the *active preset* doesn't enable still renders: its card shows a "Read-only in this preset" badge, the Edit button is hidden, and Delete stays available. This is because **every registered component is always part of the editor's schema** — the preset only gates *inserting and editing*, never *reading*. A document written under a richer preset (or before a component was disabled) keeps round-tripping through a narrower one instead of silently losing nodes on save.

Under the hood, a component's clipboard HTML is `<div data-type="name">` with one `data-<attribute-in-kebab-case>` attribute per schema attribute (e.g. `openInNewTab` becomes `data-open-in-new-tab`) — string attributes are written raw, everything else as JSON. Clearing an attribute back to `null` still writes `data-open-in-new-tab="null"` rather than dropping the attribute, for any attribute whose schema default isn't itself a string; for a string-typed attribute, clearing it is indistinguishable from leaving it at the default, so the attribute is simply omitted.

### Rendering Components on the Frontend

The published `@notum-cz/strapi-plugin-tiptap-editor/shared` entry is meant to be imported from both your Strapi admin customizations and your frontend, so a component's shape is defined exactly once. Alongside the config helpers above, it exports:

- **`RichTextComponentSchema`**, **`RichTextAttributeSpec`**, **`RichTextAttributeFormField`** — the plain-object schema shape (no React, no Tiptap) used to register a component and, via `toNodeSpec`, to render it.
- **`toNodeSpec(schema)`** — reduces a `RichTextComponentSchema` to a `RichTextNodeSpec`: `name`, `group: 'block'`, `atom` (true when there's no `content`), the `content` expression if any, and attribute defaults with the `form` metadata dropped — everything a ProseMirror schema needs, nothing else.
- **`buttonSchema`** (and `BUILT_IN_COMPONENT_SCHEMAS`) — the plugin's own built-in schemas, so a frontend can render `button` without redefining it.
- **`isValidComponentName`**, **`isReservedNodeName`**, **`RESERVED_NODE_NAMES`** — the same name rules [Config Validation](#config-validation) enforces on the server.

A frontend renderer built on [`@tiptap/static-renderer`](https://tiptap.dev/docs/editor/api/utilities/static-renderer) turns a schema into a schema-only extension with `toNodeSpec`, then maps the node name to a component with `nodeMapping`:

```tsx
import { Node, getSchema } from '@tiptap/core';
import type { NodeProps } from '@tiptap/static-renderer';
import { renderToReactElement } from '@tiptap/static-renderer/pm/react';
import type { Node as ProseMirrorNode } from 'prosemirror-model';
import type { ReactNode } from 'react';
import {
  toNodeSpec,
  type RichTextComponentSchema,
} from '@notum-cz/strapi-plugin-tiptap-editor/shared';

// The same schema registered in src/admin/app.tsx — keep it in a shared module.
const calloutSchema: RichTextComponentSchema = {
  name: 'callout',
  label: 'Callout',
  content: 'block+',
  attributes: { tone: { default: 'info' } },
};

// Schema-only node: enough for the renderer's ProseMirror schema, no editing behaviour.
function rendererNode(schema: RichTextComponentSchema) {
  const spec = toNodeSpec(schema);
  return Node.create({
    name: spec.name,
    group: spec.group,
    atom: spec.atom,
    content: spec.content,
    addAttributes: () => spec.attributes,
  });
}

const extensions = [/* StarterKit, your other extensions, */ rendererNode(calloutSchema)];
const schema = getSchema(extensions);

function renderCallout({ node, children }: NodeProps<ProseMirrorNode, ReactNode | ReactNode[]>) {
  return <aside data-tone={node.attrs.tone as string}>{children}</aside>;
}

// `storedContent` is the Tiptap/ProseMirror JSON straight from the Strapi API.
const rendered = renderToReactElement({
  extensions,
  content: stripUnknownContent(storedContent, schema).content, // see note below
  options: { nodeMapping: { callout: renderCallout } },
});
```

(`@tiptap/html`'s `generateHTML(content, extensions)` follows the same idea if you need an HTML string instead of React elements — see [Rendering images on the frontend](#rendering-images-on-the-frontend) for that style with a built-in node.)

**Strip unknown nodes before rendering.** `Node.fromJSON` — called internally by both `renderToReactElement` and `generateHTML` — throws if the stored JSON references a node type your `extensions` array doesn't define. That happens whenever the frontend's extension list doesn't exactly mirror what a document was written with (a component enabled in Strapi but not yet wired up on the frontend, or removed later). Write a small sanitizer that walks the JSON first and drops — or, for a container, unwraps into its children — any node or mark type absent from your renderer's `schema.nodes` / `schema.marks`, and run stored content through it before handing it to the renderer. The Notum Next.js starter for this plugin ships exactly this logic as a `stripUnknownContent(content, schema)` helper that returns `{ content, unknownNodeTypes, unknownMarkTypes }` — the sanitized document plus the two lists, so callers can log a warning when either is non-empty (that's what the `.content` above picks out).

### The `richTextComponents` API

The same three functions are also exposed on the plugin object, for admin customizations that would rather not add a direct package import:

```ts
const { register, define, list } = app.getPlugin('tiptap-editor').apis.richTextComponents;
```

- **`register(definition)`** — same as `registerRichTextComponent`: registers or replaces a definition by name.
- **`define(definition)`** — same as `defineRichTextComponent`: the identity helper that types a definition object.
- **`list()`** — same as `listRichTextComponents`: every currently registered definition, in registration order.

## Available Extensions

### Inline Formatting

| Key           | Description        | Toolbar      | Keyboard Shortcut      |
| ------------- | ------------------ | ------------ | ---------------------- |
| `bold`        | Bold text          | **B** button | `Ctrl/Cmd + B`         |
| `italic`      | Italic text        | _I_ button   | `Ctrl/Cmd + I`         |
| `underline`   | Underlined text    | **U** button | `Ctrl/Cmd + U`         |
| `strike`      | Strikethrough text | ~~S~~ button | `Ctrl/Cmd + Shift + S` |
| `code`        | Inline code        | `<>` button  | `Ctrl/Cmd + E`         |
| `superscript` | Superscript text   | x^2 button   | `Ctrl/Cmd + .`         |
| `subscript`   | Subscript text     | x_2 button   | `Ctrl/Cmd + ,`         |

**Usage:** Set to `true` to enable with defaults.

```ts
{
  bold: true,
  italic: true,
  underline: true,
  strike: true,
  code: true,
  superscript: true,
  subscript: true,
}
```

### Block Elements

| Key           | Description        | Toolbar                          |
| ------------- | ------------------ | -------------------------------- |
| `blockquote`  | Block quotes       | Quote button                     |
| `codeBlock`   | Fenced code blocks | (via keyboard or markdown input) |
| `bulletList`  | Unordered lists    | Bullet list button               |
| `orderedList` | Numbered lists     | Numbered list button             |

**Usage:** Set to `true` to enable.

```ts
{
  blockquote: true,
  codeBlock: true,
  bulletList: true,
  orderedList: true,
}
```

### Headings

| Key       | Description            | Toolbar                           |
| --------- | ---------------------- | --------------------------------- |
| `heading` | Heading levels (h1-h6) | Style dropdown + SEO tag dropdown |

The heading extension includes an SEO tag selector that lets content editors set the semantic HTML tag independently from the visual heading level. This allows for proper document outline without being constrained by visual styles.

**Simple usage** — enables all heading levels (h1-h6):

```ts
{
  heading: true,
}
```

**Custom levels** — restrict which heading levels are available:

```ts
{
  // Only allow h1, h2, and h3 in the style dropdown
  heading: {
    levels: [1, 2, 3],
  },
}
```

The `levels` array accepts values from `1` to `6`. The SEO tag dropdown always shows all six levels (h1-h6) regardless of this setting, since the semantic tag is independent of the visual heading level.

### Links

| Key    | Description | Toolbar                   |
| ------ | ----------- | ------------------------- |
| `link` | Hyperlinks  | Link button + link dialog |

Links open a dialog where editors can enter a URL. By default, links do not open on click in the editor (to allow editing).

**Simple usage:**

```ts
{
  link: true,
}
```

**With options:**

```ts
{
  link: {
    openOnClick: true, // Open links on click in the editor (default: false)
    HTMLAttributes: {
      rel: 'noopener noreferrer',
      target: '_blank',
    },
  },
}
```

### Tables

| Key     | Description                    | Toolbar                            |
| ------- | ------------------------------ | ---------------------------------- |
| `table` | Insertable and editable tables | Table button + column/row controls |

Enables table insertion with controls for adding/removing columns and rows. Tables are resizable by default.

```ts
{
  table: true,
}
```

Set `cellBackground: true` to add a **Cell background** picker next to the row/column controls. It paints the cell under the cursor, or every cell in a multi-cell selection, using the [theme colors](#colors).

```ts
{
  table: { cellBackground: true },
}
```

The color is stored as a `backgroundColor` attribute on `tableCell` and `tableHeader` nodes (`null` when unset). Both nodes always carry the attribute, so content painted under one preset keeps its colors when edited under a preset without the picker. A frontend that renders the JSON with its own Tiptap schema has to declare the attribute too, or Tiptap drops it:

```ts
import { TableCell, TableHeader, TableKit } from '@tiptap/extension-table';

const withBackground = {
  backgroundColor: {
    default: null,
    parseHTML: (element) => element.style.backgroundColor || null,
    renderHTML: (attributes) =>
      attributes.backgroundColor ? { style: `background-color: ${attributes.backgroundColor}` } : {},
  },
};

const extensions = [
  TableKit.configure({ tableCell: false, tableHeader: false }),
  TableCell.extend({ addAttributes() { return { ...this.parent?.(), ...withBackground }; } }),
  TableHeader.extend({ addAttributes() { return { ...this.parent?.(), ...withBackground }; } }),
];
```

### Text Alignment

| Key         | Description             | Toolbar                              |
| ----------- | ----------------------- | ------------------------------------ |
| `textAlign` | Text alignment controls | Left, Center, Right, Justify buttons |

Enables all four alignment buttons (left, center, right, justify).

```ts
{
  textAlign: true,
}
```

### Text Color & Highlight Color

| Key              | Description                       | Toolbar                |
| ---------------- | --------------------------------- | ---------------------- |
| `textColor`      | Change the color of selected text | Font color picker      |
| `highlightColor` | Apply a background highlight      | Highlight color picker |

Both features use a color picker popover that displays the colors defined in the [theme configuration](#colors). If no colors are configured, the buttons will not appear.

```ts
{
  textColor: true,
  highlightColor: true,
}
```

### Images

| Key            | Description                      | Toolbar                                                   |
| -------------- | -------------------------------- | --------------------------------------------------------- |
| `mediaLibrary` | Images from Strapi Media Library | Image button + alt/title/caption popover + alignment + resize handle |

Enables image insertion from the Strapi Media Library. When enabled, the toolbar shows an image button that opens the Media Library picker. After selecting an image:

- The image appears in the editor at its natural size (constrained to editor width)
- Alt text is prefilled from the asset's `alternativeText` metadata, caption from its `caption`
- Clicking a selected image opens a popover with:
  - Three **alignment** buttons (left, center, right)
  - **Width** and **Height** inputs (in pixels) for precise sizing
  - A **reset** button to restore the original dimensions
  - **Alt text**, **Title** and **Caption** inputs
  - A **Use Media Library data** button that re-reads `alternativeText` and `caption` from the asset, and a **delete** button
- A **resize handle** (blue dot) appears at the bottom-right corner on hover — drag it to resize the image

The image stores the URL (`src`), Strapi asset ID (`data-asset-id`), alignment (`data-align`), dimensions (`width`, `height`), alt text (`alt`), title (`title`, the `<img title>` tooltip) and caption (`caption`, meant for a `<figcaption>`) in the Tiptap JSON output.

**Content safety:** If you remove `mediaLibrary` from a preset, existing images in content are preserved and rendered read-only — they are never silently deleted.

```ts
{
  mediaLibrary: true,
}
```

**Resize** is configured through the `resize` key inside `mediaLibrary`. The options match the standard `@tiptap/extension-image` `resize` configuration. When `resize` is omitted or set to `false`, the resize handle and dimension controls are hidden.

```ts
{
  mediaLibrary: {
    resize: {
      enabled: true,
      alwaysPreserveAspectRatio: true,
      minWidth: 50,
      minHeight: 50,
    },
  },
}
```

| Option                              | Default | Description                                           |
| ----------------------------------- | ------- | ----------------------------------------------------- |
| `resize`                            | _none_  | Set to `false` or omit to disable resize entirely     |
| `resize.enabled`                    | `true`  | Enable or disable resize when the object is present   |
| `resize.alwaysPreserveAspectRatio`  | `true`  | Lock aspect ratio when resizing or editing dimensions |
| `resize.minWidth`                   | `50`    | Minimum allowed width in pixels                       |
| `resize.minHeight`                  | `50`    | Minimum allowed height in pixels                      |

#### Rendering images on the frontend

The plugin stores content as **Tiptap/ProseMirror JSON**. The `width`, `height`, `src`, `alt`, and `title` attributes are standard and will render automatically with `@tiptap/extension-image`. However, the custom `data-align`, `data-asset-id` and `caption` attributes require extending the Image extension on your frontend (render `caption` as a `<figcaption>` yourself):

```ts
import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';

// Extend with the custom attributes used by this plugin
const StrapiImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      'data-align': { default: null },
      'data-asset-id': { default: null },
      caption: { default: null },
    };
  },
});

// Convert the JSON from the Strapi API to HTML
const html = generateHTML(apiResponse.content, [
  StarterKit,
  StrapiImage,
  // ...other extensions you use
]);
```

Then add CSS for alignment on your frontend:

```css
img[data-align="center"] {
  display: block;
  margin-left: auto;
  margin-right: auto;
}

img[data-align="right"] {
  display: block;
  margin-left: auto;
  margin-right: 0;
}
```

## Theme

The `theme` key in the plugin config lets you define colors for the color pickers and inject custom CSS into the editor.

### Colors

Define a `colors` array to populate the text color, highlight color and table cell background pickers. Each entry needs a `label` (shown as a tooltip) and a `color` value (hex, rgb, rgba, hsl, hsla, or CSS variable).

```ts
// config/plugins.ts

export default () => ({
  'tiptap-editor': {
    config: {
      theme: {
        colors: [
          { label: 'Black', color: '#000000' },
          { label: 'Dark gray', color: '#4A4A4A' },
          { label: 'Red', color: '#E53E3E' },
          { label: 'Orange', color: '#DD6B20' },
          { label: 'Blue', color: '#3182CE' },
          { label: 'Green', color: '#38A169' },
          { label: 'Brand primary', color: 'var(--color-primary)' },
        ],
      },
      presets: {
        blog: {
          bold: true,
          italic: true,
          textColor: true,
          highlightColor: true,
        },
      },
    },
  },
});
```

### Custom Stylesheet

You can inject custom CSS to style the editor content area. There are two options — use one or the other, not both.

**Option 1: `css`** — Inline CSS content (recommended for monorepos and production deployments)

Read the file at Strapi startup so the CSS is captured as a string. This works reliably across all environments (local dev, Docker, Azure Container Apps, etc.) because the file is resolved in your app's Node process at boot time.

```ts
// config/plugins.ts
import { readFileSync } from 'fs';

export default () => ({
  'tiptap-editor': {
    config: {
      theme: {
        css: readFileSync(require.resolve('@repo/design-system/strapi-styles.css'), 'utf-8'),
      },
    },
  },
});
```

**Option 2: `stylesheet`** — A URL the browser can fetch directly

Use this when the stylesheet is hosted at a known URL (CDN, public path, etc.).

```ts
// config/plugins.ts

export default () => ({
  'tiptap-editor': {
    config: {
      theme: {
        stylesheet: 'https://cdn.example.com/editor-styles.css',
      },
    },
  },
});
```

## Configuration Reference

### Feature Values

Each feature key in a preset accepts one of these values:

| Value           | Meaning                                                    |
| --------------- | ---------------------------------------------------------- |
| `true`          | Feature enabled with default options                       |
| `false`         | Feature explicitly disabled                                |
| _(key omitted)_ | Feature disabled (absent keys are treated as disabled)     |
| `{ ... }`       | Feature enabled with custom options (merged with defaults) |

### Full Preset Example

Here is a single preset with every available feature enabled and annotated:

```ts
// config/plugins.ts

export default () => ({
  'tiptap-editor': {
    config: {
      presets: {
        everything: {
          // Inline formatting
          bold: true,
          italic: true,
          underline: true,
          strike: true,
          code: true,
          superscript: true,
          subscript: true,

          // Block elements
          blockquote: true,
          codeBlock: true,
          bulletList: true,
          orderedList: true,

          // Headings — all levels (same as heading: true)
          heading: {
            levels: [1, 2, 3, 4, 5, 6],
          },

          // Links — custom HTML attributes
          link: {
            HTMLAttributes: {
              rel: 'noopener noreferrer',
            },
          },

          // Tables, with the cell background picker fed by theme.colors
          table: { cellBackground: true },

          // Text alignment (left, center, right, justify)
          textAlign: true,

          // Text and highlight colors (requires theme.colors)
          textColor: true,
          highlightColor: true,

          // Images from Strapi Media Library with resize enabled
          mediaLibrary: {
            resize: { enabled: true },
          },

          // Custom components — see "Custom components" below
          components: {
            button: true,
          },
        },
      },
    },
  },
});
```

### Config Validation

The plugin validates your configuration at startup. If a preset contains an invalid feature key, Strapi will throw an error with a message listing the invalid keys and all allowed keys. This prevents typos from silently disabling features.

```ts
// This will throw an error at startup:
{
  presets: {
    blog: {
      bold: true,
      boldd: true,  // Typo! Not a valid feature key
    },
  },
}
```

The `components` key has its own validation, independent of the feature-key check above: it must be a plain object; each value must be `true`, `false`, or a plain object; each name must match `^[a-zA-Z][\w-]*$`; and it may not reuse a name the editor already defines internally. See [Custom components](#custom-components) for the full rule set.

```ts
// This also throws at startup — "paragraph" is a reserved node name:
{
  presets: {
    blog: {
      components: { paragraph: true },
    },
  },
}
```

## 🤝 Community

### Maintained by [Notum Technologies](https://notum.tech/?utm_source=strapi-plugin&utm_medium=github&utm_campaign=tiptap-readme)

Built and maintained by [Notum Technologies](https://notum.tech/?utm_source=strapi-plugin&utm_medium=github&utm_campaign=tiptap-readme), a Czech-based Strapi Enterprise Partner with a passion for open-source tooling.

#### Current maintainer

[Dominik Juriga](https://github.com/dominik-juriga)

#### Contributors

<a href="https://github.com/notum-cz/strapi-plugin-tiptap-editor/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=notum-cz/strapi-plugin-tiptap-editor" alt="Contributors" />
</a>

### Contributing

Contributions of all kinds are welcome: code, documentation, bug reports, and feature ideas.
<br> <br> Browse the [open issues](https://github.com/notum-cz/strapi-plugin-tiptap-editor/issues) to find something to work on, or open a new one to start a discussion. Pull requests are always appreciated!

If you'd like to directly contribute, check our [Contributions document](https://github.com/notum-cz/strapi-plugin-tiptap-editor?tab=contributing-ov-file).
