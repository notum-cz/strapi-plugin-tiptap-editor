# Architecture

**Analysis Date:** 2026-03-10

## Pattern Overview

**Overall:** Plugin-based extensible architecture following Strapi's custom field pattern. The plugin provides a rich text editor field type for Strapi using Tiptap as the editing engine.

**Key Characteristics:**
- Dual-layer design: separate admin (UI) and server (backend) implementations
- Extension-based toolbar building through composable hooks
- Field registration pattern for custom field type integration
- Shared constants and configuration between layers via `shared/` directory

## Layers

**Admin Layer (Frontend):**
- Purpose: Provides the UI editor component and toolbar with formatting controls
- Location: `admin/src/`
- Contains: React components, extension hooks, field definition, translation files, utilities
- Depends on: @tiptap/react, @strapi/design-system, React, styled-components
- Used by: Strapi admin panel for rendering custom field inputs

**Server Layer (Backend):**
- Purpose: Registers custom field type with Strapi backend and handles initialization
- Location: `server/src/`
- Contains: Field registration, bootstrap/destroy hooks, configuration, controllers, services, routes (all empty stubs)
- Depends on: @strapi/strapi, @strapi/types
- Used by: Strapi core during plugin lifecycle

**Shared Layer:**
- Purpose: Constants and configuration accessible to both layers
- Location: `shared/`
- Contains: `pluginId.ts` (PLUGIN_ID = 'tiptap-editor'), `fields.ts` (RICH_TEXT_FIELD_NAME = 'RichText')
- Used by: Both admin and server layers for field registration and plugin identification

## Data Flow

**Field Registration Flow:**

1. Server registers custom field via `server/src/register.ts` → calls `strapi.customFields.register(richTextField)`
2. Admin layer imports field definition from `admin/src/fields/richTextField.ts` and registers via `app.customFields.register(richTextField)`
3. Field definition references `RichTextInput` component as the Input component for rendering
4. Strapi admin renders `RichTextInput` when field type is selected in content model

**Editor State Management:**

1. `useTiptapEditor()` hook in `admin/src/utils/tiptapUtils.tsx` initializes Tiptap editor with extensions
2. `useField()` from Strapi binds form field to component
3. Editor content updates trigger `onUpdate` callback
4. Content converted to JSON and stored via `field.onChange(name, JSON.stringify(json))`
5. On load, JSON is parsed back from string and set as editor content

**Extension State Management:**

- Individual extension hooks (e.g., `useStarterKit`, `useLink`, `useHeading`) use `useEditorState` to track editor capabilities
- Hooks return toolbar button components and dialog components
- Parent component (`RichTextInput.tsx`) composes these buttons into toolbar

**State Storage:**
- Editor content stored as JSON string in Strapi database
- Field value marshaled between JSON object (in-memory) and JSON string (storage)

## Key Abstractions

**Field Registration:**
- Purpose: Represents the custom field type definition for Strapi
- Examples: `admin/src/fields/richTextField.ts`, `server/src/fields/richTextField.ts`
- Pattern: Export `richTextField` constant with name, pluginId, type, icon, and UI component reference

**Extension Hooks:**
- Purpose: Encapsulate toolbar control logic for specific text formatting features
- Examples: `useStarterKit()`, `useLink()`, `useHeading()`, `useTable()`, `useTextAlign()`, `useScript()`
- Pattern: Takes `Editor` instance and options, returns button JSX and optional dialog JSX components
- Implementation details:
  - Use `useEditorState()` to subscribe to editor state changes
  - Track button active state (e.g., `isActive('bold')`)
  - Return memoized button components with click handlers that call editor commands

**Editor Container:**
- Purpose: Base container for editor with toolbar and content area styling
- Examples: `BaseTiptapInput.tsx`, `TiptapInput.tsx`
- Pattern: React forwardRef component wrapping `EditorContent` from @tiptap/react with Strapi Form Field components

**Dialog Components:**
- Purpose: Modal dialogs for complex interactions (link insertion, table sizing)
- Examples: `LinkDialog.tsx`, `TableSizeDialog.tsx`
- Pattern: Controlled components with open/close state, callbacks for save/cancel/delete operations

## Entry Points

**Admin Plugin Entry:**
- Location: `admin/src/index.ts`
- Triggers: Strapi admin plugin registration during app initialization
- Responsibilities:
  - Registers plugin with Strapi using `PLUGIN_ID`
  - Registers `RichTextInput` field via `app.customFields.register(richTextField)`
  - Loads and registers translations for configured locales

**Server Plugin Entry:**
- Location: `server/src/index.ts`
- Triggers: Strapi server startup
- Responsibilities: Exports plugin hooks (register, bootstrap, destroy) and plugin modules (config, controllers, routes, services)

**Plugin Initializer:**
- Location: `admin/src/components/Initializer.tsx`
- Triggers: Called by Strapi during admin initialization
- Responsibilities: Signals to Strapi that plugin is ready via `setPlugin(PLUGIN_ID)`

## Error Handling

**Strategy:** Graceful degradation with error messages and console logging

**Patterns:**
- JSON parsing errors in content display malformed data with message: "This component's content is malformed. Please change it or remove this component."
- Import errors caught in translation loading with fallback to empty object
- Missing editor state selectors default to false/null (e.g., `ctx.editor.isActive('bold') ?? false`)
- Dialog state managed independently with open/close toggles; errors logged to console

## Cross-Cutting Concerns

**Logging:** Uses standard `console.error()` for parsing failures and validation errors

**Validation:**
- Tiptap handles content validation via extension schemas
- Strapi form field validation integrates with field error state
- Editor buttons validate state before executing commands (e.g., `can().chain().toggleBold().run()`)

**Authentication:** Inherited from Strapi admin authentication; plugin has no explicit auth layer

**UI Framework:** Uses Strapi design system components (`@strapi/design-system`) for consistency with admin panel

---

*Architecture analysis: 2026-03-10*
