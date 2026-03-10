# Roadmap: Strapi Plugin Tiptap Editor — Preset Configuration System

## Overview

This milestone adds a preset configuration system to an existing Strapi 5 + Tiptap 3 custom field plugin. Developers define named presets (extension configs) in `config/plugins.ts`; content managers select a preset when adding a TipTap field in Content-Type Builder; the editor initializes with only the extensions defined in that preset and the toolbar auto-detects which buttons to show. Three phases deliver this in dependency order: server-side type contracts and API routes first, admin utility layer and hook refactors second, editor wiring and Content-Type Builder integration last.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Server Foundation** - Shared types, feature-toggle utilities, server config validator, and preset API routes (completed 2026-03-10)
- [x] **Phase 2: Admin Foundation** - Extension builder, preset-fetch hook, and extension hook refactors to accept config (completed 2026-03-10)
- [ ] **Phase 3: Editor Integration** - Preset-aware RichTextInput and Content-Type Builder preset dropdown

## Phase Details

### Phase 1: Server Foundation
**Goal**: Developer-defined presets are validated at Strapi boot, served over authenticated admin routes, and fully typed so all downstream code has compile-time contracts
**Depends on**: Nothing (first phase)
**Requirements**: TYPES-01, TYPES-02, TYPES-03, TYPES-04, TYPES-05, SERVER-01, SERVER-02, SERVER-03, SERVER-04
**Success Criteria** (what must be TRUE):
  1. A host app with an invalid preset feature key in `config/plugins.ts` causes Strapi boot to emit a human-readable error naming the invalid key and the allowed set
  2. `GET /tiptap-editor/presets` returns an array of preset names defined in `config/plugins.ts` without requiring authentication
  3. `GET /tiptap-editor/presets/:name` returns the full `TiptapPresetConfig` object for a named preset; requesting an unknown name returns `MINIMAL_PRESET_CONFIG` rather than a 404
  4. A host app TypeScript file can import `TiptapPresetConfig`, `TiptapPluginConfig`, and `PRESET_FEATURE_KEYS` from the plugin and get compile-time validation on preset values
  5. `isFeatureEnabled(undefined)` returns `true` and `getFeatureOptions(true, defaults)` returns the defaults object (absent-key behavior confirmed correct)
**Plans**: 2 plans

Plans:
- [ ] 01-01-PLAN.md — Shared types, utilities, constants, and Vitest test scaffold
- [ ] 01-02-PLAN.md — Server config validator, preset service, controller, admin routes, server entry re-exports

### Phase 2: Admin Foundation
**Goal**: The admin panel can resolve a preset config into live Tiptap extensions, extension hooks degrade gracefully when their feature is disabled, and an error boundary prevents hook crashes from propagating to the Strapi admin shell
**Depends on**: Phase 1
**Requirements**: UTILS-01, UTILS-02, UTILS-03, UTILS-04, UTILS-05, HOOKS-01, HOOKS-02, HOOKS-03, HOOKS-04
**Success Criteria** (what must be TRUE):
  1. `buildExtensions({ bold: false, italic: true })` returns an extension array that includes StarterKit (with bold disabled via `.configure()`) — the editor mounts and shows a cursor
  2. `buildExtensions({ heading: { levels: [2, 3] } })` returns an array where `HeadingWithSEOTag` is included separately and StarterKit's built-in heading is disabled
  3. `usePresetConfig('my-preset')` returns the full config object on success and `MINIMAL_PRESET_CONFIG` on any fetch failure or when called with `undefined`
  4. A toolbar hook called with a disabled feature returns `null` for all its buttons rather than throwing a `useEditorState` error
  5. Causing `BaseTiptapInput` to throw an error does not crash the Strapi admin panel page — the error boundary catches it and renders a fallback
**Plans**: 2 plans

Plans:
- [ ] 02-01-PLAN.md — buildExtensions utility, usePresetConfig hook, BaseHeadingWithSEOTag export, and tests
- [ ] 02-02-PLAN.md — Refactor 6 extension hooks for config-gating and create EditorErrorBoundary

### Phase 3: Editor Integration
**Goal**: Content managers can select a preset when configuring a TipTap field in Content-Type Builder; the editor loads that preset's extensions; and existing fields with no stored preset continue to work
**Depends on**: Phase 2
**Requirements**: EDITOR-01, EDITOR-02, EDITOR-03, EDITOR-04, EDITOR-05, CTB-01, CTB-02, CTB-03
**Success Criteria** (what must be TRUE):
  1. In Content-Type Builder field configuration, a "Preset" dropdown is visible in the Advanced tab and is populated with preset names from the server
  2. Saving a content-type with a preset selected persists `preset` in `attribute.options`; reopening the field config shows the same preset selected
  3. An editor field configured with a preset that excludes `table` renders no table button in the toolbar — no crash, no orphan button
  4. Opening an existing TipTap field that has no `preset` key in its schema options renders the minimal editor with a visible "No editor preset configured" notice rather than crashing
  5. The editor does not re-create (lose unsaved content) when the parent component re-renders — the extensions array is stable across renders for the same preset name
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Server Foundation | 2/2 | Complete   | 2026-03-10 |
| 2. Admin Foundation | 2/2 | Complete | 2026-03-10 |
| 3. Editor Integration | 0/TBD | Not started | - |
