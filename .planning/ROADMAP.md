# Roadmap: Strapi Plugin Tiptap Editor

## Milestones

- ✅ **v1.0 Preset Configuration System** — Phases 1-3 (shipped 2026-03-16)
- 🚧 **v1.1 Media Library Images** — Phases 4-6 (in progress)

## Phases

<details>
<summary>✅ v1.0 Preset Configuration System (Phases 1-3) — SHIPPED 2026-03-16</summary>

- [x] Phase 1: Server Foundation (2/2 plans) — completed 2026-03-10
- [x] Phase 2: Admin Foundation (2/2 plans) — completed 2026-03-10
- [x] Phase 3: Editor Integration (2/2 plans) — completed 2026-03-10

</details>

### 🚧 v1.1 Media Library Images (In Progress)

**Milestone Goal:** Allow content managers to insert images from the Strapi Media Library into the editor, with alt text prefill and editing, gated by a `mediaLibrary` preset toggle.

#### Phase 4: Image Schema Foundation

- [x] **Phase 4: Image Schema Foundation** — Types, preset gating, and the Tiptap node attribute schema that prevents irrecoverable data loss (completed 2026-03-16)

#### Phase 5: Image Insertion

- [ ] **Phase 5: Image Insertion** — Full insert flow: Media Library picker, alt text prefill and editing, asset ID storage, image visible in editor

#### Phase 6: Alignment

- [ ] **Phase 6: Alignment** — Left/center/right alignment toolbar buttons with CSS rules; content-safety guard against silent image deletion on preset reconfiguration

## Phase Details

### Phase 4: Image Schema Foundation
**Goal**: The `mediaLibrary` preset key exists, the `StrapiImageNode` Tiptap extension is defined with all custom attributes declared, and no future content write can silently lose `assetId` or `alignment` data
**Depends on**: Phase 3 (v1.0 complete)
**Requirements**: PRESET-01, PRESET-02, IMG-04
**Success Criteria** (what must be TRUE):
  1. Developer can add `{ mediaLibrary: true }` to a preset in `config/plugins.ts` and the config validator accepts it at Strapi boot without error
  2. `PRESET_FEATURE_KEYS` includes `'mediaLibrary'` and `isFeatureEnabled(config.mediaLibrary)` returns `true` only when the key is explicitly set
  3. `StrapiImageNode` serializes and parses a round-trip through Tiptap JSON preserving `assetId` (as `data-asset-id`) and `alignment` (as `data-align`) without stripping either attribute
  4. `fixtures/all-features-payload.json` contains a `strapiImage` node exercising all custom attributes
**Plans:** 2/2 plans complete

Plans:
- [ ] 04-01-PLAN.md — Add `mediaLibrary` to shared types, PRESET_FEATURE_KEYS, and fixtures
- [ ] 04-02-PLAN.md — Implement StrapiImage extension with custom attributes; wire into buildExtensions

### Phase 5: Image Insertion
**Goal**: Content managers can open the Strapi Media Library picker from the editor toolbar, select an image, and see it appear in the editor canvas with alt text prefilled and the asset ID stored in the JSON output
**Depends on**: Phase 4
**Requirements**: IMG-01, IMG-02, IMG-03, IMG-04, IMG-05, ALT-01
**Success Criteria** (what must be TRUE):
  1. A toolbar button labeled with an image icon appears in the editor when the preset has `mediaLibrary: true` and is absent when `mediaLibrary` is not set
  2. Clicking the toolbar button opens the Strapi Media Library dialog filtered to images only
  3. After selecting an image from the picker, the image is visible in the editor canvas at its natural size (constrained to editor width)
  4. The alt text field on insertion is prefilled with the asset's `alternativeText` from Media Library metadata (falling back to asset name, then empty string)
  5. The Tiptap JSON output for the image node contains both `src` (URL) and `assetId` (Strapi numeric ID); editing and re-saving a field with an image preserves `assetId`
  6. A user can click a selected image and edit its alt text inline without re-inserting the image
**Plans**: TBD

Plans:
- [ ] 05-01: Implement `MediaLibraryWrapper` component (useStrapiApp, null guard, allowedTypes, MIME guard)
- [ ] 05-02: Implement `useImage` hook and wire into `RichTextInput` with `FeatureGuard`; verify insertion data flow end-to-end

### Phase 6: Alignment
**Goal**: Content managers can align a selected image left, center, or right using dedicated toolbar buttons, and the chosen alignment is reflected visually in the editor and preserved in the JSON output
**Depends on**: Phase 5
**Requirements**: ALIGN-01, ALIGN-02, ALIGN-03
**Success Criteria** (what must be TRUE):
  1. Three alignment buttons (left, center, right) appear in the toolbar when an image is selected and `mediaLibrary` is enabled in the preset
  2. Clicking an alignment button immediately repositions the image in the editor canvas using margin-based layout (left: right-auto, center: auto both sides, right: left-auto)
  3. The `alignment` attribute is persisted in the Tiptap JSON output and survives a full save/reload cycle; the image renders in the correct position on reload
  4. Removing `mediaLibrary` from a preset and loading a field that contains image nodes does not silently delete those nodes on the next save (content-safety guard active)
**Plans**: TBD

Plans:
- [ ] 06-01: Add alignment CSS to `TiptapInputStyles.ts`; add alignment buttons to `useImage`; add `enableContentCheck` content-safety guard

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Server Foundation | v1.0 | 2/2 | Complete | 2026-03-10 |
| 2. Admin Foundation | v1.0 | 2/2 | Complete | 2026-03-10 |
| 3. Editor Integration | v1.0 | 2/2 | Complete | 2026-03-10 |
| 4. Image Schema Foundation | 2/2 | Complete   | 2026-03-16 | - |
| 5. Image Insertion | v1.1 | 0/2 | Not started | - |
| 6. Alignment | v1.1 | 0/1 | Not started | - |
