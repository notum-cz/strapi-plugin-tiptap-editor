import type { RichTextComponentSchema, RichTextNodeSpec } from './types';

/** Whether a schema describes an inline atom rather than a block. */
export const isInlineComponent = (schema: Pick<RichTextComponentSchema, 'inline'>): boolean =>
  Boolean(schema.inline);

/** Reduces a component schema to what a ProseMirror schema needs; form metadata is dropped. */
export const toNodeSpec = (schema: RichTextComponentSchema): RichTextNodeSpec => {
  const inline = isInlineComponent(schema);
  if (inline && schema.content) {
    throw new Error(`Component "${schema.name}" cannot be both inline and a container`);
  }
  return {
    name: schema.name,
    group: inline ? 'inline' : 'block',
    inline,
    atom: !schema.content,
    ...(inline ? { marks: '' as const } : {}),
    ...(schema.content ? { content: schema.content } : {}),
    attributes: Object.fromEntries(
      Object.entries(schema.attributes).map(([key, spec]) => [key, { default: spec.default }])
    ),
  };
};
