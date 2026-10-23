import type { TiptapOutputFormat } from './types';
import {
  type ProseMirrorJSONNode,
  isSafeIframeUrl,
  isSafeUrl,
  sanitizeHtmlString,
} from './serializers/sanitizers';
import { parseInlineMarkdown } from './serializers/inlineMarkdownParser';
import {
  encodeNodeMetaComment,
  serializeBlockToMarkdown,
} from './serializers/markdownSerializer';
import {
  markdownToJson,
  parseSingleMarkdownBlock,
  splitMarkdownBlocks,
} from './serializers/markdownParser';

export {
  type ProseMirrorJSONNode,
  isSafeUrl,
  isSafeIframeUrl,
  sanitizeHtmlString,
  parseInlineMarkdown,
  markdownToJson,
};

/**
 * Converts a ProseMirror JSON document tree into Markdown.
 * Emits clean Markdown for standard blocks and attaches a non-rendering HTML comment metadata
 * annotation only when a block contains rich attributes that plain Markdown syntax would drop.
 */
export function jsonToMarkdown(doc: ProseMirrorJSONNode | null | undefined): string {
  if (!doc || typeof doc !== 'object') return '';

  const blocks = Array.isArray(doc.content) ? doc.content : [];
  const lines: string[] = [];

  for (const node of blocks) {
    const pureMd = serializeBlockToMarkdown(node);
    // A block "opens a container" only if it leaves a fence/math/details/layout unclosed
    const opensContainer =
      pureMd.length > 0 && splitMarkdownBlocks(`${pureMd}\n\n__sentinel__`).length !== 2;
    if (opensContainer) {
      lines.push(encodeNodeMetaComment(node));
      continue;
    }
    const reparsed = parseSingleMarkdownBlock(pureMd);
    if (reparsed && JSON.stringify(reparsed) === JSON.stringify(node)) {
      lines.push(pureMd);
    } else {
      lines.push(
        pureMd ? `${pureMd}\n${encodeNodeMetaComment(node)}` : encodeNodeMetaComment(node)
      );
    }
  }

  return lines.filter((l) => l !== undefined).join('\n\n');
}

/**
 * Serializes a Tiptap editor instance into the configured output format (`json`, `html`, or `markdown`).
 */
export function serializeEditorContent(
  editor: {
    getJSON: () => unknown;
    getHTML: () => string;
  },
  outputFormat: TiptapOutputFormat = 'json'
): string {
  switch (outputFormat) {
    case 'html':
      return sanitizeHtmlString(editor.getHTML());
    case 'markdown':
      return jsonToMarkdown(editor.getJSON() as ProseMirrorJSONNode);
    case 'json':
    default:
      return JSON.stringify(editor.getJSON());
  }
}
