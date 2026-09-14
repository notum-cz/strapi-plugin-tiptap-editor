import { describe, it, expect, beforeEach, vi } from 'vitest';

// ─── Mock React ───────────────────────────────────────────────────────────────
vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');
  return {
    ...actual,
    useState: (initial: any) => [initial, vi.fn()],
    forwardRef: (fn: any) => fn,
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

// ─── Mock react-intl ──────────────────────────────────────────────────────────
vi.mock('react-intl', () => ({
  useIntl: () => ({
    formatMessage: ({ defaultMessage }: { id: string; defaultMessage: string }) => defaultMessage,
  }),
}));

// ─── Mock @tiptap/react ───────────────────────────────────────────────────────
vi.mock('@tiptap/react', () => ({
  NodeViewWrapper: 'NodeViewWrapper',
  NodeViewContent: 'NodeViewContent',
}));

// ─── Mock @strapi/design-system ───────────────────────────────────────────────
vi.mock('@strapi/design-system', () => ({
  Box: 'Box',
  Flex: 'Flex',
  IconButton: 'IconButton',
  Status: 'Status',
  Typography: 'Typography',
}));

// ─── Mock @strapi/icons ───────────────────────────────────────────────────────
vi.mock('@strapi/icons', () => ({
  Pencil: 'Pencil',
  Trash: 'Trash',
}));

// ─── Mock the dialog (its own module pulls in the whole form) ─────────────────
vi.mock('../../admin/src/components/ComponentDialog', () => ({
  default: 'ComponentDialog',
}));

// ─── Import the module under test ─────────────────────────────────────────────
import { GenericComponentNodeView } from '../../admin/src/components/ComponentNodeView';
import {
  clearRichTextComponents,
  registerRichTextComponent,
} from '../../admin/src/registry/richTextComponents';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function find(element: any, predicate: (node: any) => boolean): any | undefined {
  if (!element || typeof element !== 'object') return undefined;
  if (predicate(element)) return element;
  const children = element.props?.children;
  const childArray = Array.isArray(children) ? children : [children];
  for (const child of childArray) {
    const match = find(child, predicate);
    if (match) return match;
  }
  return undefined;
}

const byType = (type: string) => (node: any) => node.type === type;
const byLabel = (label: string) => (node: any) => node.props?.label === label;
const containsText = (type: string, text: string) => (node: any) =>
  node.type === type &&
  (Array.isArray(node.props?.children)
    ? node.props.children.join('')
    : String(node.props?.children ?? '')
  ).includes(text);

function buildProps(
  name: string,
  attrs: Record<string, unknown>,
  { enabled = true, selected = false } = {}
) {
  return {
    node: { type: { name }, attrs },
    extension: { options: { enabled, component: {} } },
    selected,
    updateAttributes: vi.fn(),
    deleteNode: vi.fn(),
  } as any;
}

beforeEach(() => {
  clearRichTextComponents();
  registerRichTextComponent({
    name: 'callout',
    label: 'Callout',
    content: 'block+',
    attributes: { tone: { default: 'info', form: { type: 'text', label: 'Tone' } } },
  });
  registerRichTextComponent({
    name: 'button',
    label: 'Button',
    attributes: {
      label: { default: '', form: { type: 'text', label: 'Label' } },
      href: { default: '', form: { type: 'url', label: 'URL' } },
    },
  });
});

describe('GenericComponentNodeView', () => {
  it('wraps the card in a node view tagged with the node name and selection state', () => {
    const tree = GenericComponentNodeView(
      buildProps('button', { label: 'Read more', href: '/docs' }, { selected: true })
    );
    expect(tree.type).toBe('NodeViewWrapper');
    expect(tree.props['data-type']).toBe('button');
    expect(tree.props['data-selected']).toBe(true);
  });

  it('leaves data-selected unset when the node is not selected', () => {
    const tree = GenericComponentNodeView(buildProps('button', { label: 'Read more' }));
    expect(tree.props['data-selected']).toBeUndefined();
  });

  it('renders a non-editable drag handle header', () => {
    const tree = GenericComponentNodeView(buildProps('button', { label: 'Read more' }));
    const header = find(tree, (node) => node.props?.['data-drag-handle'] !== undefined);
    expect(header).toBeDefined();
    expect(header.props.contentEditable).toBe(false);
  });

  it('offers Edit and Delete when the preset enables the component', () => {
    const tree = GenericComponentNodeView(buildProps('button', { label: 'Read more' }));
    expect(find(tree, byLabel('Edit component'))?.type).toBe('IconButton');
    expect(find(tree, byLabel('Delete component'))?.type).toBe('IconButton');
    expect(find(tree, containsText('Status', 'Read-only in this preset'))).toBeUndefined();
  });

  it('drops Edit and shows a read-only badge when the preset disables the component', () => {
    const tree = GenericComponentNodeView(
      buildProps('button', { label: 'Read more' }, { enabled: false })
    );
    expect(find(tree, byLabel('Edit component'))).toBeUndefined();
    expect(find(tree, byLabel('Delete component'))?.type).toBe('IconButton');
    expect(find(tree, containsText('Status', 'Read-only in this preset'))).toBeDefined();
  });

  it('renders an editable content slot for container components', () => {
    const tree = GenericComponentNodeView(buildProps('callout', { tone: 'info' }));
    expect(find(tree, byType('NodeViewContent'))).toBeDefined();
  });

  it('summarises the attributes of an atom component instead of a content slot', () => {
    const tree = GenericComponentNodeView(buildProps('button', { label: 'Read more', href: '/d' }));
    expect(find(tree, byType('NodeViewContent'))).toBeUndefined();
    expect(find(tree, containsText('Typography', 'Label: Read more · URL: /d'))).toBeDefined();
  });
});
