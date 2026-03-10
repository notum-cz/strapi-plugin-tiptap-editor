# Technology Stack

**Analysis Date:** 2026-03-10

## Languages

**Primary:**
- TypeScript 5.9.3 - Used for both admin and server-side code
- JavaScript (CommonJS) - Package type is `commonjs`

**Secondary:**
- React/JSX - Admin panel UI components
- JSON - Configuration and translation files

## Runtime

**Environment:**
- Node.js (version not pinned in package.json)

**Package Manager:**
- Yarn - Primary package manager
- Lockfile: `yarn.lock` (present, 544KB)

## Frameworks

**Core:**
- Strapi 5.35.0 - Headless CMS framework (devDependency)
- @strapi/strapi 5.35.0 - Core Strapi framework
- @strapi/sdk-plugin 5.4.0 - Plugin SDK for Strapi

**Editor:**
- @tiptap/react 3.19.0 - React wrapper for Tiptap editor
- @tiptap/core 3.19.0 - Core Tiptap editor engine (via @tiptap/pm 3.19.0)
- @tiptap/starter-kit 3.19.0 - Pre-configured editor extensions (bold, italic, links, lists, code blocks, etc.)

**UI & Styling:**
- React 18.3.1 - UI framework (peerDependency and devDependency)
- React DOM 18.3.1 - React DOM rendering
- React Router DOM 6.30.3 - Routing for admin panel
- styled-components 6.3.9 - CSS-in-JS styling
- @strapi/design-system ^2.0.0-rc.30 - Strapi design system components
- @strapi/icons ^2.0.0-rc.30 - Icon components

**Internationalization:**
- react-intl 8.1.3 - i18n library for translations

**Testing:**
- TypeScript compiler - Type checking via `tsc` CLI commands
- No test runner configured (see TESTING.md)

**Build/Dev:**
- @strapi/sdk-plugin 5.4.0 - Provides build tools (`strapi-plugin` CLI)
- @strapi/typescript-utils 5.35.0 - TypeScript configuration utilities
- Prettier 3.8.1 - Code formatter

## Editor Extensions

**Tiptap Extensions (v3.19.0):**
- @tiptap/extension-subscript - Subscript formatting
- @tiptap/extension-superscript - Superscript formatting
- @tiptap/extension-table - Table support with resizable columns
- @tiptap/extension-text-align - Text alignment (left, center, right, justify)
- @tiptap/extensions (via StarterKit) - Gapcursor for table resizing

**Custom Extensions:**
- HeadingWithSEOTag (custom extension) - Enhanced heading with SEO tag attribute
- Various UI hooks for editor features: `useStarterKit`, `useHeading`, `useLink`, `useScript`, `useTable`, `useTextAlign`

## Key Dependencies

**Critical:**
- @tiptap/starter-kit 3.19.0 - Provides core formatting: bold, italic, underline, strike, code, bullet lists, ordered lists, blockquotes, code blocks
- @strapi/strapi 5.35.0 - Host CMS framework
- @strapi/design-system 2.0.0-rc.30 - UI components matching Strapi admin design

**Infrastructure:**
- @strapi/types (via @strapi/strapi) - TypeScript type definitions
- React 18.3.1 - UI library

## Configuration Files

**Build Configuration:**
- `admin/tsconfig.json` - Extends @strapi/typescript-utils admin config
- `admin/tsconfig.build.json` - Build output configuration, excludes tests
- `server/tsconfig.json` - Extends @strapi/typescript-utils server config
- `server/tsconfig.build.json` - Build output configuration, excludes tests

**Code Style:**
- `.prettierrc` - Prettier formatting (2-space indent, 100-char line length, single quotes, trailing commas)
- `.editorconfig` - Editor configuration (2-space indent, LF line endings, UTF-8)

**Package Configuration:**
- `package.json` - Monolithic plugin package with both admin and server exports

## Build Commands

```bash
yarn build              # Build both admin and server using strapi-plugin
yarn watch              # Watch for changes during development
yarn watch:link         # Link plugin to local Strapi installation
yarn verify             # Verify plugin integrity
yarn test:ts:front      # Type check admin code
yarn test:ts:back       # Type check server code
```

## Export Points

**Admin (Client-side):**
- Path: `./dist/admin/index.js` (CommonJS), `./dist/admin/index.mjs` (ESM)
- Source: `admin/src/index.ts`
- Exports: Plugin registration, field definition, translations

**Server:**
- Path: `./dist/server/index.js` (CommonJS), `./dist/server/index.mjs` (ESM)
- Source: `server/src/index.ts`
- Exports: Bootstrap, destroy, register, config, content-types, controllers, middlewares, policies, routes, services

## Plugin Metadata

**Package Info:**
- Name: @notum-cz/strapi-plugin-tiptap-editor
- Version: 1.0.1
- Type: CommonJS
- License: MIT
- Author: Notum Technologies s.r.o.

**Strapi Plugin Configuration:**
- Kind: plugin
- Display Name: Tiptap Editor
- Description: Customizable Tip Tap Editor

## Platform Requirements

**Development:**
- Node.js (version not specified, recommend LTS)
- Yarn package manager
- TypeScript 5.9.3
- Strapi 5.35.0 (for development testing)

**Production:**
- Strapi 5.35.0+ (peer dependency)
- React 18.3.1+ (peer dependency)
- Styled Components 6.3.9+ (peer dependency)
- No external database or service integrations required
- No environment variables required

---

*Stack analysis: 2026-03-10*
