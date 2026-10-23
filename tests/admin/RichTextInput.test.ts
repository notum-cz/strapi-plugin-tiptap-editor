import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MINIMAL_PRESET_CONFIG } from '../../shared/types';

// ─── Mock React ───────────────────────────────────────────────────────────────
let capturedUseMemoFactory: (() => any) | null = null;
let capturedUseMemoDeps: any[] | null = null;
let mockIsSettingsLoading = false;

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');
  return {
    ...actual,
    useState: (init: any) => [
      typeof init === 'boolean'
        ? mockIsSettingsLoading
        : typeof init === 'function'
          ? init()
          : init,
      vi.fn(),
    ],
    useEffect: (fn: () => void) => {
      fn();
    },
    useMemo: (fn: () => any, deps: any[]) => {
      capturedUseMemoFactory = fn;
      capturedUseMemoDeps = deps;
      return fn();
    },
    useRef: (init: any) => ({ current: init }),
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

vi.mock('../../admin/src/extensions/Video', () => ({
  useVideo: () => ({ videoButton: null, videoDialog: null }),
  StrapiVideo: { configure: vi.fn(() => ({})) },
}));

vi.mock('../../admin/src/extensions/Audio', () => ({
  useAudio: () => ({ audioButton: null, audioDialog: null }),
  StrapiAudio: { configure: vi.fn(() => ({})) },
}));

vi.mock('../../admin/src/extensions/Attachment', () => ({
  useAttachment: () => ({ attachmentButton: null, attachmentDialog: null }),
  StrapiAttachment: { configure: vi.fn(() => ({})) },
}));

vi.mock('../../admin/src/extensions/Iframe', () => ({
  useIframe: () => ({ iframeButton: null, iframeDialog: null }),
  StrapiIframe: { configure: vi.fn(() => ({})) },
}));

vi.mock('../../admin/src/extensions/Linker', () => ({
  useLinker: () => ({ linkerButton: null, linkerDialog: null }),
  StrapiLinker: { configure: vi.fn(() => ({})) },
}));

vi.mock('../../admin/src/extensions/TypographyControls', () => ({
  useTypographyControls: () => ({
    fontFamilySelect: null,
    fontSizeSelect: null,
    lineHeightSelect: null,
    clearFormattingButton: null,
  }),
}));

vi.mock('../../admin/src/extensions/SemanticMarks', () => ({
  useSemanticMarks: () => ({
    leadParagraphButton: null,
    abbrButton: null,
    abbrDialog: null,
    languageButton: null,
    languageDialog: null,
  }),
}));

vi.mock('../../admin/src/extensions/InformationPane', () => ({
  useInformationPane: () => ({
    informationPaneButton: null,
  }),
}));

vi.mock('../../admin/src/extensions/StructuredBlocks', () => ({
  useStructuredBlocks: () => ({
    accordionButton: null,
    columnsButton: null,
    taskListButton: null,
    conversationHistoryButton: null,
    pageBreakButton: null,
    tableOfContentsButton: null,
  }),
}));

vi.mock('../../admin/src/extensions/Mathematics', () => ({
  useMathematics: () => ({ mathematicsButton: null, mathematicsDialog: null }),
}));

vi.mock('../../admin/src/extensions/EmojiPicker', () => ({
  useEmojiPicker: () => ({ emojiTrigger: 'EmojiTrigger', emojiButton: 'EmojiButton' }),
}));

vi.mock('../../admin/src/extensions/SlashCommand', () => ({
  useSlashCommand: () => ({
    slashCommandTrigger: 'SlashCommandTrigger',
    slashCommandButton: 'SlashCommandButton',
  }),
}));

vi.mock('../../admin/src/extensions/SpeechTools', () => ({
  useSpeechTools: () => ({
    speechToTextButton: null,
    textToSpeechButton: null,
    speechLiveRegion: null,
  }),
}));

vi.mock('../../admin/src/components/EditorFooterAndModes', () => ({
  useEditorModes: () => ({
    isFullscreen: false,
    fullscreenButton: null,
    previewButton: null,
    sourceButton: null,
    inspectorDrawer: null,
    characterCountFooter: null,
  }),
}));

vi.mock('../../admin/src/hooks/useKeyboardNavigation', () => ({
  useKeyboardNavigation: () => ({
    toolbarRef: { current: null },
    handleToolbarKeyDown: vi.fn(),
  }),
}));

const mockUseContentManagerContext = vi.fn(() => ({ contentType: undefined as any }));
const mockUseField = vi.fn(() => ({ value: undefined as any, onChange: vi.fn() }));
vi.mock('@strapi/strapi/admin', () => ({
  unstable_useContentManagerContext: () => mockUseContentManagerContext(),
  useField: () => mockUseField(),
  getFetchClient: vi.fn(() => ({ get: vi.fn(() => Promise.resolve({ data: {} })) })),
}));

const mockUseRelationalSync = vi.fn(() => ({
  syncRelationsFromDoc: vi.fn(),
  seedSignature: vi.fn(),
}));
vi.mock('../../admin/src/hooks/useRelationalSync', () => ({
  useRelationalSync: (...args: any[]) => mockUseRelationalSync(...args),
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
    mockIsSettingsLoading = false;

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

  it('falls back to runtimeSettings.defaultPreset when no attribute.options.preset is set', () => {
    const props = { name: 'content' };
    RichTextInput(props as any, null);
    expect(mockUsePresetConfig).toHaveBeenCalledWith('default');
  });

  it('falls back to runtimeSettings.defaultPreset when attribute has no options', () => {
    const props = { name: 'content', attribute: {} };
    RichTextInput(props as any, null);
    expect(mockUsePresetConfig).toHaveBeenCalledWith('default');
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

  it('returns a Box element (loading state) while runtime settings are loading before mounting InnerEditor', () => {
    mockIsSettingsLoading = true;
    const props = { name: 'content' };
    const result = RichTextInput(props as any, null) as any;
    expect(result).not.toBeNull();
    expect(result.type).toBe('Box');
    expect(mockUseTiptapEditor).not.toHaveBeenCalled();
  });

  it('passes noPresetConfigured=false to BaseTiptapInput when falling back to runtimeSettings.defaultPreset', () => {
    const props = { name: 'content' };
    const result = RichTextInput(props as any, null) as any;
    const baseTiptapInputs = findElements(result, 'BaseTiptapInput');
    expect(baseTiptapInputs.length).toBeGreaterThan(0);
    expect(baseTiptapInputs[0].props.noPresetConfigured).toBe(false);
  });

  it('passes noPresetConfigured=false to BaseTiptapInput when presetName is defined', () => {
    const props = { name: 'content', attribute: { options: { preset: 'blog' } } };
    const result = RichTextInput(props as any, null) as any;
    const baseTiptapInputs = findElements(result, 'BaseTiptapInput');
    expect(baseTiptapInputs.length).toBeGreaterThan(0);
    expect(baseTiptapInputs[0].props.noPresetConfigured).toBe(false);
  });

  it('memoizes extensions on [config, characterLimit, placeholder] with fixed dependency length', () => {
    const props = { name: 'content', attribute: { options: { preset: 'blog' } } };
    // Render through InnerEditor so useMemo runs
    shallowRender(RichTextInput(props as any, null));
    expect(capturedUseMemoDeps).not.toBeNull();
    expect(capturedUseMemoDeps).toEqual([MINIMAL_PRESET_CONFIG, undefined, undefined]);
  });

  it('memoizes extensions with fixed 3-element dependency array when no presetName is provided', () => {
    const props = { name: 'content' };
    // Render through InnerEditor so useMemo runs
    shallowRender(RichTextInput(props as any, null));
    expect(capturedUseMemoDeps).toEqual([MINIMAL_PRESET_CONFIG, undefined, undefined]);
  });

  it('forwards attribute.options.placeholder to buildExtensions even when top-level placeholder is undefined', () => {
    const props = {
      name: 'content',
      placeholder: undefined,
      attribute: { options: { preset: 'blog', placeholder: 'Write something...' } },
    };
    shallowRender(RichTextInput(props as any, null));
    expect(capturedUseMemoDeps).toEqual([MINIMAL_PRESET_CONFIG, undefined, 'Write something...']);
  });

  it('wraps output in EditorErrorBoundary (rendered through InnerEditor)', () => {
    const props = { name: 'content' };
    const result = RichTextInput(props as any, null) as any;
    const rendered = shallowRender(result);
    expect(rendered.type).toBe('EditorErrorBoundary');
  });

  it('calls useTextColor and useHighlightColor unconditionally (React rules of hooks)', () => {
    const props = { name: 'content' };
    shallowRender(RichTextInput(props as any, null));
    expect(mockUseTextColor).toHaveBeenCalledTimes(1);
    expect(mockUseHighlightColor).toHaveBeenCalledTimes(1);
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
      slashCommands: true,
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
    expect(itemIds).toContain('slashCommands');
    expect(itemIds).toContain('link');
    expect(itemIds).toContain('mediaLibrary');
    expect(itemIds).toContain('table');
  });

  it('sanitizes leading, trailing, and consecutive spacers', () => {
    // Enable only bold, italic (from minimal config) and code (bold creates basicTextSpacer after, code creates insertSpacer)
    const config = {
      ...MINIMAL_PRESET_CONFIG,
      heading: false,
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

  it('filters out feature toolbar items when feature config is falsy or { enabled: false }', () => {
    const config = {
      ...MINIMAL_PRESET_CONFIG,
      heading: { enabled: false, levels: [1, 2] },
      fontFamily: { enabled: false, fonts: ['Inter'] },
      textColor: false,
      highlightColor: false,
      slashCommands: false,
    };
    mockUsePresetConfig.mockReturnValue({ config, isLoading: false });
    const props = { name: 'content', attribute: { options: { preset: 'blog' } } };
    const result = RichTextInput(props as any, null) as any;
    const responsiveToolbars = findElements(result, 'ResponsiveToolbar');
    expect(responsiveToolbars.length).toBe(1);
    const itemIds = responsiveToolbars[0].props.items.map((i: any) => i.id);
    expect(itemIds).not.toContain('heading');
    expect(itemIds).not.toContain('fontFamily');
    expect(itemIds).not.toContain('textColor');
    expect(itemIds).not.toContain('highlightColor');
    expect(itemIds).not.toContain('slashCommands');
  });

  it('resolves availableFields from unstable_useContentManagerContext and preserves undefined when unavailable', () => {
    mockUseRelationalSync.mockClear();
    mockUseContentManagerContext.mockReturnValueOnce({ contentType: undefined });
    shallowRender(RichTextInput({ name: 'content' } as any, null));
    expect(mockUseRelationalSync).toHaveBeenLastCalledWith(
      'content',
      expect.objectContaining({ availableFields: undefined })
    );

    mockUseContentManagerContext.mockReturnValueOnce({
      contentType: {
        attributes: {
          content: { type: 'customField' },
          contentMedia: { type: 'media' },
          contentLinks: {
            type: 'component',
            component: 'shared.links',
            repeatable: true,
          },
        },
      },
      components: {
        'shared.links': {
          attributes: {
            articles: { type: 'relation', target: 'api::article.article' },
            pages: { type: 'relation', targetModel: 'api::page.page' },
          },
        },
      },
    } as any);
    shallowRender(RichTextInput({ name: 'content' } as any, null));
    expect(mockUseRelationalSync).toHaveBeenLastCalledWith(
      'content',
      expect.objectContaining({
        availableFields: ['content', 'contentMedia', 'contentLinks'],
        targetUidToAttribute: {
          'api::article.article': 'articles',
          'api::page.page': 'pages',
        },
        linksFieldIsRepeatable: true,
        linksComponentUid: 'shared.links',
      })
    );
  });

  it('merges existing non-repeatable Links component value when syncing relations while leaving repeatable and media fields unchanged', () => {
    mockField.onChange.mockClear();
    mockUseField.mockReturnValueOnce({
      value: { id: 77, customNote: 'keep-me' },
      onChange: vi.fn(),
    });
    mockUseContentManagerContext.mockReturnValueOnce({
      contentType: {
        attributes: {
          content: { type: 'customField' },
          contentMedia: { type: 'media' },
          contentLinks: {
            type: 'component',
            component: 'shared.links',
            repeatable: false,
          },
        },
      },
    } as any);

    shallowRender(RichTextInput({ name: 'content' } as any, null));
    const syncOptions = (mockUseRelationalSync.mock.lastCall as any)?.[1];
    expect(typeof syncOptions?.onSyncField).toBe('function');

    syncOptions.onSyncField('contentLinks', {
      articles: { connect: [{ id: 2, documentId: 'doc-2' }], disconnect: [] },
    });
    expect(mockField.onChange).toHaveBeenLastCalledWith('contentLinks', {
      id: 77,
      customNote: 'keep-me',
      articles: { connect: [{ id: 2, documentId: 'doc-2' }], disconnect: [] },
    });

    syncOptions.onSyncField('contentMedia', [{ id: 5 }]);
    expect(mockField.onChange).toHaveBeenLastCalledWith('contentMedia', [{ id: 5 }]);

    // Repeatable Links component: merge into first entry and preserve remaining entries
    mockField.onChange.mockClear();
    mockUseField.mockReturnValueOnce({
      value: [
        { id: 101, customNote: 'first-entry' },
        { id: 102, customNote: 'second-entry' },
      ],
      onChange: vi.fn(),
    });
    mockUseContentManagerContext.mockReturnValueOnce({
      contentType: {
        attributes: {
          content: { type: 'customField' },
          contentLinks: {
            type: 'component',
            component: 'shared.links',
            repeatable: true,
          },
        },
      },
    } as any);

    shallowRender(RichTextInput({ name: 'content' } as any, null));
    const repeatableSyncOptions = (mockUseRelationalSync.mock.lastCall as any)?.[1];
    repeatableSyncOptions.onSyncField('contentLinks', [
      { articles: { connect: [{ id: 9, documentId: 'doc-9' }], disconnect: [] } },
    ]);
    expect(mockField.onChange).toHaveBeenLastCalledWith('contentLinks', [
      {
        id: 101,
        customNote: 'first-entry',
        articles: { connect: [{ id: 9, documentId: 'doc-9' }], disconnect: [] },
      },
      { id: 102, customNote: 'second-entry' },
    ]);
  });

  it('preserves json outputFormat for stored JSON entries when options.outputFormat is unset', () => {
    const elWithJsonString = (RichTextInput as any)(
      {
        name: 'content',
        value: '{"type":"doc","content":[{"type":"paragraph"}]}',
        attribute: { options: {} },
      },
      null
    );
    expect(elWithJsonString.props.outputFormat).toBe('json');

    const elWithJsonObject = (RichTextInput as any)(
      {
        name: 'content',
        value: { type: 'doc', content: [] },
        attribute: { options: {} },
      },
      null
    );
    expect(elWithJsonObject.props.outputFormat).toBe('json');
  });
});
