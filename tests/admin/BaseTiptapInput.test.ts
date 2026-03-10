import { describe, it, expect, vi } from 'vitest';

// ─── Mock React ───────────────────────────────────────────────────────────────
vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');
  return {
    ...actual,
    forwardRef: (fn: any) => fn,
    createElement: (type: any, props: any, ...children: any[]) => ({
      type,
      props: {
        ...props,
        children: children.length === 1 ? children[0] : children.length > 1 ? children : props?.children,
      },
    }),
  };
});

// ─── Mock @strapi/design-system ───────────────────────────────────────────────
vi.mock('@strapi/design-system', () => ({
  Box: 'Box',
  Field: {
    Root: 'Field.Root',
    Label: 'Field.Label',
    Hint: 'Field.Hint',
    Error: 'Field.Error',
  },
  Flex: 'Flex',
  Status: 'Status',
  Typography: 'Typography',
}));

// ─── Mock @tiptap/react ───────────────────────────────────────────────────────
vi.mock('@tiptap/react', () => ({
  EditorContent: 'EditorContent',
}));

// ─── Mock @strapi/strapi/admin ────────────────────────────────────────────────
vi.mock('@strapi/strapi/admin', () => ({
  useField: vi.fn(() => ({ value: '', onChange: vi.fn() })),
}));

// ─── Mock TiptapInputStyles ────────────────────────────────────────────────────
vi.mock('../../admin/src/components/TiptapInputStyles', () => ({
  TiptapInputStyles: 'TiptapInputStyles',
}));

// ─── Import the module under test ─────────────────────────────────────────────
import BaseTiptapInput from '../../admin/src/components/BaseTiptapInput';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function findElements(element: any, type: any): any[] {
  if (!element || typeof element !== 'object') return [];
  const results: any[] = [];
  if (element.type === type) results.push(element);
  const children = element.props?.children;
  if (children) {
    const childArray = Array.isArray(children) ? children : [children];
    for (const child of childArray) {
      results.push(...findElements(child, type));
    }
  }
  return results;
}

function findTextContent(element: any, text: string): boolean {
  if (!element || typeof element !== 'object') return false;
  if (typeof element === 'string') return element.includes(text);
  const children = element.props?.children;
  if (!children) return false;
  if (typeof children === 'string') return children.includes(text);
  const childArray = Array.isArray(children) ? children : [children];
  return childArray.some(child => findTextContent(child, text));
}

describe('BaseTiptapInput', () => {
  const mockEditor = { id: 'mock-editor' } as any;
  const mockField = { value: '', error: undefined, onChange: vi.fn(), initialValue: '' } as any;

  const defaultProps = {
    name: 'content',
    hint: undefined,
    label: 'Content',
    required: false,
    disabled: false,
    editor: mockEditor,
    field: mockField,
  };

  it('is exported as a function/component', () => {
    expect(typeof BaseTiptapInput).toBe('function');
  });

  it('renders without noPresetConfigured prop without showing a notice', () => {
    const result = BaseTiptapInput(defaultProps as any, null) as any;
    // Should render the component (not null)
    expect(result).not.toBeNull();
    // Should NOT contain "No editor preset configured" text anywhere
    expect(findTextContent(result, 'No editor preset configured')).toBe(false);
  });

  it('renders without notice when noPresetConfigured is false', () => {
    const props = { ...defaultProps, noPresetConfigured: false };
    const result = BaseTiptapInput(props as any, null) as any;
    expect(findTextContent(result, 'No editor preset configured')).toBe(false);
    // Should not have any Status elements
    const statusElements = findElements(result, 'Status');
    expect(statusElements.length).toBe(0);
  });

  it('renders notice with correct text when noPresetConfigured is true', () => {
    const props = { ...defaultProps, noPresetConfigured: true };
    const result = BaseTiptapInput(props as any, null) as any;
    expect(findTextContent(result, 'No editor preset configured')).toBe(true);
  });

  it('uses Status component for the notice when noPresetConfigured is true', () => {
    const props = { ...defaultProps, noPresetConfigured: true };
    const result = BaseTiptapInput(props as any, null) as any;
    const statusElements = findElements(result, 'Status');
    expect(statusElements.length).toBeGreaterThan(0);
  });

  it('Status notice uses variant="secondary"', () => {
    const props = { ...defaultProps, noPresetConfigured: true };
    const result = BaseTiptapInput(props as any, null) as any;
    const statusElements = findElements(result, 'Status');
    expect(statusElements.length).toBeGreaterThan(0);
    expect(statusElements[0].props.variant).toBe('secondary');
  });

  it('notice appears before the editor-toolbar Box (above the toolbar)', () => {
    const props = { ...defaultProps, noPresetConfigured: true };
    const result = BaseTiptapInput(props as any, null) as any;

    // The structure is: Field.Root > ... TiptapInputStyles > Box (wrapper) > [notice, toolbar, content]
    // Find the Box with className "tiptap-editor-wrapper" which directly contains the notice and toolbar
    const tiptapStylesElements = findElements(result, 'TiptapInputStyles');
    expect(tiptapStylesElements.length).toBeGreaterThan(0);

    // TiptapInputStyles.children is the wrapper Box
    const wrapperBox = tiptapStylesElements[0].props?.children;
    expect(wrapperBox).not.toBeNull();

    // The wrapper Box children should contain a notice Box before the toolbar Box
    const wrapperChildren = wrapperBox.props?.children;
    const childArray = Array.isArray(wrapperChildren)
      ? wrapperChildren
      : [wrapperChildren];

    // Find index of status element vs editor-toolbar element
    const statusIdx = childArray.findIndex((child: any) =>
      findElements(child, 'Status').length > 0
    );
    const toolbarIdx = childArray.findIndex(
      (child: any) => child?.props?.className?.includes?.('editor-toolbar')
    );

    expect(statusIdx).toBeGreaterThanOrEqual(0);
    expect(toolbarIdx).toBeGreaterThanOrEqual(0);
    expect(statusIdx).toBeLessThan(toolbarIdx);
  });

  it('contains the full notice text "No editor preset configured — showing minimal editor"', () => {
    const props = { ...defaultProps, noPresetConfigured: true };
    const result = BaseTiptapInput(props as any, null) as any;
    expect(findTextContent(result, 'No editor preset configured — showing minimal editor')).toBe(true);
  });
});
