---
gsd_state_version: 1.0
milestone: v1.2
milestone_name: Text & Highlight Colors
status: planning
stopped_at: Completed 07-02-PLAN.md
last_updated: "2026-03-16T19:48:04.682Z"
last_activity: 2026-03-16 — v1.2 roadmap created
progress:
  total_phases: 3
  completed_phases: 1
  total_plans: 2
  completed_plans: 2
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-16)

**Core value:** Content managers get a tailored editor with only the tools relevant to their content type, configured once by developers using native Strapi plugin config
**Current focus:** Phase 7 — Types, Config and Server

## Current Position

Phase: 7 of 9 (Types, Config and Server)
Plan: — (not yet planned)
Status: Ready to plan
Last activity: 2026-03-16 — v1.2 roadmap created

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**
- Total plans completed: 0 (this milestone)
- Average duration: —
- Total execution time: —

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

## Accumulated Context
| Phase 07-types-config-and-server P01 | 3 | 2 tasks | 6 files |
| Phase 07-types-config-and-server P02 | 2min | 2 tasks | 9 files |

### Decisions

- [v1.0]: Presets via `config/plugins.ts` — standard Strapi config pattern
- [v1.0]: MINIMAL_PRESET_CONFIG fallback prompts developers to configure explicitly
- [v1.1]: Module-level StrapiApp capture at register() bypasses use-context-selector isolation
- [v1.1]: Always register image extension with enableContentCheck for content-safety
- [v1.2]: Theme config is global (not per-preset) — single palette, no duplication across content types
- [v1.2]: Custom ColorPickerPopover required — official Tiptap UI components do not accept a custom colors array
- [Phase 07-01]: textColor and highlightColor are boolean-only in TiptapPresetConfig; colors driven by global theme config not per-preset options
- [Phase 07-01]: COLOR_VALUE_RE rejects named colors — only structural color formats accepted (hex, rgb/rgba, hsl/hsla, var())
- [Phase 07-02]: Theme controller returns {} (not undefined) when no theme configured — admin panel always receives JSON object
- [Phase 07-02]: ThemeService interface inlined in controller to avoid cross-module dependency between controller and service

### Pending Todos

None.

### Blockers/Concerns

- `window.location.origin` URL prefixing only works for single-domain Strapi deployments
- 8 pre-existing RichTextInput.test.ts failures need investigation
- @strapi/design-system@2.2.0 Popover exact API not confirmed — verify trigger prop and positioning during Phase 9

## Session Continuity

Last session: 2026-03-16T19:48:04.680Z
Stopped at: Completed 07-02-PLAN.md
Resume file: None
