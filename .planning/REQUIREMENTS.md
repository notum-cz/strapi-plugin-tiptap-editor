# Requirements: Strapi Plugin Tiptap Editor

**Defined:** 2026-03-16
**Core Value:** Content managers get a tailored editor with only the tools relevant to their content type, configured once by developers using native Strapi plugin config

## v1.1 Requirements

Requirements for Media Library Images milestone. Each maps to roadmap phases.

### Image Insertion

- [x] **IMG-01**: User can click a toolbar button to open the Strapi Media Library picker
- [x] **IMG-02**: User can select an image from the Media Library and it is inserted into the editor
- [x] **IMG-03**: Inserted image alt text is prefilled from Media Library asset metadata
- [x] **IMG-04**: Inserted image stores the Strapi asset ID in the Tiptap JSON output
- [x] **IMG-05**: Inserted image is visible in the editor canvas

### Image Alignment

- [ ] **ALIGN-01**: User can align an image left via a toolbar button
- [ ] **ALIGN-02**: User can align an image center via a toolbar button
- [ ] **ALIGN-03**: User can align an image right via a toolbar button

### Alt Text Editing

- [x] **ALT-01**: User can edit alt text on an already-inserted image without re-inserting

### Preset Gating

- [x] **PRESET-01**: Developer can enable image support via `{ mediaLibrary: true }` in preset config
- [x] **PRESET-02**: Image toolbar buttons are hidden when `mediaLibrary` is not enabled in the preset

## Future Requirements

Deferred to future release. Tracked but not in current roadmap.

### Image Enhancements

- **IMGX-01**: User can paste an image from clipboard and it uploads to Media Library automatically
- **IMGX-02**: User can select multiple images in a single picker session
- **IMGX-03**: User can resize images via drag handles in the editor

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Direct file upload bypassing Media Library | Duplicates upload plugin pipeline, creates untracked orphan files |
| Image resize handles | px values in JSON break responsive layouts; significant CSS complexity |
| Image caption (figure/figcaption) | Compound node breaks simple image schema; complicates JSON output |
| Multi-image select per picker session | Multiplies state management complexity; gallery is a separate concern |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| IMG-01 | Phase 5 | Complete |
| IMG-02 | Phase 5 | Complete |
| IMG-03 | Phase 5 | Complete |
| IMG-04 | Phase 4 | Complete |
| IMG-05 | Phase 5 | Complete |
| ALIGN-01 | Phase 6 | Pending |
| ALIGN-02 | Phase 6 | Pending |
| ALIGN-03 | Phase 6 | Pending |
| ALT-01 | Phase 5 | Complete |
| PRESET-01 | Phase 4 | Complete |
| PRESET-02 | Phase 4 | Complete |

**Coverage:**
- v1.1 requirements: 11 total
- Mapped to phases: 11
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-16*
*Last updated: 2026-03-16 — traceability filled after roadmap creation*
