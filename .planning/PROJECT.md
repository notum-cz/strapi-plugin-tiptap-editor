# Strapi Plugin Tiptap Editor — Preset Configuration System

## What This Is

A Strapi 5 custom field plugin that embeds a Tiptap rich text editor in the admin panel. The current milestone adds a **preset configuration system**: developers define named editor presets (Tiptap extension arrays) in server-side code, and content managers select a preset when adding a TipTap field to a content-type or component. The editor initializes with only the extensions defined in the chosen preset, and the toolbar auto-detects which buttons to show.

## Core Value

Content managers get a tailored editor with only the tools relevant to their content type — no more, no less — configured once by developers using native Tiptap APIs.

## Requirements

### Validated

- ✓ Plugin registers a custom `RichText` field type in Strapi 5 — existing
- ✓ Tiptap editor renders in the admin panel with a full toolbar — existing
- ✓ Editor content serialized as JSON string and stored in Strapi database — existing
- ✓ Extensions: StarterKit, Heading (with SEO tag), Link (dialog), Table (dialog), TextAlign, Sub/Superscript — existing
- ✓ Extension behavior encapsulated in composable hooks (useStarterKit, useLink, useHeading, useTable, useTextAlign, useScript) — existing

### Active

- [ ] Developer can call a plugin-exported `registerPresets()` function from Strapi's `register` or `bootstrap` lifecycle to register named presets
- [ ] Each preset is defined as `{ name: string, label?: string, extensions: TiptapPresetExtension[] }` where `TiptapPresetExtension` is a typed, serializable extension descriptor
- [ ] Plugin exports TypeScript types for the preset config to prevent incorrect attribute usage
- [ ] Plugin exposes an API route (`GET /tiptap-editor/presets`) that returns all registered preset names/labels for the admin panel
- [ ] A "default" preset exists with the current full extension set; used as fallback when no preset is specified or the named preset doesn't exist
- [ ] When adding a TipTap custom field in Content-Type Builder, a dropdown lists available preset names
- [ ] Selected preset name is stored in the field's schema options
- [ ] At editor runtime, the admin fetches the active preset and maps extension descriptors to actual Tiptap extension objects
- [ ] Toolbar buttons are auto-detected based on loaded extensions (only buttons for active extensions are shown)
- [ ] If a preset name stored in schema no longer exists on the server, fall back to the default preset (no crash, no empty editor)

### Out of Scope

- Visual preset builder UI in admin — developer-only workflow, code-based config is sufficient
- Per-user preset selection — presets are per content-type field, not per user
- Hot-reload of presets without server restart — static config per server lifecycle is fine
- Custom extension upload — presets can only use extensions bundled with the plugin

## Context

**Existing codebase state:**
- Dual-layer plugin: `admin/` (React, Tiptap) + `server/` (Strapi backend) + `shared/` (constants)
- Extensions already implemented as hooks in `admin/src/extensions/` — these will be conditionally activated by presets
- `usePresetConfig.ts` hook stub exists in `admin/src/hooks/` — likely the integration point for fetching preset config in the admin
- `featureToggle` utility exists in built types — suggests this feature was planned but not implemented
- Server-side has empty stubs for controllers/routes/services — preset API route can be added there

**Key architectural challenge:**
Presets are defined server-side (Strapi lifecycle) but executed client-side (Tiptap in browser). Bridge: presets are serializable JSON descriptors (extension name + options), not live JS extension objects. Server stores descriptors, admin maps descriptor names to actual extension objects.

## Constraints

- **Compatibility**: Must work with Strapi 5.35.0+ (breaking change from v4 already handled)
- **Tiptap version**: Extensions must be compatible with Tiptap 3.19.0 (current pinned version)
- **Serializable presets**: Extension descriptors must be JSON-serializable (no function references) to pass through API
- **Backward compatibility**: Existing TipTap fields with no preset set must continue to work using the default preset
- **TypeScript**: Plugin exports must be fully typed to fulfill the "avoid runtime errors" goal

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Presets registered in Strapi register/bootstrap | Standard Strapi lifecycle, runs before admin starts | — Pending |
| Module-level variable stores presets server-side | Simple, no DB needed, set before admin launch | — Pending |
| API route returns preset metadata (not extension objects) | Extension objects can't serialize over HTTP | — Pending |
| Admin maps descriptor names → extension objects | Keeps extension code client-side where it belongs | — Pending |
| Toolbar auto-detected from active extensions | Eliminates separate toolbar config, simpler DX | — Pending |
| Default preset = current full tool set | Zero breaking change for existing fields | — Pending |

---
*Last updated: 2026-03-10 after initialization*
