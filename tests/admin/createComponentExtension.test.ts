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
vi.mock('../../admin/src/components/InlineComponentNodeView', () => ({
  InlineComponentNodeView: 'InlineComponentNodeView',
}));

// ─── Import the modules under test ────────────────────────────────────────────
import { getSchema } from '@tiptap/core';
import { EditorState } from '@tiptap/pm/state';
import { Transform } from '@tiptap/pm/transform';
import { ReactNodeViewRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
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
const inline = defineRichTextComponent({
  name: 'badge',
  label: 'Badge',
  inline: true,
  attributes: { tone: { default: 'info' } },
});
const ctx = { enabled: true, options: { x: 1 } };

describe('createComponentExtension inline', () => {
  it('builds a selectable inline atom that takes no marks and is not draggable', () => {
    const ext = createComponentExtension(inline, ctx) as any;
    expect(ext.name).toBe('badge');
    expect(ext.config.group).toBe('inline');
    expect(ext.config.inline).toBe(true);
    expect(ext.config.atom).toBe(true);
    expect(ext.config.marks).toBe('');
    expect(ext.config.draggable).toBe(false);
    expect(ext.config.selectable).toBe(true);
  });

  it('renders and parses a span carrying the data attributes', () => {
    const ext = createComponentExtension(inline, ctx) as any;
    expect(ext.config.parseHTML()).toStrictEqual([{ tag: 'span[data-type="badge"]' }]);
    const html = ext.config.renderHTML({ HTMLAttributes: { 'data-tone': 'warn' } });
    expect(html).toStrictEqual(['span', { 'data-type': 'badge', 'data-tone': 'warn' }]);
    expect(ext.config.addAttributes().tone.renderHTML({ tone: 'warn' })).toStrictEqual({
      'data-tone': 'warn',
    });
  });

  it('uses the inline node view', () => {
    const ext = createComponentExtension(inline, ctx) as any;
    expect(ext.config.addNodeView()).toBe('nodeview');
    expect(ReactNodeViewRenderer).toHaveBeenCalledWith('InlineComponentNodeView');
  });

  it('is accepted inside paragraphs and refused at document level', () => {
    const schema = getSchema([StarterKit, createComponentExtension(inline, ctx)]);
    const badge = schema.nodes.badge;
    expect(badge.isInline).toBe(true);
    expect(badge.isAtom).toBe(true);
    expect(schema.nodes.paragraph.contentMatch.matchType(badge)).toBeTruthy();
    expect(schema.nodes.doc.contentMatch.matchType(badge)).toBeNull();
  });

  // `marks: ''` only governs a node's children, so a mark applied over a selection that spans
  // the atom still lands on it. The appended transaction is what keeps the stored JSON clean.
  it('strips a mark applied across the node and keeps it on the text around it', () => {
    const ext = createComponentExtension(inline, ctx) as any;
    const schema = getSchema([StarterKit, ext]);
    const doc = schema.nodes.doc.create(null, [
      schema.nodes.paragraph.create(null, [
        schema.text('Trust Score '),
        schema.nodes.badge.create({ tone: 'warn' }),
        schema.text(' helps'),
      ]),
    ]);
    const state = EditorState.create({ schema, doc, plugins: ext.config.addProseMirrorPlugins() });
    const link = schema.marks.link.create({ href: '/trust' });
    const next = state.apply(state.tr.addMark(0, doc.content.size, link));

    const [text, badge, tail] = next.doc.firstChild!.content.content;
    expect(text.marks.map((m) => m.type.name)).toStrictEqual(['link']);
    expect(badge.type.name).toBe('badge');
    expect(badge.marks).toHaveLength(0);
    expect(tail.marks.map((m) => m.type.name)).toStrictEqual(['link']);
  });

  it('wraps an inline node in a paragraph when inserted at a block boundary', () => {
    const schema = getSchema([StarterKit, createComponentExtension(inline, ctx)]);
    const doc = schema.nodes.doc.createAndFill()!;
    const tr = new Transform(doc).replaceWith(
      0,
      doc.content.size,
      schema.nodes.badge.create({ tone: 'warn' })
    );
    // `toEqual`, not `toStrictEqual`: ProseMirror's toJSON output carries no Object prototype.
    expect(tr.doc.toJSON()).toEqual({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'badge', attrs: { tone: 'warn' } }] }],
    });
  });
});

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

    // A string under a null default is json-quoted so a numeric-looking one stays a string.
    expect(attrs.slug.renderHTML({ slug: '12' })).toStrictEqual({ 'data-slug': '"12"' });
    expect(attrs.slug.parseHTML(elementWith('data-slug', '"12"'))).toBe('12');
    // Unquoted strings (older clipboard HTML) are still read verbatim.
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
  const headings = defineRichTextComponent({
    name: 'titled',
    label: 'Titled',
    content: 'heading+',
    attributes: {},
  });
  const schema = getSchema([
    StarterKit,
    createComponentExtension(atom, ctx),
    createComponentExtension(container, ctx),
    createComponentExtension(headings, ctx),
  ]);
  const makeEditor = () => {
    const run = vi.fn(() => true);
    const insertContent = vi.fn(() => ({ run }));
    const editor = { schema, chain: () => ({ focus: () => ({ insertContent }) }) } as any;
    return { editor, insertContent };
  };

  it('inserts a paragraph child for containers and no content for atoms', () => {
    const { editor, insertContent } = makeEditor();

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

  it('fills a container whose content expression does not accept a paragraph', () => {
    const { editor, insertContent } = makeEditor();
    insertRichTextComponent(editor, headings, {});
    const [inserted] = insertContent.mock.calls[0] as any[];
    expect(inserted.type).toBe('titled');
    expect(inserted.content).toHaveLength(1);
    expect(inserted.content[0].type).toBe('heading');
    expect(() => schema.nodeFromJSON(inserted).check()).not.toThrow();
  });
});
