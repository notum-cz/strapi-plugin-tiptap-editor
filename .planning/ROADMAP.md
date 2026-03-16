# Roadmap: Strapi Plugin Tiptap Editor

## Milestones

- ✅ **v1.0 Preset Configuration System** — Phases 1-3 (shipped 2026-03-16)
- ✅ **v1.1 Media Library Images** — Phases 4-6 (shipped 2026-03-16)
- 🚧 **v1.2 Text & Highlight Colors** — Phases 7-9 (in progress)

## Phases

<details>
<summary>✅ v1.0 Preset Configuration System (Phases 1-3) — SHIPPED 2026-03-16</summary>

- [x] Phase 1: Server Foundation (2/2 plans) — completed 2026-03-10
- [x] Phase 2: Admin Foundation (2/2 plans) — completed 2026-03-10
- [x] Phase 3: Editor Integration (2/2 plans) — completed 2026-03-10

</details>

<details>
<summary>✅ v1.1 Media Library Images (Phases 4-6) — SHIPPED 2026-03-16</summary>

- [x] Phase 4: Image Schema Foundation (2/2 plans) — completed 2026-03-16
- [x] Phase 5: Image Insertion (2/2 plans) — completed 2026-03-16
- [x] Phase 6: Alignment (1/1 plan) — completed 2026-03-16

</details>

### 🚧 v1.2 Text & Highlight Colors (In Progress)

**Milestone Goal:** Add text color and highlight color features backed by a global theme configuration system that supports external CSS stylesheet injection for design-system integration.

- [x] **Phase 7: Types, Config and Server** — Shared types foundation, theme server route, and config validation (completed 2026-03-16)
- [ ] **Phase 8: Extension Registration and Theme Hook** — Tiptap extension wiring, useThemeConfig hook, stylesheet injection
- [ ] **Phase 9: Color UI and Integration** — Color picker component, color hooks, RichTextInput wiring

## Phase Details

### Phase 7: Types, Config and Server
**Goal**: Developers can define a global `theme` config in `config/plugins.ts` with colors and an optional stylesheet path; Strapi validates the shape at boot and serves it via an admin API route
**Depends on**: Phase 6 (existing codebase)
**Requirements**: THEME-01, THEME-02, THEME-03, THEME-04
**Success Criteria** (what must be TRUE):
  1. Developer can add `theme: { colors: [{ label: 'Brand', color: '#0052cc' }], stylesheet: '/path/to/theme.css' }` to plugin config and Strapi boots without error
  2. `GET /tiptap-editor/theme` returns the configured theme object (colors array + stylesheet string) to authenticated admin users
  3. Strapi boot rejects an invalid theme shape (e.g., `colors` not an array, `stylesheet` not a string) with a clear validation error
  4. `TiptapThemeConfig`, `theme?` on `TiptapPluginConfig`, `textColor?`/`highlightColor?` on `TiptapPresetConfig`, and both new keys in `PRESET_FEATURE_KEYS` are all available as exported TypeScript types
**Plans:** 2/2 plans complete

Plans:
- [ ] 07-01-PLAN.md — Types, config validation, and fixture updates
- [ ] 07-02-PLAN.md — Theme service, controller, route, and server wiring

### Phase 8: Extension Registration and Theme Hook
**Goal**: The Tiptap editor registers TextStyle+Color and Highlight extensions when enabled in a preset, fetches theme config once per editor mount, and injects the configured stylesheet into the admin panel without duplicates
**Depends on**: Phase 7
**Requirements**: INFR-03, INFR-04, INFR-05
**Success Criteria** (what must be TRUE):
  1. A preset with `{ textColor: true }` causes `buildExtensions` to include both `TextStyle` and `Color` extensions; a preset with `{ highlightColor: true }` includes `Highlight` configured with `multicolor: true`
  2. Content with text color and highlight marks round-trips through Tiptap JSON without losing color attribute values (concrete hex values, not CSS variable tokens)
  3. The `<link>` tag for the configured stylesheet appears in the document `<head>` exactly once after editor mount, even if multiple editors are mounted or HMR fires
  4. Pasting content from an external source does not introduce unexpected `style` attributes on spans when TextStyle is active
**Plans:** 1/2 plans executed

Plans:
- [ ] 08-01-PLAN.md — Utility modules: themeCache, PasteStripper extension, useThemeConfig hook, package install
- [ ] 08-02-PLAN.md — Extension registration in buildExtensions, bootstrap wiring, tests, fixture update

### Phase 9: Color UI and Integration
**Goal**: Content managers can apply and remove text color and highlight color from selected text using theme swatches; the active color is visually indicated; features are absent when not enabled in the preset
**Depends on**: Phase 8
**Requirements**: TXTC-01, TXTC-02, TXTC-03, TXTC-04, HILC-01, HILC-02, HILC-03, HILC-04, INFR-01, INFR-02
**Success Criteria** (what must be TRUE):
  1. Content manager can select text, open the text color picker, click a theme swatch, and see the color applied to the selection in the editor
  2. Content manager can select colored text and click the "remove color" option to clear the text color
  3. Content manager can select text, open the highlight picker, apply a background color from the theme swatches, and clear it with the remove option
  4. The active swatch in each picker is visually highlighted when the cursor is inside text that has that color applied
  5. A preset without `textColor` or `highlightColor` shows no color picker buttons in the toolbar; a preset with them enabled shows both pickers
**Plans**: TBD

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Server Foundation | v1.0 | 2/2 | Complete | 2026-03-10 |
| 2. Admin Foundation | v1.0 | 2/2 | Complete | 2026-03-10 |
| 3. Editor Integration | v1.0 | 2/2 | Complete | 2026-03-10 |
| 4. Image Schema Foundation | v1.1 | 2/2 | Complete | 2026-03-16 |
| 5. Image Insertion | v1.1 | 2/2 | Complete | 2026-03-16 |
| 6. Alignment | v1.1 | 1/1 | Complete | 2026-03-16 |
| 7. Types, Config and Server | 2/2 | Complete   | 2026-03-16 | - |
| 8. Extension Registration and Theme Hook | 1/2 | In Progress|  | - |
| 9. Color UI and Integration | v1.2 | 0/? | Not started | - |
