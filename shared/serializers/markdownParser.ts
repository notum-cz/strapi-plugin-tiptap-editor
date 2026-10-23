import {
  type ProseMirrorJSONNode,
  isSafeIframeUrl,
  parseMdUrl,
  sanitizeRestoredNodeTree,
  unescapeHtmlEntities,
} from './sanitizers';
import { parseInlineMarkdown } from './inlineMarkdownParser';
import { serializeBlockToMarkdown } from './markdownSerializer';

/**
 * Splits a normalized Markdown document into top-level block chunks while keeping
 * multi-paragraph `<details>`, `<div data-type="layout-container">`, fenced code blocks,
 * and display math blocks intact across blank lines.
 */
export function splitMarkdownBlocks(normalized: string): string[] {
  const lines = normalized.split('\n');
  const blocks: string[] = [];
  let current: string[] = [];
  let fence: string | null = null;
  let inMath = false;
  let detailsDepth = 0;
  let layoutDivDepth = 0;

  for (const line of lines) {
    const trimmedLine = line.trim();

    const fenceMatch = /^(`{3,}|~{3,})(.*)$/.exec(trimmedLine);
    if (fence) {
      if (
        fenceMatch &&
        fenceMatch[1][0] === fence[0] &&
        fenceMatch[1].length >= fence.length &&
        fenceMatch[2].trim() === ''
      ) {
        fence = null;
      }
    } else if (fenceMatch) {
      fence = fenceMatch[1];
    } else if (trimmedLine === '$$') {
      inMath = !inMath;
    } else if (!inMath) {
      const detailsOpens = (line.match(/<details\b[^>]*>/gi) || []).length;
      const detailsCloses = (line.match(/<\/details\s*>/gi) || []).length;
      detailsDepth = Math.max(0, detailsDepth + detailsOpens - detailsCloses);

      if (layoutDivDepth > 0 || /<div\s+data-type="layout-container"/i.test(line)) {
        const divOpens = (line.match(/<div\b[^>]*>/gi) || []).length;
        const divCloses = (line.match(/<\/div\s*>/gi) || []).length;
        layoutDivDepth = Math.max(0, layoutDivDepth + divOpens - divCloses);
      }
    }

    const insideContainer = fence !== null || inMath || detailsDepth > 0 || layoutDivDepth > 0;
    if (!insideContainer && trimmedLine === '') {
      if (current.length > 0) {
        blocks.push(current.join('\n'));
        current = [];
      }
    } else {
      current.push(line);
    }
  }

  if (current.length > 0) {
    blocks.push(current.join('\n'));
  }

  return blocks;
}

/**
 * Parses a single pure Markdown block (without metadata comments) into a ProseMirror JSON node.
 */
export function parseSingleMarkdownBlock(rawBlock: string): ProseMirrorJSONNode | null {
  const trimmed = rawBlock.trim();
  if (!trimmed) return null;

  // Fenced code block
  const fenceBlock = /^(`{3,}|~{3,})([^\n]*)\n([\s\S]*?)\n?(`{3,}|~{3,})$/.exec(trimmed);
  if (
    fenceBlock &&
    fenceBlock[4][0] === fenceBlock[1][0] &&
    fenceBlock[4].length >= fenceBlock[1].length
  ) {
    const language = fenceBlock[2].trim() || null;
    const code = fenceBlock[3].replace(/\n$/, '');
    return {
      type: 'codeBlock',
      attrs: { language },
      content: code ? [{ type: 'text', text: code }] : [],
    };
  }

  // Display math block $$ ... $$
  if (trimmed.startsWith('$$') && trimmed.endsWith('$$') && trimmed.length >= 4) {
    const latex = trimmed.slice(2, -2).trim();
    return {
      type: 'paragraph',
      content: [{ type: 'mathematics', attrs: { latex, displayMode: 'block' } }],
    };
  }

  // Multi-column layout container
  const layoutMatch =
    /^<div\s+data-type="layout-container"(?:\s+data-columns="([^"]*)")?\s*>([\s\S]*?)<\/div>$/i.exec(
      trimmed
    );
  if (layoutMatch) {
    const columns = unescapeHtmlEntities(layoutMatch[1] || '1:1');
    const inner = layoutMatch[2];
    const colRegex = /<div\s+data-type="layout-column"\s*>([\s\S]*?)<\/div>/gi;
    const colNodes: ProseMirrorJSONNode[] = [];
    let colMatch: RegExpExecArray | null;
    while ((colMatch = colRegex.exec(inner)) !== null) {
      const colDoc = markdownToJson(colMatch[1].trim());
      colNodes.push({
        type: 'layoutColumn',
        content:
          colDoc.content && colDoc.content.length > 0 ? colDoc.content : [{ type: 'paragraph' }],
      });
    }
    if (colNodes.length > 0) {
      return {
        type: 'layoutContainer',
        attrs: { columns },
        content: colNodes,
      };
    }
  }

  // Collapsible <details> block
  const detailsMatch =
    /^<details>\s*<summary>([\s\S]*?)<\/summary>\s*([\s\S]*?)\s*<\/details>$/i.exec(trimmed);
  if (detailsMatch) {
    const summaryInline = parseInlineMarkdown(detailsMatch[1].trim());
    const bodyDoc = markdownToJson(detailsMatch[2].trim());
    return {
      type: 'details',
      attrs: { open: true },
      content: [
        {
          type: 'detailsSummary',
          content: summaryInline.length > 0 ? summaryInline : [{ type: 'text', text: 'Details' }],
        },
        {
          type: 'detailsContent',
          content:
            bodyDoc.content && bodyDoc.content.length > 0
              ? bodyDoc.content
              : [{ type: 'paragraph' }],
        },
      ],
    };
  }

  // Page break
  if (/^<!--\s*pagebreak\s*-->$/i.test(trimmed)) {
    return { type: 'pageBreak' };
  }

  // Table of contents
  if (/^<!--\s*toc\s*-->$/i.test(trimmed)) {
    return { type: 'tableOfContents', attrs: { headings: [] } };
  }

  // Horizontal rule
  if (/^(-{3,}|\*{3,})$/.test(trimmed)) {
    return { type: 'horizontalRule' };
  }

  // Heading
  const headingMatch = /^(#{1,6})\s+(.+)$/.exec(trimmed);
  if (headingMatch) {
    const inlineNodes = parseInlineMarkdown(headingMatch[2]);
    return {
      type: 'heading',
      attrs: { level: headingMatch[1].length },
      content: inlineNodes,
    };
  }

  // Standalone media / embed lines
  const videoMatch = /^\[Video:\s*([^\]]*)\]\((<[^>]+>|[^)]+)\)$/i.exec(trimmed);
  if (videoMatch) {
    return {
      type: 'video',
      attrs: {
        title: unescapeHtmlEntities(videoMatch[1].trim() || 'Video'),
        src: parseMdUrl(videoMatch[2]),
      },
    };
  }

  const audioMatch = /^\[Audio:\s*([^\]]*)\]\((<[^>]+>|[^)]+)\)$/i.exec(trimmed);
  if (audioMatch) {
    return {
      type: 'audio',
      attrs: {
        title: unescapeHtmlEntities(audioMatch[1].trim() || 'Audio'),
        src: parseMdUrl(audioMatch[2]),
      },
    };
  }

  const attachmentMatch = /^\[Attachment:\s*([^\]]*)\]\((<[^>]+>|[^)]+)\)$/i.exec(trimmed);
  if (attachmentMatch) {
    const href = parseMdUrl(attachmentMatch[2]);
    const filename = unescapeHtmlEntities(attachmentMatch[1].trim() || 'Attachment');
    return {
      type: 'attachment',
      attrs: { href, src: href, filename, title: filename },
    };
  }

  const embedMatch = /^\[Embed:\s*([^\]]*)\]\((<[^>]+>|[^)]+)\)$/i.exec(trimmed);
  if (embedMatch) {
    const rawUrl = embedMatch[2].trim();
    const unwrapped =
      rawUrl.startsWith('<') && rawUrl.endsWith('>') ? rawUrl.slice(1, -1).trim() : rawUrl;
    return {
      type: 'iframe',
      attrs: {
        title: unescapeHtmlEntities(embedMatch[1].trim() || 'Embed'),
        src: isSafeIframeUrl(unwrapped) ? unwrapped : '',
      },
    };
  }

  const standaloneImgMatch = /^!\[([^\]]*)\]\((<[^>]+>|[^)]+)\)$/.exec(trimmed);
  if (standaloneImgMatch) {
    return {
      type: 'image',
      attrs: {
        alt: unescapeHtmlEntities(standaloneImgMatch[1]),
        src: parseMdUrl(standaloneImgMatch[2]),
      },
    };
  }

  // Markdown table
  const lines = trimmed.split('\n');
  if (
    lines.length >= 2 &&
    lines.every((l) => l.trim().startsWith('|') && l.trim().endsWith('|')) &&
    /^\|[\s:-]+(\|[\s:-]+)*\|$/.test(lines[1].trim())
  ) {
    const parseCells = (line: string) =>
      line
        .trim()
        .slice(1, -1)
        .split('|')
        .map((c) => c.trim());

    const headerCells = parseCells(lines[0]);
    const bodyLines = lines.slice(2);
    const tableRows: ProseMirrorJSONNode[] = [
      {
        type: 'tableRow',
        content: headerCells.map((cellText) => ({
          type: 'tableHeader',
          content: [{ type: 'paragraph', content: parseInlineMarkdown(cellText) }],
        })),
      },
      ...bodyLines.map((rowLine) => ({
        type: 'tableRow',
        content: parseCells(rowLine).map((cellText) => ({
          type: 'tableCell',
          content: [{ type: 'paragraph', content: parseInlineMarkdown(cellText) }],
        })),
      })),
    ];
    return { type: 'table', content: tableRows };
  }

  // Task list
  if (lines.every((l) => /^-\s+\[([ xX])\]\s+/.test(l))) {
    return {
      type: 'taskList',
      content: lines.map((l) => {
        const checked = /^-\s+\[[xX]\]/.test(l);
        const text = l.replace(/^-\s+\[[ xX]\]\s+/, '');
        return {
          type: 'taskItem',
          attrs: { checked },
          content: [{ type: 'paragraph', content: parseInlineMarkdown(text) }],
        };
      }),
    };
  }

  // Bullet list
  if (lines.every((l) => /^[-*]\s+/.test(l))) {
    return {
      type: 'bulletList',
      content: lines.map((l) => ({
        type: 'listItem',
        content: [{ type: 'paragraph', content: parseInlineMarkdown(l.replace(/^[-*]\s+/, '')) }],
      })),
    };
  }

  // Ordered list
  if (lines.every((l) => /^\d+\.\s+/.test(l))) {
    const firstMatch = /^(\d+)\.\s+/.exec(lines[0]);
    const start = firstMatch ? Number(firstMatch[1]) || 1 : 1;
    return {
      type: 'orderedList',
      attrs: { start },
      content: lines.map((l) => ({
        type: 'listItem',
        content: [{ type: 'paragraph', content: parseInlineMarkdown(l.replace(/^\d+\.\s+/, '')) }],
      })),
    };
  }

  // Blockquote / Lead / InformationPane / ConversationHistory
  if (lines.every((l) => /^>\s?/.test(l))) {
    const strippedLines = lines.map((l) => l.replace(/^>\s?/, ''));
    const firstLine = strippedLines[0] || '';

    const leadMatch = /^\*\*Lead:\*\*\s*(.+)$/i.exec(firstLine);
    if (leadMatch && strippedLines.length === 1) {
      return {
        type: 'leadParagraph',
        content: parseInlineMarkdown(leadMatch[1]),
      };
    }

    const infoMatch = /^\[!(INFO|SUCCESS|WARNING|DANGER|NEUTRAL|TIP)\]\s*(.*)$/i.exec(firstLine);
    if (infoMatch) {
      const variant = infoMatch[1].toLowerCase();
      const title = infoMatch[2].trim() || infoMatch[1];
      const bodyText = strippedLines.slice(1).join('\n').trim();
      return {
        type: 'informationPane',
        attrs: { variant, title },
        content: [
          {
            type: 'paragraph',
            content: bodyText ? parseInlineMarkdown(bodyText) : [],
          },
        ],
      };
    }

    const convMatch = /^\*\*Conversation History\*\*\s*\*\(([^)]*)\)\*$/i.exec(firstLine);
    if (convMatch) {
      const author = convMatch[1].trim() || 'Comment';
      const bodyText = strippedLines.slice(1).join('\n').trim();
      return {
        type: 'conversationHistory',
        attrs: { author },
        content: [
          {
            type: 'paragraph',
            content: bodyText ? parseInlineMarkdown(bodyText) : [],
          },
        ],
      };
    }

    return {
      type: 'blockquote',
      content: strippedLines.map((line) => ({
        type: 'paragraph',
        content: parseInlineMarkdown(line),
      })),
    };
  }

  // Standard paragraph
  return {
    type: 'paragraph',
    content: parseInlineMarkdown(trimmed),
  };
}

/**
 * Parses a Markdown string into a ProseMirror JSON document tree with full fidelity for
 * inline formatting, lists, tables, custom blocks, and rich node attributes.
 */
export function markdownToJson(markdown: string): ProseMirrorJSONNode {
  if (!markdown || typeof markdown !== 'string') {
    return { type: 'doc', content: [{ type: 'paragraph' }] };
  }

  const normalized = markdown.replace(/\r\n/g, '\n');
  const blocks = splitMarkdownBlocks(normalized);
  const content: ProseMirrorJSONNode[] = [];

  for (const rawBlock of blocks) {
    const trimmed = rawBlock.trim();
    if (!trimmed) continue;

    // Check for optional lossless metadata comment at the end of the block
    const metaMatch = /^(?:([\s\S]*?)\n)?<!--\s*tiptap-node:([\s\S]+?)\s*-->$/.exec(trimmed);
    if (metaMatch) {
      const mdPart = (metaMatch[1] ?? '').trim();
      const rawJson = metaMatch[2].replace(/--\\u003e/g, '-->');
      try {
        const storedNode = sanitizeRestoredNodeTree(JSON.parse(rawJson) as ProseMirrorJSONNode);
        const expectedMd = serializeBlockToMarkdown(storedNode).trim();
        if (!mdPart || mdPart === expectedMd) {
          content.push(storedNode);
          continue;
        }
        // If the user edited the visible Markdown text, parse the updated Markdown
        // and preserve the block's rich attributes (e.g. id, tag, textAlign, data-asset-id)
        const parsedEdited = parseSingleMarkdownBlock(mdPart);
        if (parsedEdited) {
          if (parsedEdited.type === storedNode.type && (storedNode.attrs || parsedEdited.attrs)) {
            parsedEdited.attrs = { ...(storedNode.attrs || {}), ...(parsedEdited.attrs || {}) };
          }
          content.push(parsedEdited);
          continue;
        }
      } catch {
        // Fall through to normal Markdown parsing if metadata comment is malformed
      }
      if (mdPart) {
        const fallbackNode = parseSingleMarkdownBlock(mdPart);
        if (fallbackNode) content.push(fallbackNode);
      }
      continue;
    }

    const parsedBlock = parseSingleMarkdownBlock(trimmed);
    if (parsedBlock) {
      content.push(parsedBlock);
    }
  }

  return {
    type: 'doc',
    content: content.length > 0 ? content : [{ type: 'paragraph' }],
  };
}
