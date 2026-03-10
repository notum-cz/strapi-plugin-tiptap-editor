# Technology Stack

**Project:** Strapi Plugin Tiptap Editor — Preset Configuration System
**Researched:** 2026-03-10
**Milestone:** Subsequent — adding preset config layer to existing plugin

---

## Recommended Stack

The existing stack is correct and unchanged. This section documents the specific APIs and patterns within that stack that should be used for the preset milestone.

### Core Versions (Locked)

| Technology | Version | Role |
|------------|---------|------|
| Strapi | 5.35.0 | Host CMS, plugin API surface |
| @tiptap/core | 3.19.0 | Extension type system |
| @tiptap/react | 3.19.0 | Admin editor rendering |
| TypeScript | 5.9.3 | Type system for exported config APIs |
| React | 18.3.1 | Admin UI |

---

## Area 1: Strapi 5 Plugin API Routes and Config Injection

### Route Registration Pattern

**Use the named routes object notation with `type: 'admin'`.**

The Strapi 5 plugin route system (verified from `@strapi/types` 5.35.0 `dist/plugin/config/strapi-server/routes.d.ts`) supports two notations:
- Array notation: flat list of `RouteInput[]` — routes are registered on the content API (public)
- Named object notation: `{ [key: string]: { routes: RouteInput[], type?: RouterType } }` — used to separate admin routes from content-API routes

For the presets endpoint, use named object notation with `type: 'admin'`:

```typescript
// server/src/routes/index.ts
export default {
  admin: {
    type: 'admin',
    routes: [
      {
        method: 'GET',
        path: '/presets',
        handler: 'presets.getPresets',
        config: {
          auth: false,  // Admin panel is already authenticated via Strapi session
          policies: [],
        },
      },
    ],
  },
};
```

**Why `auth: false`:** The admin session authentication is handled by the Strapi admin infrastructure. Setting `auth: false` on admin routes is the pattern used by `@strapi/content-type-builder` and other first-party plugins that serve read-only data to the admin panel. The presets endpoint returns static developer-defined configuration, not user data, so no additional per-route auth scope is needed.

**Route path convention:** Plugin routes under `type: 'admin'` are prefixed automatically with `/tiptap-editor/` (from `PLUGIN_ID`). The full URL the admin calls will be `/tiptap-editor/presets`.

### Controller Pattern

**Use the factory function pattern** — the type system (verified from `@strapi/types` `dist/plugin/config/strapi-server/controllers.d.ts`) expects each controller to be a function receiving `{ strapi }`:

```typescript
// server/src/controllers/presets.ts
import type { Core } from '@strapi/strapi';

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async getPresets(ctx: any) {
    const presets = getRegisteredPresets(); // module-level store (see Area 2)
    ctx.body = {
      data: presets.map(({ name, label }) => ({ name, label: label ?? name })),
    };
  },
});
```

Then export from `controllers/index.ts`:

```typescript
// server/src/controllers/index.ts
import presets from './presets';
export default { presets };
```

**Why not a plain object:** The factory function receives the `strapi` instance, enabling access to `strapi.config` if needed later. A plain object would need the `strapi` singleton imported, which is harder to test and couples the module to the global instance.

### Config Injection to Admin

**Do not use `strapi.plugin().config()` to pass presets to admin.** This mechanism exists in Strapi 5 but it delivers static `config/index.ts` defaults to the admin — values set at build time, not at runtime. Since presets are registered by developers during server startup lifecycle, they exist only in memory after `register()`/`bootstrap()` runs.

**The correct bridge is an API route.** The admin fetches `GET /tiptap-editor/presets` on demand. This is the same pattern used by every Strapi first-party plugin that needs to expose runtime server state to the admin.

**Admin-side fetch:** Use `useFetchClient` from `@strapi/admin/admin` (verified from `@strapi/admin` 5.35.0 public exports). This hook returns a `FetchClient` with `get`, `put`, `post`, `del` methods that automatically handle Strapi admin auth tokens and abort on component unmount:

