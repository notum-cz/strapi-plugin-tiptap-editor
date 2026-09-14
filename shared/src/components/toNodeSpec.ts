import type { RichTextComponentSchema, RichTextNodeSpec } from './types';

/** Reduces a component schema to what a ProseMirror schema needs; form metadata is dropped. */
export const toNodeSpec = (schema: RichTextComponentSchema): RichTextNodeSpec => ({
  name: schema.name,
  group: 'block',
  atom: !schema.content,
  ...(schema.content ? { content: schema.content } : {}),
  attributes: Object.fromEntries(
    Object.entries(schema.attributes).map(([key, spec]) => [key, { default: spec.default }])
  ),
});
