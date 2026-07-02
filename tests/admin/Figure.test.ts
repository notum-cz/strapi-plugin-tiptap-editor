import { describe, it, expect, vi } from 'vitest';

vi.mock('@tiptap/react', () => ({
  ReactNodeViewRenderer: vi.fn((component) => component),
  NodeViewWrapper: 'div',
  NodeViewContent: 'div',
}));
vi.mock('react-intl', () => ({
  useIntl: vi.fn(() => ({
    formatMessage: (msg: { defaultMessage: string }) => msg.defaultMessage,
  })),
}));

import { Figure, Figcaption } from '../../admin/src/extensions/Figure';

describe('Figure extension', () => {
  it("extension name is 'figure'", () => {
    expect(Figure.name).toBe('figure');
  });

  it('is draggable when the feature is enabled', () => {
    const draggable = (Figure as any).config.draggable.call({
      options: { enableContentCheck: false },
    });
    expect(draggable).toBe(true);
  });

  it('is not draggable when enableContentCheck is on (feature administratively disabled)', () => {
    const draggable = (Figure as any).config.draggable.call({
      options: { enableContentCheck: true },
    });
    expect(draggable).toBe(false);
  });

  it('is isolating', () => {
    expect((Figure as any).config.isolating).toBe(true);
  });

  it("content is 'image figcaption'", () => {
    expect((Figure as any).config.content).toBe('image figcaption');
  });

  it("group is 'block'", () => {
    expect((Figure as any).config.group).toBe('block');
  });

  describe('parseHTML', () => {
    const parseHTML = (Figure as any).config.parseHTML as () => Array<{ tag: string }>;
    const rules = parseHTML();

    it('parses <figure> tag', () => {
      expect(rules).toEqual(expect.arrayContaining([{ tag: 'figure' }]));
    });
  });

  describe('renderHTML', () => {
    const renderHTML = (Figure as any).config.renderHTML as (args: {
      HTMLAttributes: Record<string, unknown>;
    }) => unknown[];

    it('renders as <figure> element', () => {
      const result = renderHTML({ HTMLAttributes: {} });
      expect(result[0]).toBe('figure');
    });

    it('includes a hole (0) for content', () => {
      const result = renderHTML({ HTMLAttributes: {} });
      expect(result[result.length - 1]).toBe(0);
    });
  });

  describe('addCommands', () => {
    it('defines wrapImageInFigure command', () => {
      const commands = (Figure as any).config.addCommands?.call({
        options: { enableContentCheck: false },
      });
      expect(typeof commands?.wrapImageInFigure).toBe('function');
    });

    it('defines removeFigureCaption command', () => {
      const commands = (Figure as any).config.addCommands?.call({
        options: { enableContentCheck: false },
      });
      expect(typeof commands?.removeFigureCaption).toBe('function');
    });

    it('wrapImageInFigure returns false when the selection is not next to an image', () => {
      const commands = (Figure as any).config.addCommands?.call({
        options: { enableContentCheck: false },
      });
      const commandFn = commands.wrapImageInFigure()({
        state: {
          selection: { $from: { nodeAfter: null, nodeBefore: null } },
        },
        dispatch: undefined,
      });
      expect(commandFn).toBe(false);
    });

    it('removeFigureCaption returns false when not inside a figure', () => {
      const commands = (Figure as any).config.addCommands?.call({
        options: { enableContentCheck: false },
      });
      const commandFn = commands.removeFigureCaption()({
        state: {
          selection: {
            $from: { depth: 1, node: (_d: number) => ({ type: { name: 'paragraph' } }) },
          },
        },
        dispatch: undefined,
      });
      expect(commandFn).toBe(false);
    });
  });
});

describe('Figcaption extension', () => {
  it("extension name is 'figcaption'", () => {
    expect(Figcaption.name).toBe('figcaption');
  });

  it("content is 'paragraph+' (same as blockquote — plain paragraphs, no custom nodes)", () => {
    expect((Figcaption as any).config.content).toBe('paragraph+');
  });

  it('is not selectable', () => {
    expect((Figcaption as any).config.selectable).toBe(false);
  });

  it('is not draggable', () => {
    expect((Figcaption as any).config.draggable).toBe(false);
  });

  describe('parseHTML', () => {
    const parseHTML = (Figcaption as any).config.parseHTML as () => Array<{ tag: string }>;
    const rules = parseHTML();

    it('parses <figcaption> tag', () => {
      expect(rules).toEqual(expect.arrayContaining([{ tag: 'figcaption' }]));
    });
  });

  describe('renderHTML', () => {
    const renderHTML = (Figcaption as any).config.renderHTML as (args: {
      HTMLAttributes: Record<string, unknown>;
    }) => unknown[];

    it('renders as <figcaption> element', () => {
      const result = renderHTML({ HTMLAttributes: {} });
      expect(result[0]).toBe('figcaption');
    });

    it('includes a hole (0) for content', () => {
      const result = renderHTML({ HTMLAttributes: {} });
      expect(result[result.length - 1]).toBe(0);
    });
  });

  describe('addKeyboardShortcuts', () => {
    it('defines Enter shortcut', () => {
      const shortcuts = (Figcaption as any).config.addKeyboardShortcuts?.call({ editor: null });
      expect(typeof shortcuts?.Enter).toBe('function');
    });

    it('defines Backspace shortcut', () => {
      const shortcuts = (Figcaption as any).config.addKeyboardShortcuts?.call({ editor: null });
      expect(typeof shortcuts?.Backspace).toBe('function');
    });
  });
});
