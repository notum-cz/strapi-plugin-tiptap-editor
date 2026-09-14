import {
  getComponentOptions,
  isComponentEnabled,
  type TiptapPresetConfig,
} from '../../../shared/src/types';
import { isReservedNodeName, isValidComponentName } from '../../../shared/src/components/names';
import type {
  AnyRichTextComponentDefinition,
  ResolvedRichTextComponent,
  RichTextComponentDefinition,
} from './types';

const registry = new Map<string, AnyRichTextComponentDefinition>();
const warnedUnregistered = new Set<string>();

/** Identity helper that gives host code the definition's attribute typing. */
export function defineRichTextComponent<A extends Record<string, unknown>>(
  definition: RichTextComponentDefinition<A>
): RichTextComponentDefinition<A> {
  return definition;
}

/** Registers (or replaces) a component; must run before any editor field mounts. */
export function registerRichTextComponent(definition: AnyRichTextComponentDefinition): void {
  const { name } = definition;
  if (isReservedNodeName(name)) {
    throw new Error(`[TiptapEditor] "${name}" is a reserved node name and cannot be a component`);
  }
  if (!isValidComponentName(name)) {
    throw new Error(`[TiptapEditor] "${name}" is an invalid component name`);
  }
  if (registry.has(name)) {
    console.info(`[TiptapEditor] Replacing rich-text component "${name}"`);
  }
  registry.set(name, definition);
}

export function getRichTextComponent(name: string): AnyRichTextComponentDefinition | undefined {
  return registry.get(name);
}

export function listRichTextComponents(): AnyRichTextComponentDefinition[] {
  return Array.from(registry.values());
}

/** Test-only reset. */
export function clearRichTextComponents(): void {
  registry.clear();
  warnedUnregistered.clear();
}

/** Every registered component with the preset's enabled flag and options; warns once about names the preset enables but nobody registered. */
export function resolveRichTextComponents(config: TiptapPresetConfig): ResolvedRichTextComponent[] {
  for (const name of Object.keys(config.components ?? {})) {
    if (!registry.has(name) && isComponentEnabled(config, name) && !warnedUnregistered.has(name)) {
      warnedUnregistered.add(name);
      console.warn(
        `[TiptapEditor] Preset enables rich-text component "${name}" but nothing registered it; call registerRichTextComponent() in src/admin/app.tsx`
      );
    }
  }
  return listRichTextComponents().map((definition) => ({
    definition,
    enabled: isComponentEnabled(config, definition.name),
    options: getComponentOptions(config, definition.name) ?? {},
  }));
}
