import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock React: hooks run as plain functions, elements become inspectable objects ──
vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');
  return {
    ...actual,
    useState: (init: any) => [typeof init === 'function' ? init() : init, vi.fn()],
    useMemo: (fn: () => any) => fn(),
    createElement: (type: any, props: any, ...children: any[]) => ({
      type,
      props: {
        ...props,
        children:
          children.length === 1 ? children[0] : children.length > 1 ? children : props?.children,
      },
    }),
  };
});

vi.mock('react-intl', () => ({
  useIntl: () => ({
    formatMessage: ({ defaultMessage }: { defaultMessage: string }) => defaultMessage,
  }),
}));
vi.mock('@tiptap/react', () => ({
  ReactNodeViewRenderer: vi.fn(),
  NodeViewWrapper: 'div',
  NodeViewContent: 'div',
}));
vi.mock('@strapi/design-system', () => ({ SimpleMenu: 'SimpleMenu', MenuItem: 'MenuItem' }));
vi.mock('@strapi/icons', () => ({ PuzzlePiece: 'PuzzlePiece' }));
vi.mock('../../admin/src/components/ComponentDialog', () => ({ default: 'ComponentDialog' }));
vi.mock('../../admin/src/components/ComponentNodeView', () => ({
  GenericComponentNodeView: 'GenericComponentNodeView',
}));

import { useRichTextComponents } from '../../admin/src/extensions/Components';
import {
  clearRichTextComponents,
  registerRichTextComponent,
} from '../../admin/src/registry/richTextComponents';

describe('useRichTextComponents menu', () => {
  beforeEach(() => {
    clearRichTextComponents();
    registerRichTextComponent({ name: 'button', label: 'Button', icon: 'ICON', attributes: {} });
  });

  it('passes the definition icon as startIcon so it sits inline with the label', () => {
    const { componentsMenu } = useRichTextComponents({} as any, {
      config: { components: { button: true } } as any,
    });
    const [item] = (componentsMenu as any).props.children;
    expect(item.type).toBe('MenuItem');
    expect(item.props.startIcon).toBe('ICON');
    expect(item.props.children).toBe('Button');
  });
});
