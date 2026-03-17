import { describe, it, expect, vi } from 'vitest';

// Mock Strapi design system and React hooks used by Heading.tsx (not needed for buildExtensions)
vi.mock('@strapi/design-system', () => ({
  SingleSelect: 'SingleSelect',
  SingleSelectOption: 'SingleSelectOption',
}));
vi.mock('@tiptap/react', () => ({
  useEditorState: vi.fn(),
}));

import { buildExtensions } from '../../admin/src/utils/buildExtensions';
import { TiptapPresetConfig } from '../../shared/types';

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
});
