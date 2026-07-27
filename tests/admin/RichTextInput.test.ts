import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MINIMAL_PRESET_CONFIG } from '../../shared/types';

// ─── Mock React ───────────────────────────────────────────────────────────────
let capturedUseMemoFactory: (() => any) | null = null;
let capturedUseMemoDeps: any[] | null = null;

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');
  return {
    ...actual,
    useMemo: (fn: () => any, deps: any[]) => {
      capturedUseMemoFactory = fn;
      capturedUseMemoDeps = deps;
      return fn();
    },
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
    formatMessage: (descriptor: { defaultMessage?: string }) => descriptor.defaultMessage ?? '',
  }),
}));

// ─── Mock usePresetConfig ─────────────────────────────────────────────────────
const mockUsePresetConfig = vi.fn();
vi.mock('../../admin/src/hooks/usePresetConfig', () => ({
  usePresetConfig: (presetName?: string) => mockUsePresetConfig(presetName),
}));

// ─── Mock buildExtensions ─────────────────────────────────────────────────────
const mockBuildExtensions = vi.fn(() => []);
vi.mock('../../admin/src/utils/buildExtensions', () => ({
  buildExtensions: (config: any) => mockBuildExtensions(config),
}));

// ─── Mock useTiptapEditor ─────────────────────────────────────────────────────
const mockEditor = { id: 'mock-editor' };
const mockField = { value: '', error: undefined, onChange: vi.fn(), initialValue: '' };
const mockUseTiptapEditor = vi.fn(() => ({ editor: mockEditor, field: mockField }));
vi.mock('../../admin/src/utils/tiptapUtils', () => ({
  useTiptapEditor: (...args: any[]) => mockUseTiptapEditor(...args),
}));

// ─── Mock extension hooks ─────────────────────────────────────────────────────
const mockStarterKit = {
  boldButton: null,
  italicButton: null,
  underlineButton: null,
  strikeButton: null,
  bulletButton: null,
  orderedButton: null,
  codeButton: null,
  blockquoteButton: null,
};
const mockHeading = { headingSelect: null, headingTagSelect: null };
const mockLink = { linkButton: null, linkDialog: null };
const mockScript = { superscriptButton: null, subscriptButton: null };
const mockTable = {
  tableButton: null,
  addColumnButton: null,
  removeColumnButton: null,
  addRowButton: null,
  removeRowButton: null,
  tableDialog: null,
};
const mockTextAlign = {
  textAlignLeftButton: null,
  textAlignCenterButton: null,
  textAlignRightButton: null,
  textAlignJustifyButton: null,
};

vi.mock('../../admin/src/extensions/StarterKit', () => ({
  useStarterKit: () => mockStarterKit,
}));
vi.mock('../../admin/src/extensions/Heading', () => ({
  useHeading: () => mockHeading,
  HeadingWithSEOTag: {},
}));
vi.mock('../../admin/src/extensions/Link', () => ({
  useLink: () => mockLink,
}));
vi.mock('../../admin/src/extensions/Script', () => ({
  useScript: () => mockScript,
}));
vi.mock('../../admin/src/extensions/Table', () => ({
  useTable: () => mockTable,
}));
vi.mock('../../admin/src/extensions/TextAlign', () => ({
  useTextAlign: () => mockTextAlign,
}));

// ─── Mock color extension hooks ───────────────────────────────────────────────
const mockUseTextColor = vi.fn(() => ({ textColorButton: null }));
const mockUseHighlightColor = vi.fn(() => ({ highlightColorButton: null }));
vi.mock('../../admin/src/extensions/TextColor', () => ({
  useTextColor: (...args: any[]) => mockUseTextColor(...args),
}));
vi.mock('../../admin/src/extensions/HighlightColor', () => ({
  useHighlightColor: (...args: any[]) => mockUseHighlightColor(...args),
}));

const mockImage = { imageButton: null, imageDialog: null };
vi.mock('../../admin/src/extensions/Image', () => ({
  useImage: () => mockImage,
  StrapiImage: { configure: vi.fn(() => ({})) },
}));

// ─── Mock components ──────────────────────────────────────────────────────────
vi.mock('../../admin/src/components/BaseTiptapInput', () => ({
  default: 'BaseTiptapInput',
}));

vi.mock('../../admin/src/components/EditorErrorBoundary', () => ({
  EditorErrorBoundary: 'EditorErrorBoundary',
}));

vi.mock('../../admin/src/components/Spacer', () => ({
  Spacer: 'Spacer',
}));

vi.mock('../../admin/src/components/ResponsiveToolbar', () => ({
  ResponsiveToolbar: 'ResponsiveToolbar',
}));