```typescript
// admin/src/hooks/usePresetConfig.ts
import { useFetchClient } from '@strapi/admin/admin';
import * as React from 'react';

interface PresetOption {
  name: string;
  label: string;
}

export function usePresetConfig() {
  const { get } = useFetchClient();
  const [presets, setPresets] = React.useState<PresetOption[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    get<{ data: PresetOption[] }>('/tiptap-editor/presets')
      .then(({ data }) => setPresets(data.data))
      .catch(() => setPresets([]))
      .finally(() => setIsLoading(false));
  }, [get]);

  return { presets, isLoading };
}
```

**Why `useFetchClient` over native `fetch`:** Automatically attaches the JWT token from the admin session, handles CSRF for non-GET methods, and cancels in-flight requests via `AbortController` when the component unmounts. This is the only documented public hook for admin-to-server communication in Strapi 5.

### Preset Storage on Server Side

**Use a module-level variable, not `strapi.config` and not a service.**

```typescript
// server/src/presets/registry.ts
import type { TiptapPreset } from './types';

let registeredPresets: TiptapPreset[] = [];

export function registerPresets(presets: TiptapPreset[]): void {
  registeredPresets = presets;
}

export function getRegisteredPresets(): TiptapPreset[] {
  return registeredPresets;
}
```

Then re-export from the plugin's public surface so developers can call `registerPresets()` from their `register` or `bootstrap`:

```typescript
// server/src/index.ts (add to exports)
export { registerPresets } from './presets/registry';
```

**Why module-level, not `strapi.config`:** `strapi.config` holds static file-based configuration loaded at startup. It cannot be updated at runtime from `register()`/`bootstrap()`. Module-level variables are the standard Strapi pattern for plugin state that is populated during lifecycle hooks (e.g., the permissions service, feature flags). Since Strapi is single-process, the module-level variable is shared across all requests.

**Why not a Strapi service:** Services are appropriate for logic that interacts with the database or other Strapi services. A pure in-memory store for static developer-provided config does not warrant a service. Adding a service creates unnecessary indirection and requires the controller to call `strapi.plugin('tiptap-editor').service('presets')`, which is more verbose without benefit.

**Lifecycle timing:** Developers call `registerPresets()` from their Strapi `register` or `bootstrap` lifecycle, both of which run before the admin panel initializes. The module-level variable is populated before any admin request can reach the presets endpoint.

---

## Area 2: Tiptap 3 Extension Serialization and Dynamic Loading

### The Serialization Constraint

**Tiptap extension objects (instances of `Extension`, `Node`, `Mark`) are not JSON-serializable.** They contain class methods, ProseMirror plugin instances, schema objects, and closures. Attempting to `JSON.stringify` an extension throws or produces `{}`.

The preset system must bridge server-side developer config with client-side Tiptap initialization. The bridge is a **descriptor pattern**: the server stores and returns plain objects that identify extensions by name plus serializable options. The admin maps those descriptors to real extension instances.

### Descriptor Type

```typescript
// shared/presetTypes.ts  (or server/src/presets/types.ts — see below)

/**
 * Identifies which extensions a preset activates and how to configure them.
 * All values must be JSON-serializable — no functions, class instances, or
 * circular references.
 */
export type ExtensionName =
  | 'starterKit'
  | 'heading'
  | 'link'
  | 'table'
  | 'textAlign'
  | 'subscript'
  | 'superscript';

export interface TiptapPresetExtension {
  name: ExtensionName;
  /** JSON-serializable options passed to .configure() on the admin side */
  options?: Record<string, unknown>;
}

export interface TiptapPreset {
  name: string;
  label?: string;
  extensions: TiptapPresetExtension[];
}
```

**Why a closed union for `ExtensionName`, not `string`:** The plugin only supports the extensions it bundles. An open `string` type would allow developers to specify extension names the plugin does not recognize, causing a silent fallback to the default preset at runtime. A union type catches misconfiguration at TypeScript compile time. If a new extension is added to the plugin, update the union.

