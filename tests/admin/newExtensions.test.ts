import { describe, it, expect, vi } from 'vitest';

vi.mock('@strapi/design-system', () => ({
  Box: 'Box',
  Button: 'Button',
  Dialog: { Root: 'DialogRoot', Content: 'DialogContent', Header: 'DialogHeader', Body: 'DialogBody', Footer: 'DialogFooter', Cancel: 'DialogCancel', Action: 'DialogAction' },
  Field: { Root: 'FieldRoot', Label: 'FieldLabel', Hint: 'FieldHint', Error: 'FieldError' },
  Flex: 'Flex',
  IconButton: 'IconButton',
  Popover: { Root: 'PopoverRoot', Trigger: 'PopoverTrigger', Content: 'PopoverContent' },
  SingleSelect: 'SingleSelect',
  SingleSelectOption: 'SingleSelectOption',
  TextInput: 'TextInput',
  Textarea: 'Textarea',
  Tooltip: 'Tooltip',
  Typography: 'Typography',
}));

vi.mock('@strapi/icons', () => ({
  Bold: 'Bold',
  Italic: 'Italic',
  Underline: 'Underline',
  StrikeThrough: 'StrikeThrough',
  Code: 'Code',
  Quotes: 'Quotes',
  BulletList: 'BulletList',
  NumberList: 'NumberList',
  Link: 'Link',
  Image: 'Image',
  Play: 'Play',
  VolumeUp: 'VolumeUp',
  Microphone: 'Microphone',
  Paperclip: 'Paperclip',
  CodeBlock: 'CodeBlock',
  EmotionHappy: 'EmotionHappy',
  Cross: 'Cross',
  Check: 'Check',
  Trash: 'Trash',
  Pencil: 'Pencil',
  Expand: 'Expand',
  Collapse: 'Collapse',
  Eye: 'Eye',
  Information: 'Information',
  Plus: 'Plus',
  Minus: 'Minus',
  PaintBrush: 'PaintBrush',
}));

const mockRelationsFetchGet = vi.fn();

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');
  return {
    ...actual,
    useRef: (init: any) => ({ current: init }),
    useEffect: (fn: () => void) => {
      fn();
    },
    useCallback: (fn: any) => fn,
  };
});

vi.mock('@strapi/strapi/admin', () => ({
  useField: vi.fn(() => ({ value: '', onChange: vi.fn(), error: undefined })),
  useFetchClient: vi.fn(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn() })),
  getFetchClient: vi.fn(() => ({ get: mockRelationsFetchGet })),
}));

import { FULL_PRESET_CONFIG, MINIMAL_PRESET_CONFIG, BUILT_IN_PRESETS } from '../../shared/types';
import { buildExtensions } from '../../admin/src/utils/buildExtensions';
import { calculateReadingTimeMinutes } from '../../admin/src/components/EditorFooterAndModes';
import { slugifyHeadingText } from '../../admin/src/extensions/Heading';
import { normalizeVideoEmbedUrl } from '../../admin/src/extensions/Video';
import { parseJSONContent } from '../../admin/src/utils/tiptapUtils';
import { useRelationalSync } from '../../admin/src/hooks/useRelationalSync';
import { jsonToMarkdown } from '../../shared/contentSerializer';

