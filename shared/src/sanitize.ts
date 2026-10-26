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

  // A ProseMirror NodeType says whether it holds inline content; a plain map only knows `doc` doesn't.
  const acceptsInline = (type: string) => {
    const { inlineContent } = (schema.nodes[type] ?? {}) as { inlineContent?: unknown };
    return typeof inlineContent === 'boolean' ? inlineContent : type !== 'doc';
  };
  const isInline = (node: JSONContent) =>
    node.type === 'text' ||
    (typeof node.type === 'string' &&
      (schema.nodes[node.type] as { isInline?: unknown } | undefined)?.isInline === true);

  // Children promoted out of an unknown node: inline runs get a paragraph when the parent takes blocks.
  const promote = (children: JSONContent[] | undefined, inlineOk: boolean): JSONContent[] => {
    if (!children) return [];
    if (inlineOk || !has(schema.nodes, 'paragraph')) return children;
    const out: JSONContent[] = [];
    let run: JSONContent[] | undefined;
    for (const child of children) {
      if (!isInline(child)) {
        run = undefined;
        out.push(child);
      } else if (run) {
        run.push(child);
      } else {
        run = [child];
        out.push({ type: 'paragraph', content: run });
      }
    }
    return out;
  };

  const visit = (node: unknown, inlineOk: boolean): JSONContent[] => {
    if (!isObject(node)) return [];
    const { type } = node;
    const known = typeof type === 'string' && has(schema.nodes, type);
    const childInlineOk = known ? acceptsInline(type) : inlineOk;

    const children = Array.isArray(node.content)
      ? node.content.flatMap((child) => visit(child, childInlineOk))
      : undefined;

    // A node without a string type has no name to report, but keeping it would make the schema
    // throw and Tiptap would then mount an empty document.
    if (typeof type !== 'string') return promote(children, inlineOk);

    if (!known) {
      unknownNodeTypes.add(type);
      return promote(children, inlineOk);
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

  const nodes = visit(content, false);
  return {
    content:
      nodes.length === 1 && nodes[0].type === 'doc'
        ? nodes[0]
        : { type: 'doc', content: promote(nodes, false) },
    unknownNodeTypes: [...unknownNodeTypes],
    unknownMarkTypes: [...unknownMarkTypes],
  };
}
