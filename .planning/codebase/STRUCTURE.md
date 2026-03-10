# Directory Structure

**Analysis Date:** 2026-03-10

## Overview

Strapi plugin with three top-level layers: `admin/`, `server/`, and `shared/`. Follows the Strapi SDK plugin convention with dual export points (admin and server).

## Directory Layout

```
strapi-plugin-tiptap-editor/
├── admin/                          # Admin panel (client-side) code
│   ├── src/
│   │   ├── index.ts                # Plugin registration entry point
│   │   ├── components/             # React components
│   │   │   ├── RichTextInput.tsx   # Top-level field wrapper (Strapi integration)
│   │   │   ├── TiptapInput.tsx     # Main editor component (toolbar + editor)
│   │   │   ├── BaseTiptapInput.tsx # Core editor initialization
│   │   │   ├── LinkDialog.tsx      # Link insertion/editing dialog
│   │   │   ├── TableSizeDialog.tsx # Table creation dialog
│   │   │   ├── TiptapInputStyles.ts# Styled components for editor
│   │   │   ├── ToolbarButton.tsx   # Reusable toolbar button component
│   │   │   ├── Spacer.tsx          # Toolbar spacer
│   │   │   └── Initializer.tsx     # Plugin initializer component
│   │   ├── extensions/             # Tiptap extension wrappers (hooks + config)
│   │   │   ├── StarterKit.tsx      # useStarterKit hook
│   │   │   ├── Heading.tsx         # useHeading hook + HeadingWithSEOTag extension
│   │   │   ├── Link.tsx            # useLink hook with dialog integration
│   │   │   ├── Table.tsx           # useTable hook with dialog integration
│   │   │   ├── TextAlign.tsx       # useTextAlign hook
│   │   │   └── Script.tsx          # useScript hook (sub/superscript)
│   │   ├── fields/
│   │   │   └── richTextField.ts    # Strapi field type registration
│   │   ├── hooks/
│   │   │   └── usePresetConfig.ts  # Hook for loading preset configuration
│   │   ├── icons/                  # Custom SVG icon components
│   │   │   ├── TextAlignLeft.tsx
│   │   │   ├── TextAlignCenter.tsx
│   │   │   ├── TextAlignRight.tsx
│   │   │   └── TextAlignJustify.tsx
│   │   ├── translations/
│   │   │   └── en.json             # English translation strings
│   │   └── utils/
│   │       ├── getTranslation.ts   # Translation helper
│   │       └── tiptapUtils.tsx     # Editor utilities and toolbar helpers
│   ├── tsconfig.json               # TypeScript config (extends @strapi/typescript-utils)
│   └── tsconfig.build.json         # Build config (excludes tests)
│
├── server/                         # Strapi server-side code
│   ├── src/
│   │   ├── index.ts                # Server plugin entry (bootstrap, register, etc.)
│   │   ├── bootstrap.ts            # Plugin bootstrap lifecycle
│   │   ├── register.ts             # Plugin registration lifecycle
│   │   ├── destroy.ts              # Plugin destroy lifecycle
│   │   ├── config/
│   │   │   └── index.ts            # Plugin configuration schema
│   │   ├── fields/
│   │   │   └── richTextField.ts    # Server-side field registration
│   │   ├── content-types/
│   │   │   └── index.ts            # Content type definitions (empty)
│   │   ├── controllers/
│   │   │   └── index.ts            # Route controllers (empty)
│   │   ├── middlewares/
│   │   │   └── index.ts            # Middlewares (empty)
│   │   ├── policies/
│   │   │   └── index.ts            # Policies (empty)
│   │   ├── routes/
│   │   │   └── index.ts            # Route definitions (empty)
│   │   └── services/
│   │       └── index.ts            # Services (empty)
│   ├── tsconfig.json
│   └── tsconfig.build.json
│
├── shared/                         # Shared code between admin and server
│   ├── pluginId.ts                 # Plugin identifier constant
│   └── fields.ts                   # Shared field type definitions
│
├── dist/                           # Build output (gitignored)
│   ├── admin/                      # Compiled admin code (CJS + ESM)
│   ├── server/                     # Compiled server code
│   └── _chunks/                    # Code-split chunks
│
├── package.json                    # Plugin package manifest
├── yarn.lock                       # Dependency lockfile
└── LICENSE                         # MIT license
```

## Key Locations

| What | Where |
|------|-------|
| Plugin entry (admin) | `admin/src/index.ts` |
| Plugin entry (server) | `server/src/index.ts` |
| Main editor component | `admin/src/components/TiptapInput.tsx` |
| Field registration | `admin/src/fields/richTextField.ts` |
| Extension hooks | `admin/src/extensions/` |
| Plugin config schema | `server/src/config/index.ts` |
| Shared constants | `shared/pluginId.ts`, `shared/fields.ts` |
| Translations | `admin/src/translations/en.json` |

## Naming Conventions

- **Components**: PascalCase files (`TiptapInput.tsx`, `LinkDialog.tsx`)
- **Hooks**: camelCase files starting with `use` (`usePresetConfig.ts`)
- **Extensions**: PascalCase files matching extension name (`Link.tsx`, `Table.tsx`)
- **Utilities**: camelCase files (`getTranslation.ts`, `tiptapUtils.tsx`)
- **Server modules**: camelCase files matching lifecycle (`bootstrap.ts`, `register.ts`)

## Build Artifacts

The `dist/` directory contains:
- CJS bundles (`.js`) for Node.js compatibility
- ESM bundles (`.mjs`) for modern bundlers
- TypeScript declarations (`.d.ts`) for type safety
- Source maps (`.map`) for debugging

---

*Structure analysis: 2026-03-10*
