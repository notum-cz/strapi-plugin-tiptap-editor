import DOMPurify from 'isomorphic-dompurify';

export interface ProseMirrorJSONNode {
  type?: string;
  attrs?: Record<string, unknown>;
  content?: ProseMirrorJSONNode[];
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
  text?: string;
}

const SAFE_URL_PROTOCOLS = new Set(['https:', 'http:', 'mailto:', 'tel:', 'strapi:']);

const DOMPURIFY_ALLOWED_URI_REGEXP =
  /^(?:(?:https?|mailto|tel):|strapi:\/\/|data:image\/(?:png|jpe?g|gif|webp|avif);|data:audio\/|(?!\/\/|\/\\)[^a-z]|[a-z0-9+.\-]+(?:[^a-z0-9+.\-:]|$))/i;

const DOMPURIFY_ADD_TAGS = ['iframe', 'details', 'summary', 'abbr', 'mark'];

const DOMPURIFY_FORBID_TAGS = [
  'script',
  'style',
  'svg',
  'math',
  'form',
  'object',
  'embed',
  'applet',
  'base',
  'meta',
  'link',
];

const DOMPURIFY_ADD_ATTR = [
  'allowfullscreen',
  'sandbox',
  'data-asset-id',
  'data-document-id',
  'data-type',
  'data-align',
  'data-collection',
  'data-label',
  'data-variant',
  'data-title',
  'data-author',
  'data-columns',
  'data-latex',
  'data-display-mode',
  'data-lead',
  'data-caption',
  'data-checked',
  'data-background-color',
  'data-color',
  'target',
  'rel',
  'dir',
  'lang',
  'title',
  'open',
];

/**
 * Decodes HTML character references (named & numeric decimal/hex) and strips control characters
 * so obfuscated schemes like `java&#x09;script:` or `&#106;avascript:` are caught.
 */
const safeFromCodePoint = (code: number): string =>
  Number.isInteger(code) && code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : '';

