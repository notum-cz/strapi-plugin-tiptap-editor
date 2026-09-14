import { describe, it, expect, vi } from 'vitest';

// ─── Mock react-intl ──────────────────────────────────────────────────────────
vi.mock('react-intl', () => ({
  useIntl: () => ({
    formatMessage: ({ defaultMessage }: { id: string; defaultMessage: string }) => defaultMessage,
  }),
}));

// ─── Mock @tiptap/react (@tiptap/core stays real: the schema is built for real) ──
vi.mock('@tiptap/react', () => ({
  ReactNodeViewRenderer: vi.fn(() => 'nodeview'),
  NodeViewWrapper: 'div',
  NodeViewContent: 'div',
  useEditor: vi.fn(),
  useEditorState: vi.fn(),
}));

// ─── Mock Strapi packages ─────────────────────────────────────────────────────
vi.mock('@strapi/strapi/admin', () => ({ useField: vi.fn() }));
vi.mock('@strapi/design-system', () => ({ SimpleMenu: 'SimpleMenu', MenuItem: 'MenuItem' }));
vi.mock('@strapi/icons', () => ({ PuzzlePiece: 'PuzzlePiece' }));

// ─── Mock the React parts pulled in through the node view ─────────────────────
vi.mock('../../admin/src/components/ComponentDialog', () => ({ default: 'ComponentDialog' }));
vi.mock('../../admin/src/components/ComponentNodeView', () => ({
  GenericComponentNodeView: 'GenericComponentNodeView',
}));

// ─── Import the modules under test ────────────────────────────────────────────
import { getSchema } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { createComponentExtension } from '../../admin/src/extensions/Components';
import { defineRichTextComponent } from '../../admin/src/registry/richTextComponents';
import { prepareEditorContent } from '../../admin/src/utils/tiptapUtils';

// ─── Fixtures ─────────────────────────────────────────────────────────────────
const button = defineRichTextComponent({
  name: 'button',
  label: 'Button',
  attributes: { label: { default: '' }, href: { default: '' } },
});
const schema = getSchema([
  StarterKit,
  createComponentExtension(button, { enabled: true, options: {} }),
]);

const paragraph = (text: string) => ({ type: 'paragraph', content: [{ type: 'text', text }] });

describe('prepareEditorContent', () => {
  it('keeps a document with a registered component intact', () => {
    const doc = {
      type: 'doc',
      content: [paragraph('before'), { type: 'button', attrs: { label: 'Go', href: '/' } }],
    };
    const result = prepareEditorContent(JSON.stringify(doc), schema);

    expect(result.content).toEqual(doc);
    expect(result.unknownNodeTypes).toEqual([]);
    expect(result.unknownMarkTypes).toEqual([]);
    expect(() => schema.nodeFromJSON(result.content)).not.toThrow();
  });

  it('removes only an unregistered component and reports it', () => {
    const doc = {
      type: 'doc',
      content: [paragraph('before'), { type: 'callout', attrs: { tone: 'info' } }, paragraph('after')],
    };
    // The unsanitized document is exactly what blanks the editor.
    expect(() => schema.nodeFromJSON(doc)).toThrow();

    const result = prepareEditorContent(doc, schema);

    expect(result.content).toEqual({
      type: 'doc',
      content: [paragraph('before'), paragraph('after')],
    });
    expect(result.unknownNodeTypes).toEqual(['callout']);
    expect(() => schema.nodeFromJSON(result.content)).not.toThrow();
  });

  it('still yields the malformed-content fallback for unparseable JSON', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = prepareEditorContent('{not json', schema);
    spy.mockRestore();

    expect(result.content.type).toBe('doc');
    expect(JSON.stringify(result.content)).toContain("content is malformed");
    expect(result.unknownNodeTypes).toEqual([]);
  });

  it('uses the default value for an empty field', () => {
    const result = prepareEditorContent('', schema, 'hello');
    expect(result.content).toEqual({ type: 'doc', content: [paragraph('hello')] });
  });
});
