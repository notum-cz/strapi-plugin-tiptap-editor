// Framework-neutral: no React, no Tiptap. A ProseMirror `Schema` satisfies `SanitizeSchema` structurally.

export type JSONContent = {
  type?: string;
  attrs?: Record<string, unknown>;
  content?: JSONContent[];
  marks?: { type?: string; attrs?: Record<string, unknown>; [key: string]: unknown }[];
  text?: string;
  [key: string]: unknown;
};

export type SanitizeSchema = {
  nodes: Record<string, unknown>;
  marks: Record<string, unknown>;
};

export type SanitizeResult = {
  content: JSONContent;
  unknownNodeTypes: string[];
  unknownMarkTypes: string[];
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

// `Object.hasOwn` is ES2022; the server build targets ES2020. Schema maps may have a null prototype.
const has = (map: Record<string, unknown>, key: string) =>
  Object.prototype.hasOwnProperty.call(map, key);

/**
 * Removes node and mark types the schema doesn't define, so the document can be parsed instead of
 * throwing. An unknown leaf disappears, an unknown container is replaced by its children, an unknown
 * mark is dropped while its text stays. Never throws: stored JSON is untrusted.
 */
export function stripUnknownContent(content: JSONContent, schema: SanitizeSchema): SanitizeResult {
  const unknownNodeTypes = new Set<string>();
  const unknownMarkTypes = new Set<string>();

  const visit = (node: unknown): JSONContent[] => {
    if (!isObject(node)) return [];
    const { type } = node;

    const children = Array.isArray(node.content)
      ? node.content.flatMap((child) => visit(child))
      : undefined;

    if (typeof type === 'string' && !has(schema.nodes, type)) {
      unknownNodeTypes.add(type);
      return children ?? [];
    }

    const next: JSONContent = { ...node };
    if (children) next.content = children;
    else delete next.content;

    if (Array.isArray(node.marks)) {
      next.marks = node.marks.filter((mark) => {
        if (!isObject(mark)) return false;
        const known = typeof mark.type === 'string' && has(schema.marks, mark.type);
        if (!known && typeof mark.type === 'string') unknownMarkTypes.add(mark.type);
        return known;
      });
    } else {
      delete next.marks;
    }
    return [next];
  };

  const [root] = visit(content);
  return {
    content: root ?? { type: 'doc', content: [] },
    unknownNodeTypes: [...unknownNodeTypes],
    unknownMarkTypes: [...unknownMarkTypes],
  };
}
