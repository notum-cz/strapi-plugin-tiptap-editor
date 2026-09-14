import { describe, it, expect, vi } from 'vitest';

// ─── Mock react-intl ──────────────────────────────────────────────────────────
vi.mock('react-intl', () => ({
  useIntl: () => ({
    formatMessage: ({ defaultMessage }: { id: string; defaultMessage: string }) => defaultMessage,
  }),
}));

// ─── Mock @tiptap/react (@tiptap/core stays real: the tests read the node config) ──
vi.mock('@tiptap/react', () => ({
  ReactNodeViewRenderer: vi.fn(() => 'nodeview'),
  NodeViewWrapper: 'div',
  NodeViewContent: 'div',
  useEditorState: vi.fn(),
}));

// ─── Mock @strapi/design-system and @strapi/icons ─────────────────────────────
vi.mock('@strapi/design-system', () => ({
  SimpleMenu: 'SimpleMenu',
  MenuItem: 'MenuItem',
}));
vi.mock('@strapi/icons', () => ({ PuzzlePiece: 'PuzzlePiece' }));

// ─── Mock the React parts pulled in through the node view ─────────────────────
vi.mock('../../admin/src/components/ComponentDialog', () => ({ default: 'ComponentDialog' }));
vi.mock('../../admin/src/components/ComponentNodeView', () => ({
  GenericComponentNodeView: 'GenericComponentNodeView',
}));

// ─── Import the modules under test ────────────────────────────────────────────
import { ReactNodeViewRenderer } from '@tiptap/react';
import {
  createComponentExtension,
  insertRichTextComponent,
  richTextHelpers,
} from '../../admin/src/extensions/Components';
import { defineRichTextComponent } from '../../admin/src/registry/richTextComponents';

// ─── Fixtures ─────────────────────────────────────────────────────────────────
const atom = defineRichTextComponent({
  name: 'button',
  label: 'Button',
  attributes: { href: { default: '' }, openInNewTab: { default: false } },
});
const container = defineRichTextComponent({
  name: 'callout',
  label: 'Callout',
  content: 'block+',
  attributes: { tone: { default: 'info' } },
});
const ctx = { enabled: true, options: { x: 1 } };

