<div align="center">
  <picture>
    <img src="https://raw.githubusercontent.com/notum-cz/strapi-plugin-tiptap-editor/main/assets/notum-tiptap-icon.png" height="250" alt="Notum Tiptap Plugin Logo"/>
  </picture>

  <h1>TipTap v3 + Edifice IO Editor Plugin for Strapi v5</h1>
  <p>by<br />
  <a href="https://notum.tech/?utm_source=strapi-plugin&utm_medium=github&utm_campaign=tiptap-readme">
    <img style="margin-top: 0.5rem" src="https://raw.githubusercontent.com/notum-cz/strapi-plugin-tiptap-editor/main/assets/notum-logo.svg" alt="Notum Technologies" />
  </a>
  </p>

  <p>
    The ultimate drop-in TipTap v3 WYSIWYG editor for Strapi v5. <br />
    48 rich-text features, Edifice IO multimedia &amp; structured blocks, relational media &amp; internal link sync, in-editor image studio &amp; audio recorder, speech tools, and WCAG 2.1 AA accessibility.
  </p>

  <!-- Badges -->
  <p>
    <a href="https://github.com/notum-cz/strapi-plugin-tiptap-editor/graphs/contributors">
      <img src="https://img.shields.io/github/contributors/notum-cz/strapi-plugin-tiptap-editor" alt="contributors" />
    </a>
    <a href="https://github.com/notum-cz/strapi-plugin-tiptap-editor/commits">
      <img src="https://img.shields.io/github/last-commit/notum-cz/strapi-plugin-tiptap-editor" alt="last update" />
    </a>
    <a href="https://github.com/notum-cz/strapi-plugin-tiptap-editor/issues/">
      <img src="https://img.shields.io/github/issues/notum-cz/strapi-plugin-tiptap-editor" alt="open issues" />
    </a>
    <a href="https://github.com/notum-cz/strapi-plugin-tiptap-editor/blob/main/LICENSE">
      <img src="https://img.shields.io/github/license/notum-cz/strapi-plugin-tiptap-editor" alt="license" />
    </a>
    <a href="https://github.com/notum-cz/strapi-plugin-tiptap-editor/stargazers">
      <img src="https://img.shields.io/github/stars/notum-cz/strapi-plugin-tiptap-editor" alt="stars" />
    </a>
  </p>

  <h4>
    <a href="https://github.com/notum-cz/strapi-plugin-tiptap-editor/issues/">Report Bug or Request Feature</a>
  </h4>
</div>

<br />

# Table of Contents