function decodeHtmlEntitiesForUrlCheck(input: string): string {
  return input
    .replace(/&#x([0-9a-f]+);?/gi, (_, hex) => safeFromCodePoint(parseInt(hex, 16)))
    .replace(/&#([0-9]+);?/g, (_, dec) => safeFromCodePoint(parseInt(dec, 10)))
    .replace(/&colon;/gi, ':')
    .replace(/&tab;/gi, '\t')
    .replace(/&newline;/gi, '\n')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/gi, "'");
}

/**
 * Escapes special HTML attribute characters (`&`, `<`, `>`, `"`, `'`).
 */
export function escAttr(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Unescapes HTML entities in Markdown/HTML text segments.
 */
export function unescapeHtmlEntities(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

/**
 * Validates that a URL uses a safe protocol or is a relative/anchor link.
 * Blocks `javascript:`, `vbscript:`, `data:text/html`, and protocol-relative `//` or `/\` URLs.
 */
export function isSafeUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const decoded = decodeHtmlEntitiesForUrlCheck(url);
  const trimmed = decoded.trim();
  if (!trimmed) return false;

  const normalized = trimmed.replace(/[\u0000-\u001F\s]/g, '');
  if (!normalized) return false;

  // Relative paths and anchor links (disallow protocol-relative // or /\)
  if (trimmed.startsWith('/') || trimmed.startsWith('#')) {
    return !/^[\/\\]{2}/.test(normalized);
  }

  // Internal Strapi link protocol
  if (normalized.toLowerCase().startsWith('strapi://')) {
    return true;
  }

  const lower = normalized.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('data:text/html')
  ) {
    return false;
  }

  // Allow safe data:image/* (except svg+xml which can embed scripts) and data:audio/*
  if (lower.startsWith('data:image/')) {
    return !lower.startsWith('data:image/svg');
  }
  if (lower.startsWith('data:audio/')) {
    return true;
  }

  try {
    const parsed = new URL(trimmed);
    return SAFE_URL_PROTOCOLS.has(parsed.protocol.toLowerCase());
  } catch {
    return false;
  }
}

/**
 * Validates an iframe embed URL against HTTPS requirement and optional domain allowlist.
 */
export function isSafeIframeUrl(url: string, allowedDomains?: string[]): boolean {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url.trim());
    if (parsed.protocol !== 'https:') return false;

    if (Array.isArray(allowedDomains) && allowedDomains.length > 0) {
      const host = parsed.hostname.toLowerCase();
      return allowedDomains.some((domain) => {
        const cleanDomain = domain.trim().toLowerCase();
        return cleanDomain.length > 0 && (host === cleanDomain || host.endsWith(`.${cleanDomain}`));
      });
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitizes an HTML string using DOMPurify (`isomorphic-dompurify`), stripping dangerous elements
 * (`<script>`, `<style>`, `<svg>`, `<math>`, `<form>`, `<object>`, `<embed>`), inline event handlers,
 * `srcdoc`, and unsafe URI schemes while preserving Tiptap editor nodes and data attributes.
 */
export function sanitizeHtmlString(html: string): string {
  if (!html || typeof html !== 'string') return '';

  return String(
    DOMPurify.sanitize(html, {
      ADD_TAGS: DOMPURIFY_ADD_TAGS,
      FORBID_TAGS: DOMPURIFY_FORBID_TAGS,
      ADD_ATTR: DOMPURIFY_ADD_ATTR,
      FORBID_ATTR: ['srcdoc'],
      ALLOWED_URI_REGEXP: DOMPURIFY_ALLOWED_URI_REGEXP,
    })
  );
}

/**
 * Formats and validates a URL for safe inclusion inside Markdown link/media syntax.
 */
export function mdUrl(raw: unknown): string {
  const str = String(raw ?? '').trim();
  if (!str || !isSafeUrl(str)) return '#';
  return /[\s()]/.test(str) ? `<${str.replace(/>/g, '%3E')}>` : str;
}

/**
 * Unwraps `<...>` around Markdown URLs and validates safety.
 */
export function parseMdUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  const unwrapped =
    trimmed.startsWith('<') && trimmed.endsWith('>') ? trimmed.slice(1, -1).trim() : trimmed;
  return isSafeUrl(unwrapped) ? unwrapped : '#';
}

/**
 * Formats `textStyle` mark attributes into a CSS inline style string.
 */
export function formatTextStyleAttr(attrs?: Record<string, unknown>): string {
  if (!attrs) return '';
  const parts: string[] = [];
  if (typeof attrs.color === 'string' && attrs.color) {
    parts.push(`color: ${attrs.color}`);
  }
  if (typeof attrs.fontFamily === 'string' && attrs.fontFamily) {
    parts.push(`font-family: ${attrs.fontFamily}`);
  }
  if (typeof attrs.fontSize === 'string' && attrs.fontSize) {
    parts.push(`font-size: ${attrs.fontSize}`);
  }
  if (typeof attrs.lineHeight === 'string' && attrs.lineHeight) {
    parts.push(`line-height: ${attrs.lineHeight}`);
  }
  return parts.join('; ');
}

/**
 * Parses an inline CSS style string from a `<span style="...">` tag into `textStyle` mark attributes.
 */
export function parseTextStyleAttr(styleStr: string): Record<string, unknown> {
  const attrs: Record<string, unknown> = {};
  for (const decl of styleStr.split(';')) {
    const colonIdx = decl.indexOf(':');
    if (colonIdx === -1) continue;
    const prop = decl.slice(0, colonIdx).trim().toLowerCase();
    const val = decl.slice(colonIdx + 1).trim();
    if (!val) continue;
    if (prop === 'color') attrs.color = val;
    else if (prop === 'font-family') attrs.fontFamily = val;
    else if (prop === 'font-size') attrs.fontSize = val;
    else if (prop === 'line-height') attrs.lineHeight = val;
  }
  return attrs;
}

/**
 * Sanitizes URL attributes inside a restored ProseMirror JSON node tree so metadata comments
 * cannot bypass URL validation.
 */
export function sanitizeRestoredNodeTree(node: ProseMirrorJSONNode): ProseMirrorJSONNode {
  const copy: ProseMirrorJSONNode = { ...node };
  if (copy.attrs && typeof copy.attrs === 'object') {
    const attrs = { ...copy.attrs };
    if (typeof attrs.src === 'string') {
      if (copy.type === 'iframe') {
        attrs.src = isSafeIframeUrl(attrs.src) ? attrs.src : '';
      } else {
        attrs.src = isSafeUrl(attrs.src) ? attrs.src : '#';
      }
    }
    if (typeof attrs.href === 'string') {
      attrs.href = isSafeUrl(attrs.href) ? attrs.href : '#';
    }
    copy.attrs = attrs;
  }
  if (Array.isArray(copy.marks)) {
    copy.marks = copy.marks.map((m) => {
      if (m.attrs && typeof m.attrs.href === 'string') {
        return {
          ...m,
          attrs: {
            ...m.attrs,
            href: isSafeUrl(m.attrs.href) ? m.attrs.href : '#',
          },
        };
      }
      return m;
    });
  }
  if (Array.isArray(copy.content)) {
    copy.content = copy.content.map(sanitizeRestoredNodeTree);
  }
  return copy;
}
