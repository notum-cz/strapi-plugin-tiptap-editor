import { describe, it, expect, beforeEach, vi } from 'vitest';

// The node views' only state is `editing`; tests flip it to mount the dialog.
const state = vi.hoisted(() => ({ editing: false }));

// ─── Mock React ───────────────────────────────────────────────────────────────
vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');
  return {
    ...actual,
    useState: () => [state.editing, vi.fn()],
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
    formatMessage: (
      { defaultMessage }: { id: string; defaultMessage: string },
      values?: Record<string, string>
    ) => defaultMessage.replace(/\{(\w+)\}/g, (_, key) => values?.[key] ?? ''),
  }),
}));

// ─── Mock @tiptap/react ───────────────────────────────────────────────────────
vi.mock('@tiptap/react', () => ({
  NodeViewWrapper: 'NodeViewWrapper',
  NodeViewContent: 'NodeViewContent',
}));

// ─── Mock @strapi/design-system ───────────────────────────────────────────────
vi.mock('@strapi/design-system', () => ({
  Typography: 'Typography',
}));

// ─── Mock the dialog (its own module pulls in the whole form) ─────────────────
vi.mock('../../admin/src/components/ComponentDialog', () => ({
  default: 'ComponentDialog',
}));

// ─── Mock the theme palette ───────────────────────────────────────────────────
const PALETTE = [{ label: 'Primary', color: 'var(--color-primary)' }];
vi.mock('../../admin/src/hooks/useThemeConfig', () => ({
  useThemeConfig: () => ({ colors: PALETTE }),
}));

// ─── Import the module under test ─────────────────────────────────────────────
import { InlineComponentNodeView } from '../../admin/src/components/InlineComponentNodeView';
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

function buildProps({ enabled = true, selected = false } = {}) {
  return {
    node: { type: { name: 'badge' }, attrs: { tone: 'warn' } },
    extension: { options: { enabled, component: {} } },
    selected,
    updateAttributes: vi.fn(),
    deleteNode: vi.fn(),
  } as any;
}

function register(extra: Record<string, unknown> = {}) {
  registerRichTextComponent({
    name: 'badge',
    label: 'Badge',
    inline: true,
    icon: 'BadgeIcon',
    attributes: { tone: { default: 'info', form: { type: 'text', label: 'Tone' } } },
    ...extra,
  } as any);
}

beforeEach(() => {
  state.editing = false;
  clearRichTextComponents();
  register();
});

describe('InlineComponentNodeView', () => {
  it('renders a span wrapper with the type and selected markers', () => {
    const tree = InlineComponentNodeView(buildProps({ selected: true }));
    expect(tree.type).toBe('NodeViewWrapper');
    expect(tree.props.as).toBe('span');
    expect(tree.props.className).toBe('rich-text-component rich-text-component--inline');
    expect(tree.props['data-type']).toBe('badge');
    expect(tree.props['data-selected']).toBe(true);
    expect(tree.props.contentEditable).toBe(false);
  });

  it('leaves data-selected unset when the node is not selected', () => {
    expect(InlineComponentNodeView(buildProps()).props['data-selected']).toBeUndefined();
  });

  it('shows the icon and label chip when the definition has no preview', () => {
    const tree = InlineComponentNodeView(buildProps());
    const button = find(tree, byType('button'));
    expect(button.props.type).toBe('button');
    expect(button.props['aria-label']).toBe('Edit Badge');
    expect(button.props.title).toBe('Badge · Tone: warn');
    expect(button.props.disabled).toBe(false);
    expect(
      find(button, (node) => Array.isArray(node.props?.children) && node.props.children.includes('BadgeIcon'))
    ).toBeDefined();
    expect(find(button, byType('Typography'))?.props.children).toBe('Badge');
  });

  it('renders the definition preview with attrs instead of the chip', () => {
    register({ preview: 'BadgePreview' });
    const tree = InlineComponentNodeView(buildProps({ selected: true }));
    const preview = find(tree, byType('BadgePreview'));
    expect(preview.props.attrs).toStrictEqual({ tone: 'warn' });
    expect(preview.props.enabled).toBe(true);
    expect(preview.props.selected).toBe(true);
    expect(preview.props.colors).toStrictEqual(PALETTE);
    expect(preview.props.children).toBeUndefined();
    expect(find(tree, byType('Typography'))).toBeUndefined();
  });

  it('disables the button when the preset does not enable the component', () => {
    const button = find(InlineComponentNodeView(buildProps({ enabled: false })), byType('button'));
    expect(button.props.disabled).toBe(true);
  });

  it('mounts the edit dialog only while editing, with the node attrs', () => {
    expect(find(InlineComponentNodeView(buildProps()), byType('ComponentDialog'))).toBeUndefined();
    state.editing = true;
    const dialog = find(InlineComponentNodeView(buildProps()), byType('ComponentDialog'));
    expect(dialog.props.mode).toBe('edit');
    expect(dialog.props.open).toBe(true);
    expect(dialog.props.initialAttrs).toStrictEqual({ tone: 'warn' });
  });

  it('falls back to the node name when nothing registered the component', () => {
    clearRichTextComponents();
    const tree = InlineComponentNodeView(buildProps());
    const button = find(tree, byType('button'));
    expect(button.props.disabled).toBe(true);
    expect(find(button, byType('Typography'))?.props.children).toBe('badge');
    expect(find(tree, byType('ComponentDialog'))).toBeUndefined();
  });
});
