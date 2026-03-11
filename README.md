<div align="center">
  <picture>
    <img src="https://raw.githubusercontent.com/notum-cz/strapi-plugin-tiptap-editor/main/assets/notum-tiptap-icon.png" height="250" alt="Notum Tiptap Plugin Logo"/>
  </picture>

  <h1>TipTap Editor Plugin for Strapi V5</h1>
  <p>by<br />
  <a href="https://notum.tech">
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
  - [Roadmap](#roadmap)
  - [Community](#-community)
    - [Current maintainer](#current-maintainer)
    - [Contributors](#contributors)
    - [Contributing](#contributing)

<!-- About the Project -->

## About the Project

> [!IMPORTANT]
> This is an **initial release** of the plugin and it doesn't support all features, nor does it support **extensive configuration**. The first thing we will be adding is the ability to configure which features of TipTap you want to use in your Strapi instance.
>
> If you have any suggestions or feature requests, please don't hesitate to open an issue or submit a pull request.

<!-- Features -->

### Features

- **Rich text editing** powered by [TipTap](https://tiptap.dev/) - a modern, extensible WYSIWYG editor built on ProseMirror
- **Headings** (H1–H6), **bold**, **italic**, **underline**, **strikethrough**
- **Ordered & unordered lists**, task lists
- **Links**, **images**, **tables**
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
|----------------|----------------|--------------|
| 1.0.0          | 5.34.0         |      ✅      |

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

<!-- Roadmap -->

## Roadmap

We're open to feedback and feature requests. Our current roadmap includes:

- [ ] Q2 2026: Add support for configuring which TipTap features to use in Strapi.

<!-- Contributing -->

## 🤝 Community

### Maintained by [Notum Technologies](https://notum.tech)

Built and maintained by [Notum Technologies](https://notum.tech), a Czech-based Strapi Enterprise Partner with a passion for open-source tooling.

This plugin was originally developed by [Ivo Pisařovic](https://github.com/ivopisarovic) and [Dominik Juriga](https://github.com/dominik-juriga).

#### Current maintainer

[Dominik Juriga](https://github.com/dominik-juriga)

#### Contributors

<a href="https://github.com/notum-cz/strapi-plugin-tiptap-editor/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=notum-cz/strapi-plugin-tiptap-editor" alt="Contributors" />
</a>

### Need help with your Strapi project?

[Notum Technologies](https://notum.tech) builds custom Strapi solutions for enterprise teams. If you'd like to work with us, [book a call](https://calendly.com/notum) or drop us a line at [sales@notum.cz](mailto:sales@notum.cz).

### Contributing

Contributions of all kinds are welcome: code, documentation, bug reports, and feature ideas.
<br> <br> Browse the [open issues](https://github.com/notum-cz/strapi-plugin-tiptap-editor/issues) to find something to work on, or open a new one to start a discussion. Pull requests are always appreciated!

If you'd like to directly contribute, check our [Contributions document](https://github.com/notum-cz/strapi-plugin-tiptap-editor?tab=contributing-ov-file).