- [About the Project](#about-the-project)
  - [Features](#features)
  - [Screenshots](#screenshots)
  - [Supported Versions](#supported-versions)
- [Getting Started](#getting-started)
  - [Installation](#installation)
- [Configuration](#configuration)
  - [Built-In Presets](#built-in-presets)
  - [Defining Custom Presets (`config/plugins.ts`)](#defining-custom-presets-configpluginsts)
  - [Admin Settings UI (`/settings/tiptap-editor`)](#admin-settings-ui-settingstiptap-editor)
  - [Field-Level Options (Content-Type Builder)](#field-level-options-content-type-builder)
- [Relational Media & Internal Links Synchronization](#relational-media--internal-links-synchronization)
  - [Companion `<FieldName>Media` Field](#companion-fieldnamemedia-field)
  - [Companion `<FieldName>Links` Component](#companion-fieldnamelinks-component)
- [Available Extensions (48 Feature Keys)](#available-extensions-48-feature-keys)
  - [Inline Formatting & Semantic Marks](#inline-formatting--semantic-marks)
  - [Typography Controls](#typography-controls)
  - [Block Elements & Structured Layouts](#block-elements--structured-layouts)
  - [Headings (with SEO Tag & Auto Anchor ID)](#headings-with-seo-tag--auto-anchor-id)
  - [Links & Internal Strapi Content Linker](#links--internal-strapi-content-linker)
  - [Tables (with Cell Background Color & Merge/Split)](#tables-with-cell-background-color--mergesplit)
  - [Text Alignment & Colors](#text-alignment--colors)
  - [Edifice IO Multimedia Suite](#edifice-io-multimedia-suite)
    - [Images & In-Editor HTML5 Canvas Image Studio](#images--in-editor-html5-canvas-image-studio-medialibrary)
    - [Video (Media Library + YouTube/Vimeo/MP4)](#video-video)
    - [Audio (Media Library + In-Browser Voice Recorder)](#audio-audio)
    - [Attachment Cards](#attachment-cards-attachment)
    - [Sandboxed HTTPS Iframes](#sandboxed-https-iframes-iframe)
  - [Mathematics, Emoji, Slash Commands & Speech Tools](#mathematics-emoji-slash-commands--speech-tools)
  - [Editor Modes & Footer](#editor-modes--footer)
- [Accessibility (WCAG 2.1 AA) & Security](#accessibility-wcag-21-aa--security)
- [Theme](#theme)
  - [Colors](#colors)
  - [Custom Stylesheet](#custom-stylesheet)
- [Configuration Reference](#configuration-reference)
  - [Feature Values](#feature-values)
  - [Full 48-Feature Preset Example](#full-48-feature-preset-example)
  - [Backend API Routes](#backend-api-routes)
  - [Config Validation](#config-validation)
- [🤝 Community](#-community)

---

## About the Project

### Features

- **Powered by [TipTap v3.20+](https://tiptap.dev/)** — modern, headless ProseMirror architecture with React NodeViews and zero-side-effect state updates (`useEditorState`).
- **48 Configurable Features** across 4 built-in presets (`minimal`, `default`, `full`, `edifice`) plus custom presets in `config/plugins.ts` and runtime overrides in Strapi Admin Settings.
- **Multi-Format Serialization** — stores **ProseMirror JSON** by default, or outputs sanitized **HTML** or **Markdown** per field.
- **Edifice IO Multimedia Suite**:
  - **Images (`mediaLibrary`)** with in-editor **HTML5 Canvas Image Crop/Rotate/Flip/Zoom Studio**, `<figure>`/`<figcaption>`, alt text, alignment, and drag-resize handle.
  - **Videos (`video`)** via Strapi Media Library or privacy-enhanced YouTube (`youtube-nocookie.com`), Vimeo, and direct MP4 URLs.
  - **Audio (`audio`)** via Strapi Media Library or **in-browser `MediaRecorder` Voice Note Recorder** with live timer and direct upload.
  - **Attachments (`attachment`)** with downloadable file cards, MIME badge, and formatted byte size.
  - **Iframes (`iframe`)** with strict `https:` enforcement, `sandbox` attributes, and domain allowlisting.
- **Relational Media & Internal Link Sync (Hashbite Lexical Pattern)**:
  - Automatically extracts all 4 embedded media types (`image`, `video`, `audio`, `attachment`) into a companion `<FieldName>Media` field and internal Strapi links (`strapi://collectionName/documentId` & `linker` nodes) into a companion `<FieldName>Links` component.
- **Structured Blocks & Editorial Tools**:
  - **Information Pane / Callout (`informationPane`)** (`info`, `success`, `warning`, `danger`), **Collapsible Accordion (`accordion`)** (`<details>`/`<summary>`), **Multi-Column Layout (`columns`)** (2-col / 3-col), **Task Lists (`taskList`)**, **Conversation History (`conversationHistory`)**, **Dynamic Table of Contents (`tableOfContents`)**, **Page Break (`pageBreak`)**, **Mathematics / LaTeX (`mathematics`)**, **Emoji Picker (`emoji`)**, and **Slash Commands (`/`) (`slashCommands`)**.
- **Typography & Semantic Accessibility Marks**:
  - **Font Family (`fontFamily`)**, **Font Size (`fontSize`)**, **Line Height (`lineHeight`)**, **Clear Formatting (`clearFormatting`)**, **Smart Typography (`typography`)**, **Lead Paragraph (`leadParagraph`)**, **Abbreviation `<abbr>` (`abbr`)**, and **Language `<span lang="..." dir="...">` (`language`)** for WCAG 2.1 SC 3.1.2 compliance.
- **Speech & Productivity Modes**:
  - **Speech-to-Text Dictation (`speechToText`)**, **Text-to-Speech Read Aloud (`textToSpeech`)**, **Character & Word Count (`characterCount`)**, **Fullscreen Mode (`fullscreen`)**, **Edifice Read-Only Preview**, and **JSON / HTML / Markdown Source Inspector**.
- **Zero-Data-Loss Content Safety**:
  - Disabling any rich node (`mediaLibrary`, `video`, `audio`, `attachment`, `iframe`, `linker`, `informationPane`, `mathematics`) in a preset renders existing content via read-only NodeViews (`enableContentCheck: true`) — content is **never** silently stripped on save.

### Screenshots

<div align="center"> 
  <picture>
    <source srcset="https://raw.githubusercontent.com/notum-cz/strapi-plugin-tiptap-editor/main/assets/tiptap-plugin-dark.png" media="(prefers-color-scheme: dark)">
    <img src="https://raw.githubusercontent.com/notum-cz/strapi-plugin-tiptap-editor/main/assets/tiptap-plugin-light.png" alt="Strapi Plugin TipTap Editor Interface" />
  </picture>
</div>

### Supported Versions

This plugin is compatible with Strapi `v5.x.x` (tested on Strapi `v5.34.0+`) and Node.js `^20.19.0 || ^22.13.0 || >=24.0.0`.

| Plugin version | Strapi Version | Node.js Version                      | TipTap Version | Full Support |
| -------------- | -------------- | ------------------------------------ | -------------- | ------------ |
| 1.2.x+         | 5.0.0 – 5.39+  | `^20.19.0 \|\| ^22.13.0 \|\| >=24.0.0` | 3.20.1         | ✅           |

> **Node.js Dependency Compatibility Note:** Runtime dependencies `undici` (`6.29.0`) and `isomorphic-dompurify` (`3.19.0`) are intentionally pinned to their `6.x` and `3.x` release lines to preserve Node.js `20.19+` and `22.13+` compatibility across the full Strapi v5 engine range (`isomorphic-dompurify` `4.x` requires Node `>=22.22.2`).

---

## Getting Started

### Installation

#### 1. Install the plugin via npm or yarn

```bash
# NPM
npm i @notum-cz/strapi-plugin-tiptap-editor

# Yarn
yarn add @notum-cz/strapi-plugin-tiptap-editor
```

#### 2. Rebuild Strapi and start the server

```bash
yarn build
yarn start
```

---

## Configuration

The plugin uses a hybrid **preset + runtime settings** architecture:

1. **Built-in Presets**: `minimal`, `default`, `full`, and `edifice` work out of the box with zero configuration.
2. **Code-first Presets (`config/plugins.ts`)**: Define custom named presets and theme options in version control.
3. **Runtime Settings UI (`/settings/tiptap-editor`)**: Override global defaults, allowed iframe domains, relational sync, and per-preset feature toggles stored in Strapi `core-store`.

### Built-In Presets

| Preset Name | Included Features |
| ----------- | ----------------- |
| `minimal`   | `bold`, `italic` |
| `default`   | `bold`, `italic`, `underline`, `strike`, `code`, `codeBlock`, `blockquote`, `bulletList`, `orderedList`, `hardBreak`, `horizontalRule`, `history`, `heading`, `link`, `table`, `textAlign`, `mediaLibrary`, `characterCount` |
| `full`      | All **48** features enabled |
| `edifice`   | All **48** features enabled (complete Edifice IO Playground experience) |

### Defining Custom Presets (`config/plugins.ts`)

Create or update `config/plugins.ts` (or `config/plugins.js`):

```ts
// config/plugins.ts
export default () => ({
  'tiptap-editor': {
    config: {
      presets: {
        minimal: {
          bold: true,
          italic: true,
          link: true,
        },
        editorial: {
          bold: true,
          italic: true,
          underline: true,
          heading: { levels: [1, 2, 3, 4] },
          leadParagraph: true,
          abbr: true,
          language: true,
          bulletList: true,
          orderedList: true,
          taskList: true,
          blockquote: true,
          informationPane: true,
          accordion: true,
          columns: true,
          link: true,
          linker: true,
          mediaLibrary: { resize: { enabled: true } },
          video: true,
          audio: true,
          attachment: true,
          table: true,
          characterCount: { limit: 10000 },
          fullscreen: true,
        },
      },
    },
  },
});
```

### Admin Settings UI (`/settings/tiptap-editor`)

Navigate to **Settings → Global Settings → Tiptap Editor** in the Strapi Admin panel to configure:

- **Default Preset** (`minimal`, `default`, `full`, `edifice`, or any custom preset)
- **Default Output Format** (`json`, `html`, or `markdown`)
- **Allowed Iframe Domains** (comma-separated hostnames, e.g. `youtube.com, player.vimeo.com`)
- **Relational Media & Internal Links Sync** toggle
- **Preset Feature Matrix** — interactively toggle any of the 48 features per preset

### Field-Level Options (Content-Type Builder)

When adding a **Rich Text (Tiptap)** custom field in the Strapi Content-Type Builder:

- **Basic Settings → Output Format (`options.outputFormat`)**: `json` (default ProseMirror JSON), `html` (sanitized HTML string), or `markdown` (Markdown string).
- **Advanced Settings**:
  - **Editor Preset (`options.preset`)**: Select which preset this field uses (`default`, `minimal`, `full`, `edifice`).
  - **Character Limit (`options.characterLimit`)**: Optional maximum character count for the field.
  - **Placeholder (`options.placeholder`)**: Custom placeholder text when the editor is empty.

---

## Relational Media & Internal Links Synchronization

Inspired by `hashbite/strapi-plugin-lexical` and expanded for all 4 Edifice IO media types, the editor can automatically synchronize embedded media and internal content links with companion Strapi relation fields on the same Content-Type.

### Companion `<FieldName>Media` Field

If your Rich Text field is named `content`, add a Media field named `contentMedia` (Multiple Media) to the same Content-Type. Whenever the document changes, `useRelationalSync` extracts all embedded:

- `image` (`data-asset-id` / `data-document-id`)
- `video` (`data-asset-id` / `data-document-id`)
- `audio` (`data-asset-id` / `data-document-id`)
- `attachment` (`data-asset-id` / `data-document-id`)

and updates `contentMedia` without triggering redundant form updates when relations haven't changed.

### Companion `<FieldName>Links` Component

To use companion internal link fields, first define a `links.links` component in your Strapi project (the plugin does not create schema components during server bootstrap). Once `links.links` is defined with your target collection relations, add a repeatable or single component field named `<FieldName>Links` (e.g. `contentLinks`) using `links.links` to the Content-Type. Any internal Strapi link inserted via the **Linker (`linker`)** tool or `strapi://api::collection.collection/documentId` URI is automatically grouped by collection and synced to `<FieldName>Links`.

---

## Available Extensions (48 Feature Keys)

### Inline Formatting & Semantic Marks

| Key               | Description                                                   | Toolbar / Shortcut         |
| ----------------- | ------------------------------------------------------------- | -------------------------- |
| `bold`            | Bold text (`<strong>`)                                        | **B** (`Ctrl/Cmd + B`)     |
| `italic`          | Italic text (`<em>`)                                          | _I_ (`Ctrl/Cmd + I`)       |
| `underline`       | Underlined text (`<u>`)                                       | **U** (`Ctrl/Cmd + U`)     |
| `strike`          | Strikethrough text (`<s>`)                                    | ~~S~~ (`Ctrl/Cmd+Shift+S`) |
| `code`            | Inline code (`<code>`)                                        | `<>` (`Ctrl/Cmd + E`)      |
| `superscript`     | Superscript (`<sup>`)                                         | `x²` (`Ctrl/Cmd + .`)      |
| `subscript`       | Subscript (`<sub>`)                                           | `x₂` (`Ctrl/Cmd + ,`)      |
| `clearFormatting` | Strip all inline marks and reset block to paragraph           | Clear Formatting button    |
| `leadParagraph`   | Lead / intro paragraph (`<p class="lead-paragraph" data-lead="true">`) | `Lead` toggle button       |
| `abbr`            | Semantic abbreviation (`<abbr title="...">`) with modal       | `Abbr` button + dialog     |
| `language`        | WCAG 3.1.2 language & direction (`<span lang=".." dir="..">`) | `Lang` button + dialog     |

### Typography Controls

| Key          | Description                                                         | Toolbar                   |
| ------------ | ------------------------------------------------------------------- | ------------------------- |
| `fontFamily` | Font family selector (customizable via `{ families: [...] }`)       | Font Family dropdown      |
| `fontSize`   | Font size selector (`12px`–`40px`, customizable via `{ sizes }`)    | Font Size dropdown        |
| `lineHeight` | Line height selector (`1.0`–`2.0`, customizable via `{ heights }`)  | Line Height dropdown      |
| `typography` | Smart typography input rules (`--` → `—`, `...` → `…`, `(c)` → `©`) | Automatic while typing    |

### Block Elements & Structured Layouts

| Key                   | Description                                                      | Toolbar                      |
| --------------------- | ---------------------------------------------------------------- | ---------------------------- |
| `blockquote`          | Blockquote (`<blockquote>`)                                      | Quote button                 |
| `codeBlock`           | Fenced code block (`<pre><code>`)                                | Via `/` command or markdown  |
| `bulletList`          | Unordered bullet list (`<ul>`)                                   | Bullet list button           |
| `orderedList`         | Ordered numbered list (`<ol>`)                                   | Numbered list button         |
| `taskList`            | Interactive checklist (`<ul data-type="taskList">`)              | `☑` Task list button         |
| `hardBreak`           | Line break (`<br>`)                                              | `Shift + Enter`              |
| `horizontalRule`      | Horizontal divider (`<hr>`)                                      | Via `/` command or `---`     |
| `history`             | Undo / Redo history stack                                        | `Ctrl/Cmd + Z` / `Shift + Z` |
| `informationPane`     | Edifice IO callout box (`info`, `success`, `warning`, `danger`)  | Info Pane button + variant   |
| `accordion`           | Collapsible `<details>` / `<summary>` block                      | `▸` Accordion button         |
| `columns`             | Responsive 2-column or 3-column CSS Grid layout                  | `⫿` Columns button           |
| `conversationHistory` | Timestamped discussion / editorial log block                     | `💬` Conversation button     |
| `pageBreak`           | Print / pagination break (`<div data-type="page-break">`)        | `―` Page Break button        |
| `tableOfContents`     | Dynamic Table of Contents block generated from document headings | `TOC` button                 |

### Headings (with SEO Tag & Auto Anchor ID)

| Key       | Description                                                                 | Toolbar                           |
| --------- | --------------------------------------------------------------------------- | --------------------------------- |
| `heading` | Visual heading levels (`h1`–`h6`), independent SEO tag, and slug `id` attrs | Style dropdown + SEO tag dropdown |

### Links & Internal Strapi Content Linker

| Key      | Description                                                                   | Toolbar                      |
| -------- | ----------------------------------------------------------------------------- | ---------------------------- |
| `link`   | External/internal hyperlinks with protocol validation (`https:`, `mailto:`)   | Link button + dialog         |
| `linker` | Edifice IO / Hashbite internal Strapi Document Linker chip & live search modal | `🔗 Strapi` button + dialog  |

### Tables (with Cell Background Color & Merge/Split)

| Key     | Description                                                                                 | Toolbar                                                       |
| ------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `table` | Resizable tables with row/column controls, cell background color picker, and cell merge/split | Table + Add/Remove Row/Col + Cell Color + Merge/Split buttons |

### Text Alignment & Colors

| Key              | Description                                           | Toolbar                              |
| ---------------- | ----------------------------------------------------- | ------------------------------------ |
| `textAlign`      | Align paragraphs and headings (`left`, `center`, `right`, `justify`) | 4 alignment buttons   |
| `textColor`      | Text color picker populated from `theme.colors`       | Font color popover                   |
| `highlightColor` | Multicolor highlight picker from `theme.colors`       | Highlight color popover              |

### Edifice IO Multimedia Suite

#### Images & In-Editor HTML5 Canvas Image Studio (`mediaLibrary`)

- Pick images from the Strapi Media Library with prefilled `alt`, `data-asset-id`, and `data-document-id`.
- Click any image in the editor to open the floating toolbar with:
  - **Alignment** (`left`, `center`, `right`)
  - **Width & Height** pixel inputs + aspect-ratio lock + **Reset**
  - **Alt Text** & **Figure Caption (`<figcaption>`)** inputs
  - **Edit Image (`ImageEditorModal`)**: In-editor HTML5 Canvas studio supporting **Aspect-Ratio Crop** (`Free`, `16:9`, `4:3`, `1:1`), **90° Rotation** (`-90°` / `+90°`), **Horizontal/Vertical Flip**, and **Zoom** (`1x`–`3x`), automatically uploading the edited asset back to `/upload`.

#### Video (`video`)

- Insert videos from the **Strapi Media Library** (`<video controls>`) or embed external **YouTube**, **Vimeo**, or direct **MP4/WebM** URLs.
- Supports alignment, custom dimensions, captions, and read-only zero-data-loss rendering.

#### Audio (`audio`)

- Insert audio files from the **Strapi Media Library** or record voice notes directly in the browser using the **Web `MediaRecorder` API** with a live `mm:ss` timer and automatic upload to Strapi Media Library.

#### Attachment Cards (`attachment`)

- Insert downloadable file cards from the Strapi Media Library displaying filename, extension badge, MIME type, and human-readable file size (`KB` / `MB`).

#### Sandboxed HTTPS Iframes (`iframe`)

- Embed external interactive widgets over `https:` with strict `sandbox="allow-scripts allow-popups"`, `loading="lazy"`, and optional domain allowlisting (`allowedDomains`).

### Mathematics, Emoji, Slash Commands & Speech Tools

| Key             | Description                                                                 | Toolbar / Trigger              |
| --------------- | --------------------------------------------------------------------------- | ------------------------------ |
| `mathematics`   | Inline or block LaTeX math expressions (`E = mc^2`) with live preview modal | `∑` button or click            |
| `emoji`         | Searchable Emoji Picker popover + `:shortcode:` input rules (`:rocket:` → 🚀) | 😊 button or `:shortcode:`   |
| `slashCommands` | Quick-insert command palette for headings, lists, callouts, TOC             | `+` toolbar button             |
| `speechToText`  | Web Speech API (`SpeechRecognition`) live voice dictation into the editor   | 🎙️ Dictate toggle button      |
| `textToSpeech`  | Web Speech API (`speechSynthesis`) read-aloud of selection or document      | 🔊 Read Aloud toggle button    |

### Editor Modes & Footer

| Key              | Description                                                                                  | Toolbar / Footer                        |
| ---------------- | -------------------------------------------------------------------------------------------- | --------------------------------------- |
| `characterCount` | Live word count, character counter, and estimated reading time (`~X min read`) with progress bar and warning/danger states (`{ limit: 500, wordsPerMinute: 200 }`) | Bottom status bar                       |
| `fullscreen`     | Toggle Fullscreen (`Escape` exits), Edifice Read-Only Preview, and JSON/HTML/Markdown Source Inspector | Preview, `{}` Source, and Fullscreen buttons |

---

## Accessibility (WCAG 2.1 AA) & Security

- **WCAG 2.1 AA Toolbar Navigation (`useKeyboardNavigation`)**:
  - Toolbar container exposes `role="toolbar"` and `aria-label`.
  - Every toolbar button exposes `aria-label`. Toggle buttons (for example bold, text alignment, fullscreen) also expose `aria-pressed`.
  - **Roving Keyboard Navigation**: `ArrowRight` / `ArrowLeft` cycle through enabled toolbar controls, `Home` / `End` jump to the first/last control, and `Escape` returns focus to the Tiptap editing canvas.
  - **Screen Reader Announcements**: Speech tools and status indicators use `aria-live="polite"`.
  - **Language of Parts (WCAG 3.1.2)**: The `language` mark wraps foreign phrases in `<span lang="..." dir="ltr|rtl">`.
- **Defense-in-Depth Security**:
  - **URL & Protocol Sanitization**: Blocks `javascript:`, `vbscript:`, protocol-relative (`//`, `/\`), and `data:text/html` across links, images, videos, audios, and attachments.
  - **DNS-Aware SSRF Protection (`isSsrfSafeUrl` & `assertSafeResolvedHost`)**: Backend `/link-preview` and `/upload-by-url` routes validate both literal hostnames and DNS-resolved IPv4/IPv6 addresses (`dns.promises.lookup(..., { all: true })`), failing closed on DNS lookup errors and pinning the validated DNS records to an undici `Agent` fetch dispatcher to prevent DNS rebinding. Blocks `localhost`, `0.0.0.0/8`, `127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `100.64.0.0/10` (CGNAT & cloud metadata `100.100.100.200`), `169.254.0.0/16`, IPv6 loopback/unique-local/link-local (`fe80::/10`)/IPv4-mapped ranges, `.local`/`.internal` hosts, URL credentials, automatic redirects (`redirect: 'manual'`), and unbounded response streams (capped at 64 KB for link previews and 25 MB for remote media uploads persisted via Strapi's Upload service).

---

## Theme

### Colors

Define `theme.colors` in `config/plugins.ts` to populate the text color and highlight color pickers:

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
    },
  },
});
```

### Custom Stylesheet

Inject custom CSS into the editor content area via `theme.css` (inline CSS string) or `theme.stylesheet` (external URL):

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

---

## Configuration Reference

### Feature Values

| Value           | Meaning                                                    |
| --------------- | ---------------------------------------------------------- |
| `true`          | Feature enabled with default options                       |
| `false`         | Feature explicitly disabled                                |
| _(key omitted)_ | Feature disabled (absent keys are treated as disabled)     |
| `{ ... }`       | Feature enabled with custom options (merged with defaults) |

### Full 48-Feature Preset Example

```ts
// config/plugins.ts
export default () => ({
  'tiptap-editor': {
    config: {
      presets: {
        edifice: {
          // Core inline & blocks
          bold: true,
          italic: true,
          strike: true,
          underline: true,
          code: true,
          codeBlock: true,
          blockquote: true,
          bulletList: true,
          orderedList: true,
          hardBreak: true,
          horizontalRule: true,
          history: true,
          heading: { levels: [1, 2, 3, 4, 5, 6] },
          link: { openOnClick: false },
          table: { resizable: true },
          textAlign: { types: ['heading', 'paragraph'] },
          superscript: true,
          subscript: true,
          textColor: true,
          highlightColor: true,

          // Typography & semantic marks
          fontFamily: true,
          fontSize: true,
          lineHeight: true,
          clearFormatting: true,
          typography: true,
          leadParagraph: true,
          language: true,
          abbr: true,

          // Edifice IO multimedia & internal linker
          mediaLibrary: { resize: { enabled: true } },
          video: true,
          audio: true,
          attachment: true,
          iframe: { allowedDomains: ['youtube.com', 'youtube-nocookie.com', 'player.vimeo.com'] },
          linker: true,

          // Structured blocks & interactive tools
          informationPane: true,
          accordion: true,
          conversationHistory: true,
          columns: true,
          taskList: true,
          mathematics: true,
          emoji: true,
          slashCommands: true,
          pageBreak: true,
          tableOfContents: true,

          // Speech & editor modes
          speechToText: true,
          textToSpeech: true,
          characterCount: { limit: 25000 },
          fullscreen: true,
        },
      },
    },
  },
});
```

### Backend API Routes

All admin routes are mounted under `/tiptap-editor`:

| Method | Path                                              | Description                                                |
| ------ | ------------------------------------------------- | ---------------------------------------------------------- |
| `GET`  | `/tiptap-editor/presets`                          | List all available preset names (built-in + custom)        |
| `GET`  | `/tiptap-editor/presets/:preset`                  | Get resolved feature configuration for a preset            |
| `GET`  | `/tiptap-editor/theme`                            | Get theme colors and custom CSS/stylesheet                 |
| `GET`  | `/tiptap-editor/settings`                         | Get runtime settings from Strapi `core-store`              |
| `PUT`  | `/tiptap-editor/settings`                         | Update runtime settings and preset overrides               |
| `GET`  | `/tiptap-editor/search?q=<query>&locale=<locale>` | Search linkable Strapi collection documents                |
| `GET`  | `/tiptap-editor/get/:collectionName/:documentId`  | Resolve a single Strapi document's label and publish state |
| `GET`  | `/tiptap-editor/identify/:collectionName`         | Identify the human-readable title field for a collection   |
| `GET`  | `/tiptap-editor/link-preview?url=<https_url>`     | DNS-aware SSRF-safe OpenGraph metadata preview (manual redirect, 64 KB stream cap) |
| `POST` | `/tiptap-editor/upload-by-url`                    | DNS-aware SSRF-safe remote media URL validation and Upload plugin record registration |

### Config Validation

The plugin validates `config/plugins.ts` at startup and validates runtime updates in `/tiptap-editor/settings`. Any unknown feature key throws a descriptive error listing all 48 valid keys.

---

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

Browse the [open issues](https://github.com/notum-cz/strapi-plugin-tiptap-editor/issues) to find something to work on, or open a new one to start a discussion. Pull requests are always appreciated!
