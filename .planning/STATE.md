---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: Media Library Images
status: executing
stopped_at: "Paused at checkpoint: Phase 06-01 Task 3 human-verify"
last_updated: "2026-03-16T17:08:06.584Z"
last_activity: "2026-03-16 — Phase 4 Plan 01 complete: mediaLibrary key added to types and fixtures"
progress:
  total_phases: 3
  completed_phases: 3
  total_plans: 5
  completed_plans: 5
  percent: 50
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-16)

**Core value:** Content managers get a tailored editor with only the tools relevant to their content type, configured once by developers using native Strapi plugin config
**Current focus:** Phase 4 — Image Schema Foundation (v1.1 start)

## Current Position

Phase: 4 of 6 (Image Schema Foundation)
Plan: 1 of 2 in current phase
Status: In progress
Last activity: 2026-03-16 — Phase 4 Plan 01 complete: mediaLibrary key added to types and fixtures

Progress: [█████░░░░░] 50%

## Performance Metrics

**Velocity:**
- Total plans completed: 6 (v1.0)
- Average duration: unknown
- Total execution time: unknown

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| v1.0 (phases 1-3) | 6/6 | - | - |

*Updated after each plan completion*
| Phase 04-image-schema-foundation P01 | 5 | 2 tasks | 4 files |
| Phase 04-image-schema-foundation P02 | 3min | 2 tasks | 6 files |
| Phase 05-image-insertion P01 | 5 | 3 tasks | 5 files |
| Phase 05-image-insertion P02 | 30min | 2 tasks | 6 files |
| Phase 06-alignment P01 | 3 | 2 tasks | 8 files |

## Accumulated Context

### Decisions

- [v1.0]: Presets via `config/plugins.ts` — standard Strapi config pattern
- [v1.0]: MINIMAL_PRESET_CONFIG fallback prompts developers to configure explicitly
- [v1.1 pre-work]: Alignment via dedicated node attribute + margin CSS (not TextAlign extension) — TextAlign has no effect on image leaf nodes
- [v1.1 pre-work]: MediaLibraryWrapper isolates `useStrapiApp` to keep `useImage` testable without Strapi context
- [v1.1 pre-work]: Store both `src` and `assetId` — `src` for immediate render, `assetId` for URL resolution after storage provider switch
- [Phase 04-image-schema-foundation]: mediaLibrary uses boolean | Record<string, unknown> — no dedicated config type needed at this stage
- [Phase 04-image-schema-foundation]: StrapiImage uses standard 'image' node name via Image.extend() for ProseMirror schema compatibility
- [Phase 04-image-schema-foundation]: renderHTML returns {} for null attrs to prevent ProseMirror serializing null as string 'null'
- [Phase 05-image-insertion]: @strapi/design-system CJS/ESM conflict requires vi.mock stubs in all test files importing Strapi UI components
- [Phase 05-image-insertion]: setImage custom attrs typed as any — SetImageOptions does not include extension attrs; runtime schema validates correctly
- [Phase 05-image-insertion]: createParagraphNear chained after setImage to prevent cursor trap at end of doc
- [Phase Phase 05-image-insertion]: Image FeatureGuard uses config?.mediaLibrary, positioned after link and before table in toolbar
- [Phase 05-image-insertion]: StrapiApp instance captured at register() via module-level ref — use-context-selector isolates contexts between plugin bundle and host, making useStrapiApp() return undefined
- [Phase 06-alignment]: buildExtensions always includes image extension — enableContentCheck:true when mediaLibrary disabled prevents silent content deletion on preset reconfiguration
- [Phase 06-alignment]: ImageNodeViewReadOnly renders images without popover/controls when mediaLibrary is disabled — separate component enables direct test assertions

### Pending Todos

None yet.

### Blockers/Concerns

- [Phase 5]: Two-step vs. single-step image insertion — verify at implementation time whether `setImage` on `StrapiImageNode` accepts all custom attrs in one chain call or requires a follow-up `updateAttributes`
- [Phase 5]: `window.location.origin` URL prefixing only works for single-domain Strapi deployments; document as known limitation if split-domain setup is needed

## Session Continuity

Last session: 2026-03-16T17:08:06.582Z
Stopped at: Paused at checkpoint: Phase 06-01 Task 3 human-verify
Resume file: None