**Why `options?: Record<string, unknown>` not typed per-extension:** The options object is what gets serialized to JSON and carried over HTTP. Typing it as the full `StarterKitOptions` interface would require that type to be importable from `shared/`, creating a dependency on `@tiptap/starter-kit` in `shared/`. Since `shared/` has no runtime Tiptap dependency, keep options as `Record<string, unknown>` at the descriptor level. Type safety for options is enforced on the admin side where the extension is actually configured.

### Admin-Side Extension Mapping

The admin maintains a registry that maps descriptor names to factory functions. Each factory takes the options from the descriptor and returns a configured Tiptap extension instance:

```typescript
// admin/src/presets/extensionRegistry.ts
import { StarterKit } from '@tiptap/starter-kit';
import { Link } from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import { TextAlign } from '@tiptap/extension-text-align';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import { HeadingWithSEOTag } from '../extensions/Heading'; // existing custom extension
import type { AnyExtension } from '@tiptap/core';
import type { TiptapPresetExtension } from '../../../shared/presetTypes';

type ExtensionFactory = (options?: Record<string, unknown>) => AnyExtension;

const EXTENSION_REGISTRY: Record<string, ExtensionFactory> = {
  starterKit: (opts) => StarterKit.configure(opts as any),
  heading: (opts) => HeadingWithSEOTag.configure(opts as any),
  link: (opts) => Link.configure(opts as any),
  table: (opts) => Table.configure(opts as any),
  textAlign: (opts) => TextAlign.configure(opts as any),
  subscript: () => Subscript,
  superscript: () => Superscript,
};

export function resolveExtensions(descriptors: TiptapPresetExtension[]): AnyExtension[] {
  return descriptors
    .map(({ name, options }) => {
      const factory = EXTENSION_REGISTRY[name];
      if (!factory) {
        console.warn(`[tiptap-editor] Unknown extension descriptor: "${name}". Skipping.`);
        return null;
      }
      return factory(options);
    })
    .filter((ext): ext is AnyExtension => ext !== null);
}
```

**Why factory functions, not pre-instantiated objects:** `Extension.configure()` returns a new extension instance. If the registry stored the result of calling `.configure()` at module load time, all presets using the same extension would share that instance (including any options from the last caller). Factories ensure each preset gets a fresh instance configured with its own options.

**Why `as any` on options:** The `.configure()` method on each extension expects `Partial<SpecificOptions>`. Since the descriptor carries `Record<string, unknown>`, a cast is needed. This is acceptable because: (a) the developer provided these options server-side where TypeScript cannot validate them against the Tiptap types anyway, (b) Tiptap ignores unknown option keys rather than throwing, and (c) the cast is localized to the registry, not exposed to callers.

### Default Preset

Define the default preset programmatically on the server side, not via `registerPresets()`:

```typescript
// server/src/presets/defaults.ts
import type { TiptapPreset } from './types';

export const DEFAULT_PRESET: TiptapPreset = {
  name: 'default',
  label: 'Default',
  extensions: [
    { name: 'starterKit' },
    { name: 'heading' },
    { name: 'link' },
    { name: 'table' },
    { name: 'textAlign' },
    { name: 'subscript' },
    { name: 'superscript' },
  ],
};
```

The `getRegisteredPresets()` function returns `[DEFAULT_PRESET, ...registeredPresets]`. This guarantees the default is always present regardless of whether the developer called `registerPresets()`.

**Why not allow developers to override the default:** The default preset is the backward-compatibility guarantee. Any existing TipTap field with no `preset` option set will use it. If the developer could replace or remove the default, they could break existing content. Isolate the default as a constant.

### Toolbar Auto-Detection

The toolbar auto-detection logic lives in the admin and consults the active extensions on the editor instance, not the descriptor list. The existing extension hooks (`useStarterKit`, `useHeading`, etc.) already use `useEditorState` and check `can()` commands to determine button visibility — this naturally handles the case where an extension is absent, since its command will not be available.