describe('admin/extensions & utilities', () => {
  describe('buildExtensions with all 48 features & Zero-Data-Loss fallback', () => {
    it('builds extensions for FULL_PRESET_CONFIG and edifice preset without errors', () => {
      const fullExtensions = buildExtensions(FULL_PRESET_CONFIG) as Array<{ name?: string }>;
      expect(Array.isArray(fullExtensions)).toBe(true);
      expect(fullExtensions.length).toBeGreaterThan(25);
      const fullNames = fullExtensions.map((ext) => ext?.name).filter(Boolean);
      expect(fullNames).toContain('details');
      expect(fullNames).toContain('conversationHistory');
      expect(fullNames).toContain('layoutContainer');
      expect(fullNames).toContain('taskList');
      expect(fullNames).toContain('pageBreak');
      expect(fullNames).toContain('tableOfContents');
      expect(fullNames).toContain('leadParagraph');
      expect(fullNames).toContain('abbr');
      expect(fullNames).toContain('language');
      expect(fullNames).toContain('characterCount');

      const edificeExtensions = buildExtensions(BUILT_IN_PRESETS.edifice);
      expect(edificeExtensions.length).toBe(fullExtensions.length);
    });

    it('registers read-only NodeView extensions and schema-preserving nodes/marks even in MINIMAL_PRESET_CONFIG (Zero-Data-Loss)', () => {
      const minimalExtensions = buildExtensions(MINIMAL_PRESET_CONFIG) as Array<{ name?: string }>;
      const names = minimalExtensions.map((ext) => ext?.name).filter(Boolean);

      expect(names).toContain('image');
      expect(names).toContain('video');
      expect(names).toContain('audio');
      expect(names).toContain('attachment');
      expect(names).toContain('iframe');
      expect(names).toContain('linker');
      expect(names).toContain('informationPane');
      expect(names).toContain('mathematics');
      expect(names).toContain('leadParagraph');
      expect(names).toContain('language');
      expect(names).toContain('abbr');
      expect(names).toContain('details');
      expect(names).toContain('detailsSummary');
      expect(names).toContain('detailsContent');
      expect(names).toContain('conversationHistory');
      expect(names).toContain('layoutContainer');
      expect(names).toContain('layoutColumn');
      expect(names).toContain('taskList');
      expect(names).toContain('taskItem');
      expect(names).toContain('pageBreak');
      expect(names).toContain('tableOfContents');
      expect(names).toContain('characterCount');
    });

    it('omits characterCount when explicitly disabled with characterCount: false or { enabled: false, limit } and no characterLimit', () => {
      const extensionsFalse = buildExtensions({
        ...MINIMAL_PRESET_CONFIG,
        characterCount: false,
      }) as Array<{
        name?: string;
      }>;
      expect(extensionsFalse.map((ext) => ext?.name).filter(Boolean)).not.toContain(
        'characterCount'
      );

      const extensionsObjDisabled = buildExtensions({
        ...MINIMAL_PRESET_CONFIG,
        characterCount: { enabled: false, limit: 500 },
      }) as Array<{
        name?: string;
      }>;
      expect(extensionsObjDisabled.map((ext) => ext?.name).filter(Boolean)).not.toContain(
        'characterCount'
      );
    });

    it('preserves leadParagraph, taskList/taskItem, and captioned figure images during HTML round-trip with generateJSON', async () => {
      const { generateJSON, generateHTML } = await import('@tiptap/core');
      const { JSDOM } = await import('jsdom');
      const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
      const prevWindow = (globalThis as any).window;
      const prevDocument = (globalThis as any).document;
      (globalThis as any).window = dom.window;
      (globalThis as any).document = dom.window.document;

      try {
        const extensions = buildExtensions(FULL_PRESET_CONFIG);

        const leadJson = generateJSON(
          '<p class="lead-paragraph" data-lead="true">x</p>',
          extensions
        );
        expect(leadJson.content?.[0]?.type).toBe('leadParagraph');
        expect(leadJson.content?.[0]?.content?.[0]?.text).toBe('x');

        const taskJson = generateJSON(
          '<ul data-type="taskList"><li data-type="taskItem" data-checked="true"><p>Task</p></li></ul>',
          extensions
        );
        expect(taskJson.content?.[0]?.type).toBe('taskList');
        expect(taskJson.content?.[0]?.content?.[0]?.type).toBe('taskItem');
        expect(taskJson.content?.[0]?.content?.[0]?.attrs?.checked).toBe(true);

        const captionedHtml = generateHTML(
          {
            type: 'doc',
            content: [
              {
                type: 'image',
                attrs: {
                  src: 'https://example.com/pic.jpg',
                  alt: 'Alt text',
                  'data-asset-id': 42,
                  caption: 'Visible caption',
                },
              },
            ],
          },
          extensions
        );
        expect(captionedHtml).toContain('<figure class="strapi-image-figure">');
        expect(captionedHtml).toContain('<figcaption>Visible caption</figcaption>');

        const imageJson = generateJSON(captionedHtml, extensions);
        expect(imageJson.content?.[0]?.type).toBe('image');
        expect(imageJson.content?.[0]?.attrs).toMatchObject({
          src: 'https://example.com/pic.jpg',
          alt: 'Alt text',
          'data-asset-id': 42,
          caption: 'Visible caption',
        });
      } finally {
        (globalThis as any).window = prevWindow;
        (globalThis as any).document = prevDocument;
      }
    });
  });

  describe('calculateReadingTimeMinutes', () => {
    it('returns 0 minutes when wordCount is 0 or negative', () => {
      expect(calculateReadingTimeMinutes(0)).toBe(0);
      expect(calculateReadingTimeMinutes(-10)).toBe(0);
    });

    it('calculates reading time at 200 WPM by default and rounds up to at least 1 minute', () => {
      expect(calculateReadingTimeMinutes(1)).toBe(1);
      expect(calculateReadingTimeMinutes(200)).toBe(1);
      expect(calculateReadingTimeMinutes(201)).toBe(2);
      expect(calculateReadingTimeMinutes(450)).toBe(3);
    });

    it('supports custom wordsPerMinute and falls back to 200 WPM when invalid', () => {
      expect(calculateReadingTimeMinutes(300, 150)).toBe(2);
      expect(calculateReadingTimeMinutes(300, 0)).toBe(2);
    });
  });

  describe('normalizeVideoEmbedUrl', () => {
    it('normalizes YouTube watch, short, shorts, and live URLs to embed URLs and rejects unrecognized YouTube URLs', () => {
      expect(normalizeVideoEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toEqual({
        src: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
        embedType: 'embed',
      });
      expect(normalizeVideoEmbedUrl('https://youtu.be/dQw4w9WgXcQ')).toEqual({
        src: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
        embedType: 'embed',
      });
      expect(normalizeVideoEmbedUrl('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toEqual({
        src: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
        embedType: 'embed',
      });
      expect(normalizeVideoEmbedUrl('https://www.youtube.com/live/dQw4w9WgXcQ')).toEqual({
        src: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
        embedType: 'embed',
      });
      expect(normalizeVideoEmbedUrl('https://www.youtube.com/channel/UC12345')).toBeNull();
      expect(normalizeVideoEmbedUrl('https://youtu.be/')).toBeNull();
    });

    it('normalizes Vimeo URLs to player.vimeo.com and rejects Vimeo URLs without a numeric video ID', () => {
      expect(normalizeVideoEmbedUrl('https://vimeo.com/123456789')).toEqual({
        src: 'https://player.vimeo.com/video/123456789',
        embedType: 'embed',
      });
      expect(normalizeVideoEmbedUrl('https://vimeo.com/channels/staffpicks')).toBeNull();
    });

    it('preserves direct video URLs and rejects unsafe schemes', () => {
      expect(normalizeVideoEmbedUrl('https://cdn.example.com/video.mp4')).toEqual({
        src: 'https://cdn.example.com/video.mp4',
        embedType: 'file',
      });
      expect(normalizeVideoEmbedUrl('javascript:alert(1)')).toBeNull();
    });
  });

  describe('slugifyHeadingText', () => {
    it('preserves Unicode letters and numbers while stripping diacritics and punctuation', () => {
      expect(slugifyHeadingText('Café & Résumé!')).toBe('cafe-resume');
      expect(slugifyHeadingText('日本語の見出し 2026')).toBe('日本語の見出し-2026');
      expect(slugifyHeadingText('Заголовок раздела')).toBe('заголовок-раздела');
    });
  });

  describe('parseJSONContent multi-format parser', () => {
    it('parses JSON strings, HTML strings, and Markdown strings cleanly', () => {
      const jsonDoc = JSON.stringify({
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'JSON doc' }] }],
      });
      expect(parseJSONContent(jsonDoc, '', 'json')).toEqual({
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'JSON doc' }] }],
      });

      const htmlInput = '<p onclick="evil()">Safe HTML</p>';
      expect(parseJSONContent(htmlInput, '', 'html')).toBe('<p>Safe HTML</p>');

      const mdInput = '# Heading 1\n\nParagraph text';
      const parsedMd = parseJSONContent(mdInput, '', 'markdown') as { type: string; content: any[] };
      expect(parsedMd.type).toBe('doc');
      expect(parsedMd.content[0].type).toBe('heading');
    });

    it('parses Markdown documents starting with <details> and ending with a metadata comment as a doc object', () => {
      const docStartingWithDetailsAndEndingWithAlignedParagraph = {
        type: 'doc',
        content: [
          {
            type: 'details',
            attrs: { open: true },
            content: [
              { type: 'detailsSummary', content: [{ type: 'text', text: 'FAQ' }] },
              {
                type: 'detailsContent',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Answer' }] }],
              },
            ],
          },
          {
            type: 'paragraph',
            attrs: { textAlign: 'center' },
            content: [{ type: 'text', text: 'Centered conclusion' }],
          },
        ],
      };

      const serializedMd = jsonToMarkdown(docStartingWithDetailsAndEndingWithAlignedParagraph);
      expect(serializedMd.startsWith('<')).toBe(true);
      expect(serializedMd.endsWith('>')).toBe(true);

      const parsed = parseJSONContent(serializedMd, '', 'markdown');
      expect(typeof parsed).toBe('object');
      expect(parsed).toEqual(docStartingWithDetailsAndEndingWithAlignedParagraph);
    });

    it('does not treat arbitrary JSON snippets as ProseMirror docs when outputFormat is markdown or html', () => {
      const mdParsed = parseJSONContent('{"hello":"world"}', '<p></p>', 'markdown') as {
        type: string;
        content: any[];
      };
      expect(mdParsed.type).toBe('doc');
      expect(mdParsed.content[0].type).toBe('paragraph');

      const htmlParsed = parseJSONContent('{"hello":"world"}', '<p></p>', 'html');
      expect(htmlParsed).toBe('{"hello":"world"}');
    });
  });

  describe('StrapiVideo embed host allowlist & locale catalog alignment', () => {
    it('enforces YouTube/Vimeo embed host allowlist when embedType is embed in renderHTML', async () => {
      const { StrapiVideo } = await import('../../admin/src/extensions/Video');
      const renderHTML = (StrapiVideo as any).config.renderHTML.bind(StrapiVideo);

      const safeYouTube = renderHTML({
        HTMLAttributes: {
          src: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
          embedType: 'embed',
          title: 'Video',
        },
      });
      expect(safeYouTube[0]).toBe('iframe');
      expect(safeYouTube[1].src).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');

      const unsafeEmbedHost = renderHTML({
        HTMLAttributes: {
          src: 'https://evil.example.com/embed/123',
          embedType: 'embed',
          title: 'Untrusted',
        },
      });
      expect(unsafeEmbedHost[0]).toBe('iframe');
      expect(unsafeEmbedHost[1].src).toBe('');
    });

    it('aligns ar.json and cs.json message IDs with component formatMessage lookups', async () => {
      const ar = (await import('../../admin/src/translations/ar.json')).default as Record<
        string,
        string
      >;
      const cs = (await import('../../admin/src/translations/cs.json')).default as Record<
        string,
        string
      >;
      const requiredKeys = [
        'tiptap-editor.video.dialogTitle',
        'tiptap-editor.video.embeddedTitle',
        'tiptap-editor.iframe.embeddedTitle',
        'tiptap-editor.linker.dialogTitle',
        'tiptap-editor.infoPane.variant.info',
        'tiptap-editor.footer.previewBadge',
        'tiptap-editor.image.cropEditLabel',
        'tiptap-editor.inspector.title',
      ];
      for (const key of requiredKeys) {
        expect(ar[key]).toBeTruthy();
        expect(cs[key]).toBeTruthy();
      }
    });
  });

  describe('useRelationalSync connect & disconnect diffing', () => {
    it('computes cumulative connect and disconnect diffs against the persisted baseline and re-seeds after save', async () => {
      mockRelationsFetchGet.mockImplementation(async () => ({
        data: {
          results: [
            { id: 11, documentId: 'doc-1', title: 'Article 1', status: 'published' },
            { id: 22, documentId: 'doc-2', title: 'Article 2', status: 'published' },
          ],
        },
      }));

      const initialDoc = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'linker',
                attrs: {
                  collectionName: 'api::article.article',
                  documentId: 'doc-1',
                  label: 'Article 1',
                },
              },
            ],
          },
        ],
      };

      const onSyncField = vi.fn();
      const { syncRelationsFromDoc, seedSignature } = useRelationalSync('content', {
        onSyncField,
        availableFields: ['content', 'contentLinks'],
        targetUidToAttribute: {
          'api::article.article': 'articles',
          'api::page.page': 'pages',
        },
        linksComponentUid: 'shared.links',
        initialDocument: initialDoc,
      });

      const docWithOneAndTwo = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'linker',
                attrs: {
                  collectionName: 'api::article.article',
                  documentId: 'doc-1',
                  label: 'Article 1',
                },
              },
              {
                type: 'linker',
                attrs: {
                  collectionName: 'api::article.article',
                  documentId: 'doc-2',
                  label: 'Article 2',
                },
              },
            ],
          },
        ],
      };

      // Step 1: Add doc-2 while keeping doc-1 -> only doc-2 should be in connect, disconnect should be empty
      syncRelationsFromDoc(docWithOneAndTwo);

      await vi.waitFor(() =>
        expect(onSyncField).toHaveBeenLastCalledWith('contentLinks', {
          articles: {
            connect: [expect.objectContaining({ id: 22, documentId: 'doc-2' })],
            disconnect: [],
          },
          pages: {
            connect: [],
            disconnect: [],
          },
        })
      );

      // Step 2: Remove all links before saving -> only persisted doc-1 (id: 11) is in disconnect (unsaved doc-2 is excluded)
      syncRelationsFromDoc({
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'No links left' }] }],
      });

      await vi.waitFor(() =>
        expect(onSyncField).toHaveBeenLastCalledWith('contentLinks', {
          articles: {
            connect: [],
            disconnect: [{ id: 11 }],
          },
          pages: {
            connect: [],
            disconnect: [],
          },
        })
      );

      // Step 3: Re-seed after saving docWithOneAndTwo, then remove all links -> both persisted doc-1 and doc-2 disconnect
      seedSignature(docWithOneAndTwo);
      syncRelationsFromDoc({
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'No links left' }] }],
      });

      await vi.waitFor(() =>
        expect(onSyncField).toHaveBeenLastCalledWith('contentLinks', {
          articles: {
            connect: [],
            disconnect: [{ id: 11 }, { id: 22 }],
          },
          pages: {
            connect: [],
            disconnect: [],
          },
        })
      );
    });

    it('deduplicates mediaPayload by asset ID while preserving first entry order', () => {
      const onSyncField = vi.fn();
      const { syncRelationsFromDoc } = useRelationalSync('content', {
        onSyncField,
        availableFields: ['content', 'contentMedia'],
      });

      syncRelationsFromDoc({
        type: 'doc',
        content: [
          {
            type: 'image',
            attrs: { src: 'https://example.com/one.jpg', 'data-asset-id': 42, 'data-document-id': 'media-42' },
          },
          {
            type: 'image',
            attrs: { src: 'https://example.com/one-copy.jpg', 'data-asset-id': 42, 'data-document-id': 'media-42' },
          },
          {
            type: 'image',
            attrs: { src: 'https://example.com/two.jpg', 'data-asset-id': 99, 'data-document-id': 'media-99' },
          },
        ],
      });

      expect(onSyncField).toHaveBeenCalledWith('contentMedia', [
        {
          id: 42,
          documentId: 'media-42',
          url: 'https://example.com/one.jpg',
          type: 'image',
        },
        {
          id: 99,
          documentId: 'media-99',
          url: 'https://example.com/two.jpg',
          type: 'image',
        },
      ]);
    });
  });
});
