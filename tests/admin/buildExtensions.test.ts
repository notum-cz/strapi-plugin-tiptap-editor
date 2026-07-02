import { describe, it, expect, vi } from 'vitest';

// Mock Strapi design system and React hooks used by Heading.tsx (not needed for buildExtensions)
vi.mock('@strapi/design-system', () => ({
  SingleSelect: 'SingleSelect',
  SingleSelectOption: 'SingleSelectOption',
}));
vi.mock('@tiptap/react', () => ({
  useEditorState: vi.fn(),
}));

import { getSchema } from '@tiptap/core';
import { Node as PMNode } from 'prosemirror-model';
import { EditorState, TextSelection } from 'prosemirror-state';
import { buildExtensions } from '../../admin/src/utils/buildExtensions';
import { TiptapPresetConfig } from '../../shared/types';

// A figure/figcaption doc, as it would have been saved while `figure` was enabled.
const FIGURE_DOC_JSON = {
  type: 'doc',
  content: [
    {
      type: 'figure',
      content: [
        { type: 'image', attrs: { src: 'https://example.com/x.jpg' } },
        {
          type: 'figcaption',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'A caption' }] }],
        },
      ],
    },
  ],
};

describe('buildExtensions', () => {
  it('always returns an array containing StarterKit', () => {
    const extensions = buildExtensions({});
    const hasStarterKit = extensions.some(
      (ext: any) => ext.name === 'starterKit'
    );
    expect(hasStarterKit).toBe(true);
  });

  it('always includes Gapcursor', () => {
    const extensions = buildExtensions({});
    const hasGapcursor = extensions.some(
      (ext: any) => ext.name === 'gapCursor'
    );
    expect(hasGapcursor).toBe(true);
  });

  it('includes HeadingWithSEOTag when heading is true', () => {
    const extensions = buildExtensions({ heading: true });
    const hasHeading = extensions.some(
      (ext: any) => ext.name === 'heading'
    );
    expect(hasHeading).toBe(true);
  });

  it('configures HeadingWithSEOTag with default levels [1,2,3,4,5,6] when heading is true', () => {
    const extensions = buildExtensions({ heading: true });
    const heading = extensions.find((ext: any) => ext.name === 'heading');
    expect(heading).toBeDefined();
    expect((heading as any).options.levels).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('configures HeadingWithSEOTag with custom levels when heading has levels', () => {
    const extensions = buildExtensions({ heading: { levels: [2, 3] } });
    const heading = extensions.find((ext: any) => ext.name === 'heading');
    expect(heading).toBeDefined();
    expect((heading as any).options.levels).toEqual([2, 3]);
  });

  it('does not include HeadingWithSEOTag when heading is false', () => {
    const extensions = buildExtensions({ heading: false });
    const hasHeading = extensions.some(
      (ext: any) => ext.name === 'heading'
    );
    expect(hasHeading).toBe(false);
  });

  it('always sets StarterKit heading to false', () => {
    const extensions = buildExtensions({ heading: true });
    const starterKit = extensions.find(
      (ext: any) => ext.name === 'starterKit'
    );
    // StarterKit with heading: false means heading extension is excluded from StarterKit
    expect(starterKit).toBeDefined();
  });

  it('disables bold in StarterKit when bold is false', () => {
    const config: TiptapPresetConfig = { bold: false };
    const extensions = buildExtensions(config);
    // StarterKit should be configured with bold: false
    const starterKit = extensions.find(
      (ext: any) => ext.name === 'starterKit'
    );
    expect(starterKit).toBeDefined();
  });

  it('includes Superscript when superscript is true', () => {
    const extensions = buildExtensions({ superscript: true });
    const hasSuperscript = extensions.some(
      (ext: any) => ext.name === 'superscript'
    );
    expect(hasSuperscript).toBe(true);
  });

  it('does not include Superscript when superscript is false', () => {
    const extensions = buildExtensions({ superscript: false });
    const hasSuperscript = extensions.some(
      (ext: any) => ext.name === 'superscript'
    );
    expect(hasSuperscript).toBe(false);
  });

  it('includes Subscript when subscript is true', () => {
    const extensions = buildExtensions({ subscript: true });
    const hasSubscript = extensions.some(
      (ext: any) => ext.name === 'subscript'
    );
    expect(hasSubscript).toBe(true);
  });

  it('does not include Subscript when subscript is false', () => {
    const extensions = buildExtensions({ subscript: false });
    const hasSubscript = extensions.some(
      (ext: any) => ext.name === 'subscript'
    );
    expect(hasSubscript).toBe(false);
  });

  it('includes TableKit when table is true', () => {
    const extensions = buildExtensions({ table: true });
    const hasTable = extensions.some(
      (ext: any) => ext.name === 'tableKit'
    );
    expect(hasTable).toBe(true);
  });

  it('does not include TableKit when table is false', () => {
    const extensions = buildExtensions({ table: false });
    const hasTable = extensions.some(
      (ext: any) => ext.name === 'tableKit'
    );
    expect(hasTable).toBe(false);
  });

  it('includes TextAlign when textAlign is true', () => {
    const extensions = buildExtensions({ textAlign: true });
    const hasTextAlign = extensions.some(
      (ext: any) => ext.name === 'textAlign'
    );
    expect(hasTextAlign).toBe(true);
  });

  it('does not include TextAlign when textAlign is false', () => {
    const extensions = buildExtensions({ textAlign: false });
    const hasTextAlign = extensions.some(
      (ext: any) => ext.name === 'textAlign'
    );
    expect(hasTextAlign).toBe(false);
  });

  it('includes image extension when mediaLibrary is true', () => {
    const extensions = buildExtensions({ mediaLibrary: true });
    const hasImage = extensions.some((ext: any) => ext.name === 'image');
    expect(hasImage).toBe(true);
  });

  it('includes image extension with enableContentCheck: true when mediaLibrary is false', () => {
    const extensions = buildExtensions({ mediaLibrary: false });
    const imageExt = extensions.find((ext: any) => ext.name === 'image');
    expect(imageExt).toBeDefined();
    expect((imageExt as any).options.enableContentCheck).toBe(true);
  });

  it('includes image extension with enableContentCheck: true when mediaLibrary is absent', () => {
    const extensions = buildExtensions({});
    const imageExt = extensions.find((ext: any) => ext.name === 'image');
    expect(imageExt).toBeDefined();
    expect((imageExt as any).options.enableContentCheck).toBe(true);
  });

  it('includes image extension without enableContentCheck when mediaLibrary is true', () => {
    const extensions = buildExtensions({ mediaLibrary: true });
    const imageExt = extensions.find((ext: any) => ext.name === 'image');
    expect(imageExt).toBeDefined();
    expect((imageExt as any).options.enableContentCheck).toBeFalsy();
  });

  it('with all features enabled includes StarterKit, heading, superscript, subscript, tableKit, textAlign, image, gapcursor, textStyle, color, highlight, pasteStripper', () => {
    const config: TiptapPresetConfig = {
      bold: true,
      italic: true,
      strike: true,
      code: true,
      codeBlock: true,
      blockquote: true,
      bulletList: true,
      orderedList: true,
      hardBreak: true,
      horizontalRule: true,
      history: true,
      heading: true,
      link: true,
      table: true,
      textAlign: true,
      superscript: true,
      subscript: true,
      textColor: true,
      highlightColor: true,
      mediaLibrary: true,
    };
    const extensions = buildExtensions(config);
    const names = extensions.map((ext: any) => ext.name);

    expect(names).toContain('starterKit');
    expect(names).toContain('heading');
    expect(names).toContain('superscript');
    expect(names).toContain('subscript');
    expect(names).toContain('tableKit');
    expect(names).toContain('textAlign');
    expect(names).toContain('image');
    expect(names).toContain('gapCursor');
    expect(names).toContain('textStyle');
    expect(names).toContain('color');
    expect(names).toContain('highlight');
    expect(names).toContain('pasteStripper');
  });

  it('with all features false returns only StarterKit, Image, and Gapcursor', () => {
    const config: TiptapPresetConfig = {
      bold: false,
      italic: false,
      strike: false,
      code: false,
      codeBlock: false,
      blockquote: false,
      bulletList: false,
      orderedList: false,
      hardBreak: false,
      horizontalRule: false,
      history: false,
      heading: false,
      link: false,
      table: false,
      textAlign: false,
      superscript: false,
      subscript: false,
      textColor: false,
      highlightColor: false,
      mediaLibrary: false,
    };
    const extensions = buildExtensions(config);
    const names = extensions.map((ext: any) => ext.name);

    expect(names).toContain('starterKit');
    expect(names).toContain('gapCursor');
    expect(names).not.toContain('heading');
    expect(names).not.toContain('superscript');
    expect(names).not.toContain('subscript');
    expect(names).not.toContain('tableKit');
    expect(names).not.toContain('textAlign');
    expect(names).not.toContain('textStyle');
    expect(names).not.toContain('color');
    expect(names).not.toContain('highlight');
    expect(names).not.toContain('pasteStripper');
  });

  // textColor / highlightColor extension registration tests

  it('includes TextStyle, Color, and pasteStripper when textColor is true', () => {
    const extensions = buildExtensions({ textColor: true });
    const names = extensions.map((ext: any) => ext.name);

    expect(names).toContain('textStyle');
    expect(names).toContain('color');
    expect(names).toContain('pasteStripper');
  });

  it('includes TextStyle, Highlight, and pasteStripper when highlightColor is true', () => {
    const extensions = buildExtensions({ highlightColor: true });
    const names = extensions.map((ext: any) => ext.name);

    expect(names).toContain('textStyle');
    expect(names).toContain('highlight');
    expect(names).toContain('pasteStripper');
  });

  it('includes TextStyle only once when both textColor and highlightColor are true', () => {
    const extensions = buildExtensions({ textColor: true, highlightColor: true });
    const names = extensions.map((ext: any) => ext.name);

    const textStyleCount = names.filter((name) => name === 'textStyle').length;
    expect(textStyleCount).toBe(1);

    const pasteStripperCount = names.filter((name) => name === 'pasteStripper').length;
    expect(pasteStripperCount).toBe(1);
  });

  it('does not include TextStyle, Color, or Highlight when neither textColor nor highlightColor is enabled', () => {
    const extensions = buildExtensions({});
    const names = extensions.map((ext: any) => ext.name);

    expect(names).not.toContain('textStyle');
    expect(names).not.toContain('color');
    expect(names).not.toContain('highlight');
    expect(names).not.toContain('pasteStripper');
  });

  it('Highlight is configured with multicolor: true', () => {
    const extensions = buildExtensions({ highlightColor: true });
    const highlight = extensions.find((ext: any) => ext.name === 'highlight');

    expect(highlight).toBeDefined();
    expect((highlight as any).options.multicolor).toBe(true);
  });

  it('textColor only does not include Highlight', () => {
    const extensions = buildExtensions({ textColor: true });
    const names = extensions.map((ext: any) => ext.name);

    expect(names).toContain('color');
    expect(names).not.toContain('highlight');
  });

  it('highlightColor only does not include Color', () => {
    const extensions = buildExtensions({ highlightColor: true });
    const names = extensions.map((ext: any) => ext.name);

    expect(names).toContain('highlight');
    expect(names).not.toContain('color');
  });

  // figure/figcaption are always registered (regardless of the `figure` flag) so that
  // content saved while the feature was on keeps parsing safely if it's later turned off.
  // enableContentCheck is what actually toggles editability, not schema presence.

  it('registers figure/figcaption inert (enableContentCheck) when mediaLibrary is true but figure is not specified', () => {
    const extensions = buildExtensions({ mediaLibrary: true });
    const names = extensions.map((ext: any) => ext.name);
    const figure = extensions.find((ext: any) => ext.name === 'figure');
    const figcaption = extensions.find((ext: any) => ext.name === 'figcaption');

    expect(names).toContain('figure');
    expect(names).toContain('figcaption');
    expect((figure as any)?.options.enableContentCheck).toBe(true);
    expect((figcaption as any)?.options.enableContentCheck).toBe(true);
  });

  it('includes figure and figcaption when mediaLibrary.figure is true', () => {
    const extensions = buildExtensions({ mediaLibrary: { figure: true } });
    const names = extensions.map((ext: any) => ext.name);
    const figure = extensions.find((ext: any) => ext.name === 'figure');

    expect(names).toContain('figure');
    expect(names).toContain('figcaption');
    expect((figure as any)?.options.enableContentCheck).toBe(false);
  });

  it('registers figure/figcaption inert (enableContentCheck) when mediaLibrary.figure is false', () => {
    const extensions = buildExtensions({ mediaLibrary: { figure: false } });
    const names = extensions.map((ext: any) => ext.name);
    const figure = extensions.find((ext: any) => ext.name === 'figure');
    const figcaption = extensions.find((ext: any) => ext.name === 'figcaption');

    expect(names).toContain('figure');
    expect(names).toContain('figcaption');
    expect((figure as any)?.options.enableContentCheck).toBe(true);
    expect((figcaption as any)?.options.enableContentCheck).toBe(true);
  });

  describe('regression: figure/figcaption content must survive the feature being turned off', () => {
    // Before figure/figcaption were always registered, building a schema without them
    // and feeding it a doc that already had a <figure> threw "Unknown node type:
    // figcaption" — i.e. any saved caption broke the whole field once `figure` (or
    // `mediaLibrary`) was disabled. These pin that parsing must always succeed.

    it('parses a saved figure/figcaption doc when mediaLibrary.figure is false', () => {
      const schema = getSchema(buildExtensions({ mediaLibrary: { figure: false } }));
      expect(() => PMNode.fromJSON(schema, FIGURE_DOC_JSON)).not.toThrow();
    });

    it('parses a saved figure/figcaption doc when mediaLibrary is false entirely', () => {
      const schema = getSchema(buildExtensions({ mediaLibrary: false }));
      expect(() => PMNode.fromJSON(schema, FIGURE_DOC_JSON)).not.toThrow();
    });

    it('preserves the image src and caption text once parsed', () => {
      const schema = getSchema(buildExtensions({ mediaLibrary: { figure: false } }));
      const doc = PMNode.fromJSON(schema, FIGURE_DOC_JSON);
      const figure = doc.firstChild!;
      expect(figure.type.name).toBe('figure');
      expect(figure.firstChild!.attrs.src).toBe('https://example.com/x.jpg');
      expect(figure.lastChild!.textContent).toBe('A caption');
    });
  });

  it('still parses fine when figure is enabled (control case)', () => {
    const schema = getSchema(buildExtensions({ mediaLibrary: { figure: true } }));
    expect(() => PMNode.fromJSON(schema, FIGURE_DOC_JSON)).not.toThrow();
  });

  describe('Enter inside a caption (paragraph+ content, same model as blockquote)', () => {
    function buildFigureDoc(schema: any, figcaptionParagraphs: unknown[]) {
      return PMNode.fromJSON(schema, {
        type: 'doc',
        content: [
          {
            type: 'figure',
            content: [
              { type: 'image', attrs: { src: 'https://example.com/x.jpg' } },
              { type: 'figcaption', content: figcaptionParagraphs },
            ],
          },
        ],
      });
    }

    function endOf(doc: any, match: (node: any) => boolean): number {
      let result: number | null = null;
      doc.descendants((node: any, pos: number) => {
        if (match(node)) result = pos + node.nodeSize - 1;
      });
      if (result === null) throw new Error('node not found');
      return result;
    }

    function runEnter(extensions: any[], schema: any, doc: any, pos: number) {
      const state = EditorState.create({ schema, doc, selection: TextSelection.create(doc, pos) });
      const figcaptionExt = extensions.find((ext: any) => ext.name === 'figcaption');
      const shortcuts = (figcaptionExt as any).config.addKeyboardShortcuts.call({
        options: (figcaptionExt as any).options,
      });
      let dispatchedTr: any = null;
      const editor = { state, view: { dispatch: (tr: any) => (dispatchedTr = tr) }, commands: {} };
      const handled = shortcuts.Enter({ editor });
      return { handled, dispatchedTr };
    }

    it('on a non-empty line, defers to the default splitBlock (returns false, no dispatch)', () => {
      const extensions = buildExtensions({ mediaLibrary: { figure: true } });
      const schema = getSchema(extensions);
      const doc = buildFigureDoc(schema, [
        { type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] },
      ]);
      const pos = endOf(doc, (n) => n.type.name === 'paragraph');

      const { handled, dispatchedTr } = runEnter(extensions, schema, doc, pos);
      expect(handled).toBe(false);
      expect(dispatchedTr).toBeNull();
    });

    it('on an empty trailing line (with text above it), exits and drops the empty paragraph', () => {
      const extensions = buildExtensions({ mediaLibrary: { figure: true } });
      const schema = getSchema(extensions);
      const doc = buildFigureDoc(schema, [
        { type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] },
        { type: 'paragraph' },
      ]);

      // cursor inside the second (empty) paragraph
      const emptyParagraphPos = endOf(
        doc,
        (n) => n.type.name === 'paragraph' && n.textContent === ''
      );

      const { handled, dispatchedTr } = runEnter(extensions, schema, doc, emptyParagraphPos);
      expect(handled).toBe(true);
      expect(dispatchedTr).not.toBeNull();

      const newDoc = dispatchedTr.doc;
      const figure = newDoc.firstChild!;
      const figcaption = figure.lastChild!;
      expect(figcaption.childCount).toBe(1);
      expect(figcaption.firstChild!.textContent).toBe('Hello');
      expect(newDoc.childCount).toBe(2);
      expect(newDoc.lastChild!.type.name).toBe('paragraph');
      expect(newDoc.lastChild!.content.size).toBe(0);
    });

    it('on a lone empty caption, exits but keeps the single paragraph (figcaption needs at least one)', () => {
      const extensions = buildExtensions({ mediaLibrary: { figure: true } });
      const schema = getSchema(extensions);
      const doc = buildFigureDoc(schema, [{ type: 'paragraph' }]);
      const pos = endOf(doc, (n) => n.type.name === 'paragraph');

      const { handled, dispatchedTr } = runEnter(extensions, schema, doc, pos);
      expect(handled).toBe(true);
      expect(dispatchedTr).not.toBeNull();

      const newDoc = dispatchedTr.doc;
      const figcaption = newDoc.firstChild!.lastChild!;
      expect(figcaption.childCount).toBe(1);
      expect(figcaption.firstChild!.content.size).toBe(0);
      expect(newDoc.childCount).toBe(2);
      expect(newDoc.lastChild!.type.name).toBe('paragraph');
    });
  });

  it('registers figure/figcaption inert (enableContentCheck) when mediaLibrary is false', () => {
    const extensions = buildExtensions({ mediaLibrary: false });
    const names = extensions.map((ext: any) => ext.name);
    const figure = extensions.find((ext: any) => ext.name === 'figure');
    const figcaption = extensions.find((ext: any) => ext.name === 'figcaption');

    expect(names).toContain('figure');
    expect(names).toContain('figcaption');
    expect((figure as any)?.options.enableContentCheck).toBe(true);
    expect((figcaption as any)?.options.enableContentCheck).toBe(true);
  });

  it('still includes image extension when mediaLibrary.figure is true', () => {
    const extensions = buildExtensions({ mediaLibrary: { figure: true } });
    const names = extensions.map((ext: any) => ext.name);

    expect(names).toContain('image');
  });

  it('always registers figure and figcaption together', () => {
    const extensions = buildExtensions({ mediaLibrary: { figure: true } });
    const names = extensions.map((ext: any) => ext.name);
    const hasFigure = names.includes('figure');
    const hasFigcaption = names.includes('figcaption');

    expect(hasFigure).toBe(hasFigcaption);
  });
});