The only change needed: pass the resolved extensions to `useEditor` and remove the hardcoded extension array from the editor initialization. No new "toolbar config" type is needed.

---

## Area 3: TypeScript Patterns for Typed Plugin Configuration APIs

### Public Export Surface

The plugin must export `registerPresets`, `TiptapPreset`, `TiptapPresetExtension`, and `ExtensionName` so that developers get autocomplete and type errors when misconfiguring presets in their Strapi application code.

**Use the package's existing server export path.** The plugin's `package.json` defines a server export at `./dist/server/index.js`. The types should be re-exported from `server/src/index.ts` (the server entry point), not from a separate types-only package.

```typescript
// server/src/index.ts (additions)
export { registerPresets } from './presets/registry';
export type { TiptapPreset, TiptapPresetExtension, ExtensionName } from './presets/types';
```

A Strapi application developer using the plugin then writes:

```typescript
// src/index.ts in their Strapi app
import { registerPresets } from '@notum-cz/strapi-plugin-tiptap-editor/server';
import type { TiptapPreset } from '@notum-cz/strapi-plugin-tiptap-editor/server';
```

**Why export from server, not a `shared/` module:** The types reference `ExtensionName` which is a closed union of this plugin's supported extensions — that is a server-side concern (what the plugin supports). Placing it in `shared/` would suggest it is implementation-neutral, but it is actually the authoritative list tied to what the admin's `extensionRegistry.ts` handles.

### Type Guard for Options Validation

The server-side config validator (in `server/src/config/index.ts`) can validate preset structure at startup. For the plugin config, this is the only runtime place where type checking should occur:

```typescript
// server/src/presets/validate.ts
import type { TiptapPreset } from './types';
import { VALID_EXTENSION_NAMES } from './types';

export function validatePreset(preset: unknown): asserts preset is TiptapPreset {
  if (typeof preset !== 'object' || preset === null) throw new Error('Preset must be an object');
  const p = preset as Record<string, unknown>;
  if (typeof p.name !== 'string' || p.name.length === 0) throw new Error('Preset.name must be a non-empty string');
  if (!Array.isArray(p.extensions)) throw new Error('Preset.extensions must be an array');
  for (const ext of p.extensions) {
    if (!VALID_EXTENSION_NAMES.includes((ext as any).name)) {
      throw new Error(`Unknown extension name: "${(ext as any).name}"`);
    }
  }
}
```

Calling `validatePreset()` inside `registerPresets()` surfaces developer mistakes at server startup, not at runtime in the admin. The error appears in the Strapi server log immediately, with a clear message.

**Why `asserts` type predicate, not a returning `boolean`:** The `asserts` form narrows the type after the call, so TypeScript knows the validated value is `TiptapPreset`. This avoids casting at every call site.

### TypeScript Config for Type Export Compatibility

The existing `server/tsconfig.build.json` compiles to `dist/server/`. The type exports need `declaration: true` (likely already set via `@strapi/typescript-utils` base config). Verify and do not weaken `strict: true` — the project already uses it.

**Do not use `as const` on the preset descriptor objects created by developers.** They need mutability because the `options` field may be constructed dynamically. Use type annotations instead:

```typescript
// Developer's code in their Strapi app
const myPresets: TiptapPreset[] = [
  {
    name: 'blog',
    label: 'Blog Post',
    extensions: [
      { name: 'starterKit' },
      { name: 'heading', options: { levels: [1, 2, 3] } },
    ],
  },
];
registerPresets(myPresets);
```

