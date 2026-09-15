import { describe, it, expect, vi } from 'vitest';

// ─── Mock React ───────────────────────────────────────────────────────────────
vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');
  const overrides = {
    useState: (initial: any) => [typeof initial === 'function' ? initial() : initial, vi.fn()],
    useEffect: () => {},
    createElement: (type: any, props: any, ...children: any[]) => ({
      type,
      props: {
        ...props,
        children:
          children.length === 1 ? children[0] : children.length > 1 ? children : props?.children,
      },
    }),
  };
  // The dialog uses the default import (`React.useState`), so the default export needs the overrides too.
  return { ...actual, ...overrides, default: { ...actual.default, ...overrides } };
});

// ─── Mock react-intl ──────────────────────────────────────────────────────────
vi.mock('react-intl', () => ({
  useIntl: () => ({
    formatMessage: ({ defaultMessage }: { id: string; defaultMessage: string }) => defaultMessage,
  }),
}));

// ─── Mock @strapi/design-system ───────────────────────────────────────────────
vi.mock('@strapi/design-system', () => ({
  Button: 'Button',
  Dialog: {
    Root: 'Dialog.Root',
    Content: 'Dialog.Content',
    Header: 'Dialog.Header',
    Body: 'Dialog.Body',
    Footer: 'Dialog.Footer',
    Cancel: 'Dialog.Cancel',
    Action: 'Dialog.Action',
  },
}));

// ─── Mock the generated form (pulls in every design-system input) ─────────────
vi.mock('../../admin/src/components/ComponentAttributeForm', () => ({
  default: 'ComponentAttributeForm',
}));

// ─── Import the module under test ─────────────────────────────────────────────
import { ComponentDialog } from '../../admin/src/components/ComponentDialog';
import type { AnyRichTextComponentDefinition } from '../../admin/src/registry/types';

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

const CustomForm = () => null;

function render(definition: AnyRichTextComponentDefinition) {
  return (ComponentDialog as any)({
    open: true,
    mode: 'insert',
    definition,
    options: {},
    initialAttrs: {},
    onClose: vi.fn(),
    onSubmit: vi.fn(),
  });
}

const base: AnyRichTextComponentDefinition = {
  name: 'table',
  label: 'Table',
  attributes: { rows: { default: 1, form: { type: 'number', label: 'Rows' } } },
};

describe('ComponentDialog width', () => {
  it('sizes the content from dialog.width when the definition has its own form', () => {
    const tree = render({ ...base, form: CustomForm, dialog: { width: 'min(80rem, 95vw)' } });
    const content = find(tree, byType('Dialog.Content'));
    expect(content.props.style).toStrictEqual({ width: 'min(80rem, 95vw)', maxWidth: 'min(80rem, 95vw)' });
    expect(find(tree, byType('Dialog.Body')).props.style).toBeUndefined();
  });

  it('leaves the content unstyled when dialog.width is not set', () => {
    const tree = render({ ...base, form: CustomForm });
    expect(find(tree, byType('Dialog.Content')).props.style).toBeUndefined();
    expect(find(tree, byType(CustomForm as any))).toBeDefined();
  });

  it('ignores dialog.width for the generated form', () => {
    const tree = render({ ...base, dialog: { width: '80rem' } });
    expect(find(tree, byType('Dialog.Content')).props.style).toBeUndefined();
    expect(find(tree, byType('ComponentAttributeForm'))).toBeDefined();
  });

  it('lets the body scroll instead of overflowing the clipped content', () => {
    const body = find(render({ ...base, form: CustomForm }), byType('Dialog.Body'));
    expect(body.props.overflow).toBe('auto');
    expect(body.props.maxHeight).toBeDefined();
  });
});
