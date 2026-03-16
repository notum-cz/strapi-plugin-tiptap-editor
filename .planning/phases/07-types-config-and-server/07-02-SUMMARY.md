---
phase: 07-types-config-and-server
plan: 02
subsystem: api
tags: [typescript, strapi, server, theme, routes, controllers, services, tdd]

# Dependency graph
requires: [07-01]
provides:
  - createThemeService factory with getTheme() reading cfg.theme
  - createThemeController factory with find() returning theme or {} fallback
  - Admin route GET /theme (theme-routes group, type: admin, handler: theme.find)
  - TiptapThemeConfig and ThemeColorEntry re-exported from server/src/index.ts
affects: [09-admin-ui]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Service factory pattern: createThemeService mirrors createPresetService — reads plugin config via strapi.config.get, returns typed subset"
    - "Controller pattern: inlines ThemeService interface, uses ?? {} fallback for undefined theme"
    - "Route group pattern: named group (theme-routes) with type: admin const — mirrors preset-routes"
    - "TDD RED-GREEN: failing tests written first, implementation follows"

key-files:
  created:
    - server/src/services/theme.ts
    - server/src/controllers/theme.ts
    - tests/server/theme.service.test.ts
    - tests/server/theme.controller.test.ts
  modified:
    - server/src/services/index.ts
    - server/src/controllers/index.ts
    - server/src/routes/index.ts
    - server/src/index.ts
    - tests/server/routes.test.ts

key-decisions:
  - "Theme controller uses ?? {} fallback (not undefined) so admin panel always gets a JSON object"
  - "ThemeService interface inlined in controller (same pattern as PresetService) — avoids cross-import dependency"

# Metrics
duration: 2min
completed: 2026-03-16
---

# Phase 7 Plan 02: Theme Service, Controller, and Route Summary

**Theme service, controller, and admin route created with full TDD coverage; GET /tiptap-editor/theme returns configured colors/stylesheet or empty object; TiptapThemeConfig and ThemeColorEntry re-exported from server entry point**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-16T19:45:18Z
- **Completed:** 2026-03-16T19:47:12Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- Created `createThemeService` with `getTheme()` returning `cfg.theme` (or `undefined` when absent) — mirrors preset service factory pattern
- Registered theme service in `services/index.ts`
- Created `createThemeController` with `find()` method returning theme or `{}` via `?? {}` fallback
- Registered theme controller in `controllers/index.ts`
- Added `theme-routes` group to `routes/index.ts` — `type: 'admin'`, single route `GET /theme` with handler `theme.find`
- Added `TiptapThemeConfig` and `ThemeColorEntry` to the `export type` line in `server/src/index.ts`
- Extended `tests/server/routes.test.ts` with 3 assertions for the new route group
- Full suite: 147 tests pass across 15 test files, 0 regressions

## Task Commits

1. **Task 1: Create theme service with tests** — `d22ba66` (feat)
2. **Task 2: Create theme controller, route, wire server exports, extend route tests** — `0c2d21e` (feat)

## Files Created/Modified

- `server/src/services/theme.ts` — `createThemeService` factory, `getTheme()` returning `TiptapThemeConfig | undefined`
- `server/src/services/index.ts` — added `theme: createThemeService` entry
- `server/src/controllers/theme.ts` — `createThemeController` factory, `find()` with `?? {}` fallback
- `server/src/controllers/index.ts` — added `theme: createThemeController` entry
- `server/src/routes/index.ts` — added `theme-routes` group (`type: 'admin'`, `GET /theme` → `theme.find`)
- `server/src/index.ts` — extended `export type` to include `TiptapThemeConfig` and `ThemeColorEntry`
- `tests/server/theme.service.test.ts` — 4 unit tests (configured, no theme, colors-only, stylesheet-only)
- `tests/server/theme.controller.test.ts` — 2 unit tests (theme present, theme absent → `{}`)
- `tests/server/routes.test.ts` — 3 new assertions for theme-routes group

## Decisions Made

- Theme controller returns `{}` (not `undefined`) when no theme configured — admin panel always receives a JSON object, simplifying client-side handling
- `ThemeService` interface inlined in `theme.ts` controller (same pattern as `PresetService` in preset controller) — avoids cross-module dependency between controller and service

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

- Node.js v20.11.0 (shell default) incompatible with vitest v4 — resolved by invoking `~/.nvm/versions/node/v22.14.0/bin/node` directly (same workaround as Plan 01, no code impact)

## User Setup Required

None.

## Next Phase Readiness

- Theme endpoint is production-ready: `GET /tiptap-editor/theme` returns theme config to admin panel
- Types re-exported from server entry: consumers of `./strapi-server` can import `TiptapThemeConfig` and `ThemeColorEntry`
- Phase 8 (admin extensions: TextStyle/Highlight Tiptap extensions) and Phase 9 (color picker UI) can proceed

---
*Phase: 07-types-config-and-server*
*Completed: 2026-03-16*