describe('createComponentExtension', () => {
  it('names the node after the schema and makes atoms atomic block nodes', () => {
    const ext = createComponentExtension(atom, ctx) as any;
    expect(ext.name).toBe('button');
    expect(ext.config.group).toBe('block');
    expect(ext.config.atom).toBe(true);
    expect(ext.config.content).toBeUndefined();
    expect(ext.config.draggable).toBe(true);
    expect(ext.config.selectable).toBe(true);
  });

  it('keeps the content expression for containers and marks them non-atomic', () => {
    const ext = createComponentExtension(container, ctx) as any;
    expect(ext.name).toBe('callout');
    expect(ext.config.content).toBe('block+');
    expect(ext.config.atom).toBe(false);
  });

  it('exposes enabled and options through addOptions', () => {
    const ext = createComponentExtension(atom, ctx) as any;
    expect(ext.config.addOptions()).toStrictEqual({ enabled: true, component: { x: 1 } });
  });

  it('declares one attribute per schema attribute with its default', () => {
    const ext = createComponentExtension(atom, ctx) as any;
    const attrs = ext.config.addAttributes();
    expect(Object.keys(attrs)).toStrictEqual(['href', 'openInNewTab']);
    expect(attrs.href.default).toBe('');
    expect(attrs.openInNewTab.default).toBe(false);
  });

  it('renders attributes as data-* and parses them back by default type', () => {
    const ext = createComponentExtension(atom, ctx) as any;
    const attrs = ext.config.addAttributes();
    expect(attrs.openInNewTab.renderHTML({ openInNewTab: true })).toStrictEqual({
      'data-open-in-new-tab': 'true',
    });
    expect(attrs.href.renderHTML({ href: null })).toStrictEqual({});
    const el = {
      getAttribute: (n: string) => (n === 'data-open-in-new-tab' ? 'true' : null),
    } as unknown as HTMLElement;
    expect(attrs.openInNewTab.parseHTML(el)).toBe(true);
    expect(attrs.href.parseHTML(el)).toBe('');
  });

  it('round-trips null and null-defaulted attributes through data-* attributes', () => {
    const nullable = defineRichTextComponent({
      name: 'card',
      label: 'Card',
      attributes: { count: { default: null }, slug: { default: null } },
    });
    const attrs = (createComponentExtension(nullable, ctx) as any).config.addAttributes();
    const elementWith = (name: string, value: string) =>
      ({ getAttribute: (n: string) => (n === name ? value : null) }) as unknown as HTMLElement;

    // A cleared value must stay cleared: omitting the attribute would restore the schema default.
    expect(attrs.count.renderHTML({ count: null })).toStrictEqual({ 'data-count': 'null' });
    expect(attrs.count.parseHTML(elementWith('data-count', 'null'))).toBe(null);
    expect(attrs.count.parseHTML(elementWith('data-count', '3'))).toBe(3);

    // A string under a null default is written raw, so it must come back raw and not as the default.
    expect(attrs.slug.renderHTML({ slug: '/x' })).toStrictEqual({ 'data-slug': '/x' });
    expect(attrs.slug.parseHTML(elementWith('data-slug', '/x'))).toBe('/x');
  });

  it('parses div[data-type] and renders a data-type div, with a content hole only for containers', () => {
    const ext = createComponentExtension(atom, ctx) as any;
    expect(ext.config.parseHTML()).toStrictEqual([{ tag: 'div[data-type="button"]' }]);
    expect(ext.config.renderHTML({ HTMLAttributes: { 'data-href': '/x' } })).toStrictEqual([
      'div',
      { 'data-type': 'button', 'data-href': '/x' },
    ]);
    const containerExt = createComponentExtension(container, ctx) as any;
    expect(containerExt.config.renderHTML({ HTMLAttributes: {} })).toStrictEqual([
      'div',
      { 'data-type': 'callout' },
      0,
    ]);
  });

  it('renders the generic card as the node view', () => {
    const ext = createComponentExtension(atom, ctx) as any;
    expect(ext.config.addNodeView()).toBe('nodeview');
    expect(ReactNodeViewRenderer).toHaveBeenCalledWith('GenericComponentNodeView');
  });

  it('uses the escape-hatch extension when the definition provides one', () => {
    const custom = { name: 'custom' };
    const factory = vi.fn(() => custom);
    const ext = createComponentExtension(
      { ...atom, name: 'custom', extension: factory } as any,
      ctx
    );
    expect(ext).toBe(custom);
    expect(factory).toHaveBeenCalledWith(richTextHelpers, ctx);
    expect(Object.keys(richTextHelpers).sort()).toStrictEqual([
      'Extension',
      'Mark',
      'Node',
      'NodeViewContent',
      'NodeViewWrapper',
      'ReactNodeViewRenderer',
      'mergeAttributes',
    ]);
  });
});

describe('insertRichTextComponent', () => {
  it('inserts a paragraph child for containers and no content for atoms', () => {
    const run = vi.fn(() => true);
    const insertContent = vi.fn(() => ({ run }));
    const editor = { chain: () => ({ focus: () => ({ insertContent }) }) } as any;

    expect(insertRichTextComponent(editor, container, { tone: 'info' })).toBe(true);
    expect(insertContent).toHaveBeenCalledWith({
      type: 'callout',
      attrs: { tone: 'info' },
      content: [{ type: 'paragraph' }],
    });

    insertRichTextComponent(editor, atom, { href: '/x', openInNewTab: false });
    expect(insertContent).toHaveBeenLastCalledWith({
      type: 'button',
      attrs: { href: '/x', openInNewTab: false },
    });
  });
});
