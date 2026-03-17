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

vi.mock('../../admin/src/components/FeatureGuard', () => ({
  FeatureGuard: 'FeatureGuard',
}));

vi.mock('../../admin/src/components/Spacer', () => ({
  Spacer: 'Spacer',
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

  it('uses FeatureGuard for heading group with config.heading as featureValue', () => {
    const config = { ...MINIMAL_PRESET_CONFIG, heading: true };
    mockUsePresetConfig.mockReturnValue({ config, isLoading: false });
    const props = { name: 'content', attribute: { options: { preset: 'blog' } } };
    const result = RichTextInput(props as any, null) as any;
    const featureGuards = findElements(result, 'FeatureGuard');
    const headingGuard = featureGuards.find((fg) => fg.props?.featureValue === config.heading);
    expect(headingGuard).toBeDefined();
  });

  it('uses FeatureGuard for textAlign group with config.textAlign as featureValue', () => {
    const config = { ...MINIMAL_PRESET_CONFIG, textAlign: true };
    mockUsePresetConfig.mockReturnValue({ config, isLoading: false });
    const props = { name: 'content', attribute: { options: { preset: 'blog' } } };
    const result = RichTextInput(props as any, null) as any;
    const featureGuards = findElements(result, 'FeatureGuard');
    const textAlignGuard = featureGuards.find((fg) => fg.props?.featureValue === config.textAlign);
    expect(textAlignGuard).toBeDefined();
  });

  it('uses FeatureGuard for table group with config.table as featureValue', () => {
    const config = { ...MINIMAL_PRESET_CONFIG, table: true };
    mockUsePresetConfig.mockReturnValue({ config, isLoading: false });
    const props = { name: 'content', attribute: { options: { preset: 'blog' } } };
    const result = RichTextInput(props as any, null) as any;
    const featureGuards = findElements(result, 'FeatureGuard');
    const tableGuard = featureGuards.find((fg) => fg.props?.featureValue === config.table);
    expect(tableGuard).toBeDefined();
  });

  it('calls useTextColor and useHighlightColor unconditionally (React rules of hooks)', () => {
    const props = { name: 'content' };
    shallowRender(RichTextInput(props as any, null));
    expect(mockUseTextColor).toHaveBeenCalledTimes(1);
    expect(mockUseHighlightColor).toHaveBeenCalledTimes(1);
  });

  it('uses FeatureGuard for textColor group with config.textColor as featureValue', () => {
    const config = { ...MINIMAL_PRESET_CONFIG, textColor: true };
    mockUsePresetConfig.mockReturnValue({ config, isLoading: false });
    const props = { name: 'content', attribute: { options: { preset: 'blog' } } };
    const result = RichTextInput(props as any, null) as any;
    const featureGuards = findElements(result, 'FeatureGuard');
    const textColorGuard = featureGuards.find((fg) => fg.props?.featureValue === config.textColor);
    expect(textColorGuard).toBeDefined();
  });

  it('uses FeatureGuard for highlightColor group with config.highlightColor as featureValue', () => {
    const config = { ...MINIMAL_PRESET_CONFIG, highlightColor: true };
    mockUsePresetConfig.mockReturnValue({ config, isLoading: false });
    const props = { name: 'content', attribute: { options: { preset: 'blog' } } };
    const result = RichTextInput(props as any, null) as any;
    const featureGuards = findElements(result, 'FeatureGuard');
    const highlightColorGuard = featureGuards.find(
      (fg) => fg.props?.featureValue === config.highlightColor
    );
    expect(highlightColorGuard).toBeDefined();
  });

  it('does not show textColor FeatureGuard when config.textColor is falsy', () => {
    const config = { ...MINIMAL_PRESET_CONFIG, textColor: false };
    mockUsePresetConfig.mockReturnValue({ config, isLoading: false });
    const props = { name: 'content', attribute: { options: { preset: 'blog' } } };
    const result = RichTextInput(props as any, null) as any;
    const featureGuards = findElements(result, 'FeatureGuard');
    // featureValue for textColor guard should be false (FeatureGuard renders null for false)
    const textColorGuard = featureGuards.find(
      (fg) =>
        fg.props?.featureValue === false &&
        featureGuards.indexOf(fg) ===
          featureGuards.findIndex((g) => g.props?.featureValue === false)
    );
    // The guard with featureValue === false should exist (FeatureGuard blocks rendering)
    expect(featureGuards.some((fg) => fg.props?.featureValue === config.textColor)).toBe(true);
  });

  it('does not show highlightColor FeatureGuard when config.highlightColor is falsy', () => {
    const config = { ...MINIMAL_PRESET_CONFIG, highlightColor: false };
    mockUsePresetConfig.mockReturnValue({ config, isLoading: false });
    const props = { name: 'content', attribute: { options: { preset: 'blog' } } };
    const result = RichTextInput(props as any, null) as any;
    const featureGuards = findElements(result, 'FeatureGuard');
    expect(featureGuards.some((fg) => fg.props?.featureValue === config.highlightColor)).toBe(true);
  });
});
