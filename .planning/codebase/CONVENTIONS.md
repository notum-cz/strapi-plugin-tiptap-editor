# Code Conventions

**Analysis Date:** 2026-03-10

## Code Style

**Formatter:** Prettier 3.8.1
- Line width: 100 characters
- Indent: 2 spaces
- Quotes: single
- Trailing commas: ES5
- Config: `.prettierrc`

**Editor:** EditorConfig
- Indent: 2 spaces
- Line endings: LF
- Encoding: UTF-8
- Config: `.editorconfig`

## Naming Patterns

**Files:**
- React components: `PascalCase.tsx` (`RichTextInput.tsx`, `LinkDialog.tsx`)
- Hooks: `camelCase.ts` starting with `use` (`usePresetConfig.ts`)
- Extensions: `PascalCase.tsx` matching Tiptap extension name (`Link.tsx`, `Table.tsx`)
- Utilities: `camelCase.ts` (`getTranslation.ts`, `tiptapUtils.tsx`)
- Server lifecycle files: `camelCase.ts` (`bootstrap.ts`, `register.ts`)

**Identifiers:**
- React components: PascalCase
- Functions/variables/hooks: camelCase
- Constants: UPPER_SNAKE_CASE
- Types/interfaces: PascalCase

## Import Organization

Order (no enforced tooling, but consistent in codebase):
1. External framework imports (`react`, `@tiptap/*`, `@strapi/*`)
2. Design system imports (`@strapi/design-system`, `@strapi/icons`)
3. Feature-level imports (local components, extensions)
4. Local utilities and helpers
5. Type imports

## React Patterns

**Component Style:**
- Functional components only (no class components)
- `forwardRef` used where editor refs need to be exposed
- Props typed inline or with separate interface

**Hooks:**
- Extension logic encapsulated as custom hooks (`useLink`, `useTable`, `useHeading`, etc.)
- Hooks return objects with multiple properties: `{ toolbar, editor, ... }`
- `useEditorState` from `@tiptap/react` for reactive editor state queries

**Strapi Integration:**
- `useField` from `@strapi/strapi/admin` for field value management
- `useIntl` from `react-intl` for translations
- Plugin registered via `register()` in `admin/src/index.ts`

## Strapi Plugin Conventions

- Admin plugin exports `register`, `bootstrap`, `config`, `basenamePlugin` from `admin/src/index.ts`
- Server plugin exports all lifecycle hooks from `server/src/index.ts`
- Field types registered in both `admin/src/fields/` and `server/src/fields/`
- Shared constants in `shared/` directory

## Extension Pattern

Each Tiptap extension follows a consistent hook pattern in `admin/src/extensions/`:

```tsx
// Typical extension hook structure
export function useLink(editor: Editor | null, options: Options) {
  // Local state for dialog
  const [isDialogOpen, setDialogOpen] = useState(false);

  // Extension configuration
  const extension = Link.configure({ ... });

  // Toolbar button definition
  const toolbar = {
    label: 'Link',
    icon: <LinkIcon />,
    onClick: () => setDialogOpen(true),
    active: editor?.isActive('link'),
  };

  return { extension, toolbar, dialog: ... };
}
```

## Error Handling

- JSON parsing wrapped in try-catch with fallback values
- Early exit pattern: null/undefined checks at top of function
- `console.error` only (no `console.log` in production code)
- No error boundaries currently implemented

## Comments

- Minimal comments; code is expected to be self-documenting
- Comments used for complex logic only (not JSDoc or inline explanations)
- No JSDoc/TSDoc annotations

## TypeScript Usage

- Explicit return types on exported functions
- `any` used in some places (known technical debt)
- Generic types used for editor extension configuration
- Shared types via `@strapi/types` (through `@strapi/strapi`)

---

*Conventions analysis: 2026-03-10*
