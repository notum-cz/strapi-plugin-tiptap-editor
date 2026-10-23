import { describe, it, expect } from 'vitest';
import {
  isSafeUrl,
  isSafeIframeUrl,
  sanitizeHtmlString,
  jsonToMarkdown,
  markdownToJson,
  serializeEditorContent,
} from '../../shared/contentSerializer';

describe('shared/contentSerializer', () => {
  describe('isSafeUrl', () => {
    it('allows https, http, mailto, tel, strapi://, relative paths, and anchors', () => {
      expect(isSafeUrl('https://strapi.io')).toBe(true);
      expect(isSafeUrl('http://example.com/file.pdf')).toBe(true);
      expect(isSafeUrl('mailto:team@example.com')).toBe(true);
      expect(isSafeUrl('tel:+123456789')).toBe(true);
      expect(isSafeUrl('strapi://api::article.article/doc-1')).toBe(true);
      expect(isSafeUrl('/uploads/image.png')).toBe(true);
      expect(isSafeUrl('#section-1')).toBe(true);
    });

    it('rejects javascript:, vbscript:, data:text/html, protocol-relative URLs, and empty URLs without throwing on out-of-range numeric entities', () => {
      expect(isSafeUrl('javascript:alert(1)')).toBe(false);
      expect(isSafeUrl('  JAVASCRIPT:alert(1) ')).toBe(false);
      expect(isSafeUrl('vbscript:msgbox(1)')).toBe(false);
      expect(isSafeUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
      expect(isSafeUrl('//evil.com/xss')).toBe(false);
      expect(isSafeUrl('/\\evil.com/xss')).toBe(false);
      expect(isSafeUrl('')).toBe(false);
      expect(isSafeUrl('https://x.test/?a=&#1114112;')).toBe(true);
      expect(isSafeUrl('https://x.test/?a=&#x110000;')).toBe(true);
    });
  });

  describe('isSafeIframeUrl', () => {
    it('enforces https and validates against optional allowed domains', () => {
      expect(isSafeIframeUrl('https://www.youtube.com/embed/xyz')).toBe(true);
      expect(isSafeIframeUrl('http://www.youtube.com/embed/xyz')).toBe(false);
      expect(
        isSafeIframeUrl('https://player.vimeo.com/video/123', ['youtube.com', 'vimeo.com'])
      ).toBe(true);
      expect(
        isSafeIframeUrl('https://evil.example.com/embed', ['youtube.com', 'vimeo.com'])
      ).toBe(false);
    });
  });

  describe('sanitizeHtmlString', () => {
    it('removes script tags, event handlers, and javascript: URLs', () => {
      const dirty =
        '<p onclick="alert(1)">Hello <script>evil()</script><a href="javascript:xss()">Click</a></p>';
      const clean = sanitizeHtmlString(dirty);
      expect(clean).not.toContain('<script');
      expect(clean).not.toContain('onclick');
      expect(clean).not.toContain('javascript:');
      expect(clean).toContain('<p>Hello ');
    });

    it('blocks slash-separated event handlers, unquoted javascript: URLs, entity-encoded schemes, and iframe srcdoc', () => {
      const dirty = [
        '<img/onerror=alert(1) src="https://example.com/a.png">',
        '<a href=javascript:alert(1)>Unquoted</a>',
        '<a href="&#106;avascript:alert(1)">Entity</a>',
        '<a href="//evil.com/phish">ProtocolRelative</a>',
        '<iframe srcdoc="<script>alert(1)</script>"></iframe>',
        '<svg onload="alert(1)"><circle /></svg>',
      ].join('');
      const clean = sanitizeHtmlString(dirty);
      expect(clean).not.toContain('onerror');
      expect(clean).not.toContain('javascript');
      expect(clean).not.toContain('&#106;');
      expect(clean).not.toContain('//evil.com');
      expect(clean).not.toContain('srcdoc');
      expect(clean).not.toContain('<svg');
    });
  });

  describe('jsonToMarkdown & markdownToJson', () => {
    it('converts ProseMirror JSON to Markdown and back with inline marks and block structures', () => {
      const doc = {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: 'Section Title' }],
          },
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'Hello ' },
              { type: 'text', marks: [{ type: 'bold' }], text: 'World' },
              { type: 'text', text: ' and ' },
              { type: 'text', marks: [{ type: 'italic' }], text: 'Italic' },
              { type: 'text', text: ' plus ' },
              { type: 'text', marks: [{ type: 'code' }], text: 'inlineCode' },
              { type: 'text', text: ' and ' },
              {
                type: 'text',
                marks: [{ type: 'link', attrs: { href: 'https://strapi.io' } }],
                text: 'Strapi',
              },
            ],
          },
          {
            type: 'orderedList',
            content: [
              {
                type: 'listItem',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'First item' }] }],
              },
            ],
          },
          {
            type: 'blockquote',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Quoted wisdom' }] }],
          },
          {
            type: 'codeBlock',
            attrs: { language: 'ts' },
            content: [{ type: 'text', text: 'const x = 1;' }],
          },
          {
            type: 'taskList',
            content: [
              {
                type: 'taskItem',
                attrs: { checked: true },
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'Ship plugin' }],
                  },
                ],
              },
            ],
          },
          {
            type: 'horizontalRule',
          },
        ],
      };

      const md = jsonToMarkdown(doc);
      expect(md).toContain('## Section Title');
      expect(md).toContain('Hello **World** and *Italic* plus `inlineCode` and [Strapi](https://strapi.io)');
      expect(md).toContain('1. First item');
      expect(md).toContain('> Quoted wisdom');
      expect(md).toContain('```ts\nconst x = 1;\n```');
      expect(md).toContain('- [x] Ship plugin');
      expect(md).toContain('---');

      const parsed = markdownToJson(md);
      expect(parsed.type).toBe('doc');
      expect(parsed.content?.[0]?.type).toBe('heading');
      expect(parsed.content?.[1]?.content?.some((n: any) => n.marks?.some((m: any) => m.type === 'bold'))).toBe(true);
      expect(parsed.content?.[1]?.content?.some((n: any) => n.marks?.some((m: any) => m.type === 'italic'))).toBe(true);
      expect(parsed.content?.[1]?.content?.some((n: any) => n.marks?.some((m: any) => m.type === 'code'))).toBe(true);
      expect(parsed.content?.[1]?.content?.some((n: any) => n.marks?.some((m: any) => m.type === 'link'))).toBe(true);
      expect(parsed.content?.some((n: any) => n.type === 'orderedList')).toBe(true);
      expect(parsed.content?.some((n: any) => n.type === 'blockquote')).toBe(true);
      expect(parsed.content?.some((n: any) => n.type === 'codeBlock')).toBe(true);
      expect(parsed.content?.some((n: any) => n.type === 'taskList')).toBe(true);
      expect(parsed.content?.some((n: any) => n.type === 'horizontalRule')).toBe(true);
    });

    it('escapes HTML in abbr/language marks and wraps URLs containing parentheses', () => {
      const doc = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: '<script>x</script>',
                marks: [{ type: 'abbr', attrs: { title: 'a" onclick="evil()' } }],
              },
            ],
          },
          {
            type: 'image',
            attrs: { src: 'https://example.com/img(1).png', alt: 'paren' },
          },
        ],
      };
      const md = jsonToMarkdown(doc);
      expect(md).toContain('&lt;script&gt;x&lt;/script&gt;');
      expect(md).toContain('title="a&quot; onclick=&quot;evil()"');
      expect(md).toContain('![paren](<https://example.com/img(1).png>)');
    });

    it('preserves full document structure, inline marks, and attributes on a JSON -> Markdown -> JSON round-trip of fixtures/all-features-payload.json', async () => {
      const fs = await import('node:fs');
      const path = await import('node:path');
      const fixturePath = path.resolve(__dirname, '../../fixtures/all-features-payload.json');
      const allFeaturesPayload = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

      const markdown = jsonToMarkdown(allFeaturesPayload);
      const roundTripped = markdownToJson(markdown);

      expect(roundTripped).toEqual(allFeaturesPayload);
    });

    it('round-trips neutral and tip informationPane variants without metadata comments', () => {
      const parsed = markdownToJson('> [!NEUTRAL] Note\n> Neutral body\n\n> [!TIP] Pro Tip\n> Tip body');
      expect(parsed.content?.[0]).toEqual({
        type: 'informationPane',
        attrs: { variant: 'neutral', title: 'Note' },
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Neutral body' }] }],
      });
      expect(parsed.content?.[1]).toEqual({
        type: 'informationPane',
        attrs: { variant: 'tip', title: 'Pro Tip' },
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Tip body' }] }],
      });
    });

    it('does not carry storedNode.attrs onto a different block type when Markdown is edited', () => {
      const storedImageNode = {
        type: 'image',
        attrs: {
          src: 'https://example.com/old.png',
          alt: 'Old',
          'data-asset-id': 99,
        },
      };
      const editedMd = `Plain paragraph text\n<!-- tiptap-node:${JSON.stringify(storedImageNode)} -->`;
      const parsed = markdownToJson(editedMd);
      expect(parsed.content?.[0]?.type).toBe('paragraph');
      expect(parsed.content?.[0]?.attrs).toBeUndefined();
    });

    it('round-trips codeBlock containing nested triple-backtick fences and blank lines without splitting', () => {
      const doc = {
        type: 'doc',
        content: [
          {
            type: 'codeBlock',
            attrs: { language: 'markdown' },
            content: [
              {
                type: 'text',
                text: 'Example:\n\n```ts\nconst x = 1;\n```\n\nDone.',
              },
            ],
          },
        ],
      };

      const md = jsonToMarkdown(doc);
      expect(md.startsWith('````markdown\n')).toBe(true);
      expect(markdownToJson(md)).toEqual(doc);
    });

    it('preserves iframe sandbox attribute during sanitizeHtmlString', () => {
      const html =
        '<iframe src="https://www.youtube.com/embed/abc" sandbox="allow-scripts allow-same-origin" loading="lazy"></iframe>';
      const sanitized = sanitizeHtmlString(html);
      expect(sanitized).toContain('sandbox="allow-scripts allow-same-origin"');
      expect(sanitized).toContain('loading="lazy"');
    });

    it('round-trips trailing and consecutive hardBreak nodes inside a paragraph without losing breaks or splitting blocks', () => {
      const doc = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'Trailing break' },
              { type: 'hardBreak' },
            ],
          },
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'First line' },
              { type: 'hardBreak' },
              { type: 'hardBreak' },
              { type: 'text', text: 'After double break' },
            ],
          },
        ],
      };

      const md = jsonToMarkdown(doc);
      expect(markdownToJson(md)).toEqual(doc);
    });

    it('round-trips non-codeBlock/mathematics blocks containing unclosed fence or math delimiter lines without swallowing subsequent blocks', () => {
      const doc = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: '```js' }],
          },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: '$$' }],
          },
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: 'Still a separate heading' }],
          },
        ],
      };

      const md = jsonToMarkdown(doc);
      expect(markdownToJson(md)).toEqual(doc);
    });

    it('wraps display math blocks in a paragraph node so inline mathematics nodes never sit directly under doc', () => {
      const parsed = markdownToJson('$$\nx\n$$');
      expect(parsed.content?.[0]?.type).toBe('paragraph');
      expect(parsed.content?.[0]?.content).toEqual([
        {
          type: 'mathematics',
          attrs: { latex: 'x', displayMode: 'block' },
        },
      ]);
    });

    it('escapes angle brackets in metadata comments and image alt text so literal <details> does not merge subsequent blocks', () => {
      const doc = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            attrs: { textAlign: 'center' },
            content: [{ type: 'text', text: '<details>' }],
          },
          {
            type: 'image',
            attrs: { src: 'https://example.com/diagram.png', alt: '<details>' },
          },
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: 'Heading After Details Literal' }],
          },
        ],
      };

      const md = jsonToMarkdown(doc);
      expect(md).toContain('\\u003cdetails\\u003e');
      expect(markdownToJson(md)).toEqual(doc);
    });

    it('preserves visible fenced code block Markdown inside a details container and round-trips cleanly', () => {
      const doc = {
        type: 'doc',
        content: [
          {
            type: 'details',
            attrs: { open: true },
            content: [
              {
                type: 'detailsSummary',
                content: [{ type: 'text', text: 'Code Example' }],
              },
              {
                type: 'detailsContent',
                content: [
                  {
                    type: 'codeBlock',
                    attrs: { language: 'ts' },
                    content: [{ type: 'text', text: 'const answer = 42;' }],
                  },
                ],
              },
            ],
          },
        ],
      };

      const md = jsonToMarkdown(doc);
      expect(md).toContain('```ts\nconst answer = 42;\n```');
      expect(markdownToJson(md)).toEqual(doc);
    });
  });

  describe('serializeEditorContent', () => {
    const mockEditor = {
      getJSON: () => ({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Serialized content' }],
          },
        ],
      }),
      getHTML: () => '<p onclick="evil()">Serialized content</p>',
    };

    it('serializes to JSON string by default', () => {
      const out = serializeEditorContent(mockEditor, 'json');
      expect(JSON.parse(out).type).toBe('doc');
    });

    it('serializes to sanitized HTML when outputFormat is html', () => {
      const out = serializeEditorContent(mockEditor, 'html');
      expect(out).toBe('<p>Serialized content</p>');
    });

    it('serializes to Markdown when outputFormat is markdown', () => {
      const out = serializeEditorContent(mockEditor, 'markdown');
      expect(out).toBe('Serialized content');
    });
  });
});