// ─── Mock @strapi/design-system ───────────────────────────────────────────────
vi.mock('@strapi/design-system', () => ({
  Box: 'Box',
  Loader: 'Loader',
}));

// ─── Mock tiptap packages ─────────────────────────────────────────────────────
vi.mock('@tiptap/starter-kit', () => ({ default: { configure: vi.fn(() => ({})) } }));
vi.mock('@tiptap/extension-superscript', () => ({ default: {} }));
vi.mock('@tiptap/extension-subscript', () => ({ default: {} }));
vi.mock('@tiptap/extension-table', () => ({ TableKit: { configure: vi.fn(() => ({})) } }));
vi.mock('@tiptap/extensions', () => ({ Gapcursor: {} }));
vi.mock('@tiptap/extension-text-align', () => ({ default: { configure: vi.fn(() => ({})) } }));

// ─── Import the module under test ─────────────────────────────────────────────
import RichTextInput from '../../admin/src/components/RichTextInput';

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Shallow-render an element: if its type is a function (component), call it to
// get the actual rendered tree. This lets us traverse through InnerEditor.
function shallowRender(element: any): any {
  if (!element || typeof element !== 'object') return element;
  if (typeof element.type === 'function') {
    return shallowRender(element.type(element.props, null));
  }
  return element;
}

function findElements(element: any, type: any): any[] {
  if (!element || typeof element !== 'object') return [];
  // Render through function components so we can inspect their output
  const rendered = shallowRender(element);
  if (!rendered || typeof rendered !== 'object') return [];
  const results: any[] = [];
  if (rendered.type === type) results.push(rendered);
  const children = rendered.props?.children;
  if (children) {
    const childArray = Array.isArray(children) ? children : [children];
    for (const child of childArray) {
      results.push(...findElements(child, type));
    }
  }
  return results;
}

