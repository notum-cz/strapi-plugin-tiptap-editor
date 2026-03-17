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
  - [Available Extensions](#available-extensions)
    - [Inline Formatting](#inline-formatting)
    - [Block Elements](#block-elements)
    - [Headings](#headings)
    - [Links](#links)
    - [Tables](#tables)
    - [Text Alignment](#text-alignment)
    - [Text Color \& Highlight Color](#text-color--highlight-color)
    - [Images](#images)
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
- **Links**, **tables**
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

| Key            | Description                      | Toolbar                                     |
| -------------- | -------------------------------- | ------------------------------------------- |
| `mediaLibrary` | Images from Strapi Media Library | Image button + alt text popover + alignment |

Enables image insertion from the Strapi Media Library. When enabled, the toolbar shows an image button that opens the Media Library picker. After selecting an image:

- The image appears in the editor at its natural size (constrained to editor width)
- Alt text is prefilled from the asset's `alternativeText` metadata
- Clicking a selected image opens a popover to edit alt text or delete the image
- Three alignment buttons (left, center, right) allow repositioning the image

The image stores both the URL (`src`) and the Strapi asset ID (`data-asset-id`) in the Tiptap JSON output.

**Content safety:** If you remove `mediaLibrary` from a preset, existing images in content are preserved and rendered read-only — they are never silently deleted.

```ts
{
  mediaLibrary: true,
}
```

## Theme

The `theme` key in the plugin config lets you define colors for the color pickers and inject custom CSS into the editor.

### Colors

Define a `colors` array to populate the text color and highlight color pickers. Each entry needs a `label` (shown as a tooltip) and a `color` value (hex, rgb, rgba, hsl, hsla, or CSS variable).

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

          // Tables
          table: true,

          // Text alignment (left, center, right, justify)
          textAlign: true,

          // Text and highlight colors (requires theme.colors)
          textColor: true,
          highlightColor: true,

          // Images from Strapi Media Library
          mediaLibrary: true,
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