The `levels: [1, 2, 3]` passes as `Record<string, unknown>` because `options` is typed that way. TypeScript does not object. The developer sees an error only if they pass an unrecognized `name` value.

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Route type | `type: 'admin'` in named routes | Array notation (content-API) | Content-API routes are public and require separate auth handling; admin routes are automatically protected by the admin session |
| Config bridge | API route `GET /presets` | `strapi.config` plugin config | Plugin config is static (file-based), cannot hold values registered at runtime via lifecycle hooks |
| Admin HTTP | `useFetchClient` from `@strapi/admin/admin` | Native `fetch` | Native fetch omits the JWT token and does not handle abort on unmount |
| Extension representation | Descriptor `{ name, options }` objects | Passing extension factory functions | Functions are not JSON-serializable; cannot cross the HTTP boundary |
| Options typing | `Record<string, unknown>` at descriptor level | Full `StarterKitOptions` etc. | Full option types would require shared/ to import @tiptap packages; overly complex for what is developer-defined config that Tiptap validates internally |
| Preset storage | Module-level variable | Strapi service | Services add indirection for a pure in-memory store; module-level is idiomatic for static lifecycle-registered state |
| Extension name typing | Closed union `ExtensionName` | `string` | Open strings allow undetectable misconfiguration; closed union gives compile-time safety |

---

## Installation

No new dependencies required. All required APIs are already available in the installed packages:
- `useFetchClient` is exported from `@strapi/admin/admin` (already installed)
- Route/controller types from `@strapi/types` (already installed)
- `@tiptap/core` `AnyExtension` type (already installed)

---

## Confidence Assessment

| Area | Confidence | Evidence Source |
|------|------------|-----------------|
| Strapi route named notation | HIGH | Verified from `@strapi/types` 5.35.0 `dist/plugin/config/strapi-server/routes.d.ts` |
| Controller factory pattern | HIGH | Verified from `@strapi/types` 5.35.0 `dist/plugin/config/strapi-server/controllers.d.ts` |
| `useFetchClient` API | HIGH | Verified from `@strapi/admin` 5.35.0 `dist/admin/src/hooks/useFetchClient.d.ts` and public `index.d.ts` exports |
| `auth: false` for admin routes | MEDIUM | Pattern observed in `@strapi/content-type-builder` 5.35.0 admin route definitions; consistent with how other plugins handle it |
| Tiptap `.configure()` factory pattern | HIGH | Verified from `@tiptap/core` 3.19.0 `dist/index.d.ts` `configure(options?: Partial<Options>)` method signatures |
| `StarterKitOptions` sub-extension keys | HIGH | Verified from `@tiptap/starter-kit` 3.19.0 `dist/index.d.ts` |
| Module-level store idiomatic in Strapi | MEDIUM | Based on Strapi 5 architecture conventions; no official API doc reference available in installed packages (docs not accessible) |
| TypeScript `asserts` predicate pattern | HIGH | TypeScript 5.x standard language feature, not Strapi-specific |

---

## Gaps and Open Questions

1. **Custom field `options` schema:** The `richTextField` server definition uses `CustomFieldServerOptions` from `@strapi/types`. It is not verified whether Strapi 5 automatically persists arbitrary key-value pairs in the field's `options` object in the content-type schema (the `preset` field name selection). This needs a concrete test with the Content-Type Builder — store a `preset: 'blog'` attribute in field options and verify it roundtrips through schema saves.

2. **Admin route URL prefix:** Plugin admin routes are expected to be prefixed with `/[plugin-id]/` but the exact Strapi 5 routing prefix behavior was not confirmed from installed type definitions (it is a runtime concern, not a type concern). This should be validated by running the server and hitting the endpoint.

3. **Content-Type Builder field attribute UI:** The Content-Type Builder renders additional field options based on the custom field definition. Whether adding a `preset` dropdown in CTB requires modifying the field definition's `options` schema or using an injection zone was not definitively resolved from type definitions alone. This is the highest-risk implementation question and should be prototyped first.

---

*Research method: analysis of installed package type definitions at `node_modules/@strapi/types@5.35.0`, `node_modules/@strapi/admin@5.35.0`, `node_modules/@tiptap/core@3.19.0`, `node_modules/@tiptap/starter-kit@3.19.0`. Web documentation access was unavailable during research session.*