describe('RichTextInput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedUseMemoFactory = null;
    capturedUseMemoDeps = null;

    // Default: not loading, has config
    mockUsePresetConfig.mockReturnValue({ config: MINIMAL_PRESET_CONFIG, isLoading: false });

    // Default color hook returns — no button by default
    mockUseTextColor.mockReturnValue({ textColorButton: null });
    mockUseHighlightColor.mockReturnValue({ highlightColorButton: null });
  });

  it('is exported as a function/component', () => {
    expect(typeof RichTextInput).toBe('function');
  });

  it('extracts preset name from attribute.options.preset', () => {
    const props = {
      name: 'content',
      attribute: { options: { preset: 'blog' } },
    };
    RichTextInput(props as any, null);
    expect(mockUsePresetConfig).toHaveBeenCalledWith('blog');
  });

  it('passes undefined to usePresetConfig when no attribute.options.preset (backward compat)', () => {
    const props = { name: 'content' };
    RichTextInput(props as any, null);
    expect(mockUsePresetConfig).toHaveBeenCalledWith(undefined);
  });

  it('passes undefined to usePresetConfig when attribute has no options', () => {
    const props = { name: 'content', attribute: {} };
    RichTextInput(props as any, null);
    expect(mockUsePresetConfig).toHaveBeenCalledWith(undefined);
  });

  it('returns a Box element (loading state) when isLoading is true — not EditorErrorBoundary', () => {
    mockUsePresetConfig.mockReturnValue({ config: null, isLoading: true });
    const props = { name: 'content', attribute: { options: { preset: 'blog' } } };
    const result = RichTextInput(props as any, null) as any;
    // When loading, should return a Box, NOT an EditorErrorBoundary
    expect(result).not.toBeNull();
    expect(result.type).toBe('Box');
    // Should NOT be wrapped in EditorErrorBoundary
    expect(result.type).not.toBe('EditorErrorBoundary');
  });

  it('passes noPresetConfigured=true to BaseTiptapInput when presetName is undefined', () => {
    const props = { name: 'content' };
    const result = RichTextInput(props as any, null) as any;
    const baseTiptapInputs = findElements(result, 'BaseTiptapInput');
    expect(baseTiptapInputs.length).toBeGreaterThan(0);
    expect(baseTiptapInputs[0].props.noPresetConfigured).toBe(true);
  });

  it('passes noPresetConfigured=false to BaseTiptapInput when presetName is defined', () => {
    const props = { name: 'content', attribute: { options: { preset: 'blog' } } };
    const result = RichTextInput(props as any, null) as any;
    const baseTiptapInputs = findElements(result, 'BaseTiptapInput');
    expect(baseTiptapInputs.length).toBeGreaterThan(0);
    expect(baseTiptapInputs[0].props.noPresetConfigured).toBe(false);
  });

  it('memoizes extensions on presetName string (not config object)', () => {
    const props = { name: 'content', attribute: { options: { preset: 'blog' } } };
    // Render through InnerEditor so useMemo runs
    shallowRender(RichTextInput(props as any, null));
    // The useMemo dependency array should contain the presetName string, not a config object
    expect(capturedUseMemoDeps).not.toBeNull();
    expect(capturedUseMemoDeps).toContain('blog');
    // The deps array should NOT contain an object (the config)
    const hasObjectDep = capturedUseMemoDeps!.some(
      (dep) => dep !== null && typeof dep === 'object'
    );
    expect(hasObjectDep).toBe(false);
  });

  it('memoizes extensions on undefined when no presetName', () => {
    const props = { name: 'content' };
    // Render through InnerEditor so useMemo runs
    shallowRender(RichTextInput(props as any, null));
    expect(capturedUseMemoDeps).toEqual([undefined]);
  });

  it('wraps output in EditorErrorBoundary (rendered through InnerEditor)', () => {
    const props = { name: 'content' };
    const result = RichTextInput(props as any, null) as any;
    const rendered = shallowRender(result);
    expect(rendered.type).toBe('EditorErrorBoundary');
  });

  it('passes toolbar items to ResponsiveToolbar based on enabled config options', () => {
    const config = {
      ...MINIMAL_PRESET_CONFIG,
      heading: true,
      bold: true,
      italic: true,
      underline: true,
      strike: true,
      superscript: true,
      subscript: true,
      textColor: true,
      highlightColor: true,
      textAlign: true,
      bulletList: true,
      orderedList: true,
      code: true,
      blockquote: true,
      link: true,
      mediaLibrary: true,
      table: true,
    };
    mockUsePresetConfig.mockReturnValue({ config, isLoading: false });
    const props = { name: 'content', attribute: { options: { preset: 'blog' } } };
    const result = RichTextInput(props as any, null) as any;
    const responsiveToolbars = findElements(result, 'ResponsiveToolbar');
    expect(responsiveToolbars.length).toBe(1);
    const itemIds = responsiveToolbars[0].props.items.map((i: any) => i.id);
    expect(itemIds).toContain('heading');
    expect(itemIds).toContain('bold');
    expect(itemIds).toContain('italic');
    expect(itemIds).toContain('underline');
    expect(itemIds).toContain('strike');
    expect(itemIds).toContain('superscript');
    expect(itemIds).toContain('subscript');
    expect(itemIds).toContain('textColor');
    expect(itemIds).toContain('highlightColor');
    expect(itemIds).toContain('textAlign');
    expect(itemIds).toContain('bullet');
    expect(itemIds).toContain('ordered');
    expect(itemIds).toContain('code');
    expect(itemIds).toContain('blockquote');
    expect(itemIds).toContain('link');
    expect(itemIds).toContain('mediaLibrary');
    expect(itemIds).toContain('table');
  });

  it('sanitizes leading, trailing, and consecutive spacers', () => {
    // Enable only bold and code (bold creates basicTextSpacer after, code creates insertSpacer)
    const config = {
      ...MINIMAL_PRESET_CONFIG,
      heading: false,
      bold: true,
      code: true,
    };
    mockUsePresetConfig.mockReturnValue({ config, isLoading: false });
    const props = { name: 'content', attribute: { options: { preset: 'blog' } } };
    const result = RichTextInput(props as any, null) as any;
    const responsiveToolbars = findElements(result, 'ResponsiveToolbar');
    const items = responsiveToolbars[0].props.items;
    const itemIds = items.map((i: any) => i.id);

    // Should contain bold, spacer, code (no leading or trailing spacer)
    expect(itemIds[0]).not.toMatch(/spacer/i);
    expect(itemIds[itemIds.length - 1]).not.toMatch(/spacer/i);

    // Verify no consecutive spacers exist
    for (let i = 0; i < itemIds.length - 1; i++) {
      const currentIsSpacer = itemIds[i].toLowerCase().includes('spacer');
      const nextIsSpacer = itemIds[i + 1].toLowerCase().includes('spacer');
      expect(currentIsSpacer && nextIsSpacer).toBe(false);
    }
  });

  it('filters out feature toolbar items when feature config is falsy', () => {
    const config = { ...MINIMAL_PRESET_CONFIG, textColor: false, highlightColor: false };
    mockUsePresetConfig.mockReturnValue({ config, isLoading: false });
    const props = { name: 'content', attribute: { options: { preset: 'blog' } } };
    const result = RichTextInput(props as any, null) as any;
    const responsiveToolbars = findElements(result, 'ResponsiveToolbar');
    expect(responsiveToolbars.length).toBe(1);
    const itemIds = responsiveToolbars[0].props.items.map((i: any) => i.id);
    expect(itemIds).not.toContain('textColor');
    expect(itemIds).not.toContain('highlightColor');
  });
});
