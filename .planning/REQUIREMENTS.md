# Requirements: Strapi Plugin Tiptap Editor

**Defined:** 2026-03-16
**Core Value:** Content managers get a tailored editor with only the tools relevant to their content type, configured once by developers using native Strapi plugin config

## v1.2 Requirements

Requirements for text color, highlight color, and theme configuration. Each maps to roadmap phases.

### Theme Configuration

- [x] **THEME-01**: Developer can define a global `theme.colors` array of `{ label, color }` objects in plugin config
- [x] **THEME-02**: Developer can specify a `theme.stylesheet` path that the plugin injects as a `<link>` tag in the admin panel
- [x] **THEME-03**: Theme config is served via `GET /tiptap-editor/theme` admin route
- [x] **THEME-04**: Config validator rejects invalid theme shape at Strapi boot

### Text Color

- [ ] **TXTC-01**: Content manager can apply a text color from the theme palette to selected text
- [ ] **TXTC-02**: Content manager can remove text color from selected text
- [ ] **TXTC-03**: Text color picker shows the currently active color highlighted in the swatch grid
- [ ] **TXTC-04**: Text color feature gated by `textColor` preset key

### Highlight Color

- [ ] **HILC-01**: Content manager can apply a highlight (background) color from the theme palette to selected text
- [ ] **HILC-02**: Content manager can remove highlight color from selected text
- [ ] **HILC-03**: Highlight color picker shows the currently active color highlighted in the swatch grid
- [ ] **HILC-04**: Highlight color feature gated by `highlightColor` preset key

### Shared Infrastructure

- [ ] **INFR-01**: Shared `ColorPickerPopover` component renders theme swatches with accessible labels
- [ ] **INFR-02**: Color picker preserves editor selection when opening/closing (selectionRef pattern)
- [x] **INFR-03**: Pasted content stripped of inherited inline styles when TextStyle is active
- [x] **INFR-04**: Colors round-trip through Tiptap JSON as concrete values
- [x] **INFR-05**: Stylesheet injection is idempotent (survives HMR without duplicate `<link>` tags)

## Future Requirements

### Color Enhancements

- **COLX-01**: Free-form hex input alongside swatches (opt-in via config)
- **COLX-02**: Per-preset color palette overrides
- **COLX-03**: Live stylesheet hot-reload without server restart

## Out of Scope

| Feature | Reason |
|---------|--------|
| Native `<input type="color">` picker | Destroys ProseMirror selection; OS dialog UX inconsistent |
| CSS variable tokens as stored values | Breaks frontend renderers without the theme stylesheet |
| Per-preset theme config | Multiplies config complexity; global palette sufficient |
| Official Tiptap ColorTextPopover | Does not accept custom colors array; hardcoded internal palette |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| THEME-01 | Phase 7 | Complete |
| THEME-02 | Phase 7 | Complete |
| THEME-03 | Phase 7 | Complete |
| THEME-04 | Phase 7 | Complete |
| INFR-03 | Phase 8 | Complete |
| INFR-04 | Phase 8 | Complete |
| INFR-05 | Phase 8 | Complete |
| TXTC-01 | Phase 9 | Pending |
| TXTC-02 | Phase 9 | Pending |
| TXTC-03 | Phase 9 | Pending |
| TXTC-04 | Phase 9 | Pending |
| HILC-01 | Phase 9 | Pending |
| HILC-02 | Phase 9 | Pending |
| HILC-03 | Phase 9 | Pending |
| HILC-04 | Phase 9 | Pending |
| INFR-01 | Phase 9 | Pending |
| INFR-02 | Phase 9 | Pending |

**Coverage:**
- v1.2 requirements: 17 total
- Mapped to phases: 17
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-16*
*Last updated: 2026-03-16 after roadmap creation*
