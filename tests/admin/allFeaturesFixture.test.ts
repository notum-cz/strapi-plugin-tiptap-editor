import { describe, it, expect, vi } from 'vitest';

// Guards stored content against dependency updates (Tiptap/ProseMirror):
// the full preset must still accept every node, mark and attribute in the fixture.
vi.mock('@strapi/strapi/admin', () => ({ useFetchClient: () => ({ get: vi.fn() }) }));
vi.mock('@strapi/design-system', () => ({}));
vi.mock('@strapi/icons', () => ({}));
vi.mock('react-intl', () => ({ useIntl: () => ({ formatMessage: (m: any) => m.defaultMessage }) }));
vi.mock('@tiptap/react', () => ({
  useEditorState: vi.fn(),
  ReactNodeViewRenderer: vi.fn(() => 'nodeview'),
  NodeViewWrapper: 'div',
  NodeViewContent: 'div',
}));
vi.mock('../../admin/src/components/ComponentDialog', () => ({ default: 'ComponentDialog' }));
vi.mock('../../admin/src/components/ComponentNodeView', () => ({
  GenericComponentNodeView: 'GenericComponentNodeView',
}));

import { getSchema } from '@tiptap/core';
import { buildExtensions } from '../../admin/src/utils/buildExtensions';
import {
  defineRichTextComponent,
  registerRichTextComponent,
} from '../../admin/src/registry/richTextComponents';
import preset from '../../fixtures/all-features-preset.json';
import payload from '../../fixtures/all-features-payload.json';

registerRichTextComponent(
  defineRichTextComponent({
    name: 'button',
    label: 'Button',
    attributes: {
      label: { default: '' },
      href: { default: '' },
      variant: { default: 'primary' },
      openInNewTab: { default: false },
    },
  })
);

describe('all-features fixture', () => {
  const schema = getSchema(buildExtensions(preset.presets.full as any));

  it('parses into a valid document', () => {
    expect(() => schema.nodeFromJSON(payload).check()).not.toThrow();
  });

  it('round-trips without dropping nodes, marks or attributes', () => {
    // ProseMirror reorders marks by schema rank, so compare them order-independently.
    const sortMarks = (n: any): any => ({
      ...n,
      ...(n.marks && { marks: [...n.marks].sort((a, b) => a.type.localeCompare(b.type)) }),
      ...(n.content && { content: n.content.map(sortMarks) }),
    });
    expect(sortMarks(schema.nodeFromJSON(payload).toJSON())).toMatchObject(sortMarks(payload));
  });
});
