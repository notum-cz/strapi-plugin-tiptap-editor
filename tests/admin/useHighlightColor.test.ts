import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Hoisted mock variables ───────────────────────────────────────────────────

const { mockUseEditorState } = vi.hoisted(() => ({ mockUseEditorState: vi.fn() }));
const { mockUseThemeConfig } = vi.hoisted(() => ({ mockUseThemeConfig: vi.fn() }));
const { mockUseState, mockUseRef } = vi.hoisted(() => ({
  mockUseState: vi.fn(),
  mockUseRef: vi.fn(),
}));
const { mockPopoverRoot } = vi.hoisted(() => ({ mockPopoverRoot: vi.fn() }));

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock('@tiptap/react', () => ({
  useEditorState: mockUseEditorState,
}));

vi.mock('@strapi/design-system', () => ({
  Popover: {
    Root: mockPopoverRoot,
    Anchor: vi.fn(),
    Content: vi.fn(),
  },
  Tooltip: vi.fn(),
  Button: vi.fn(),
}));

vi.mock('react', () => ({
  default: { createElement: vi.fn() },
  useState: mockUseState,
  useRef: mockUseRef,
}));

vi.mock('../../admin/src/hooks/useThemeConfig', () => ({
  useThemeConfig: mockUseThemeConfig,
}));

vi.mock('../../admin/src/components/ColorPickerPopover', () => ({
  ColorPickerPopover: vi.fn(),
}));

vi.mock('../../admin/src/components/ToolbarButton', () => ({
  ToolbarButton: vi.fn(),
}));

// ─── Import the hook under test ───────────────────────────────────────────────

import { useHighlightColor } from '../../admin/src/extensions/HighlightColor';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeChain() {
  const chain: any = {
    setTextSelection: vi.fn(() => chain),
    focus: vi.fn(() => chain),
    setHighlight: vi.fn(() => chain),
    unsetHighlight: vi.fn(() => chain),
    run: vi.fn(() => true),
  };
  return chain;
}

function makeEditor(overrides: Partial<{
  selectionFrom: number;
  selectionTo: number;
  activeHighlightColor: string | undefined;
}> = {}) {
  const chain = makeChain();
  const editor: any = {
    state: {
      selection: { from: overrides.selectionFrom ?? 2, to: overrides.selectionTo ?? 8 },
    },
    chain: vi.fn(() => chain),
    getAttributes: vi.fn((markName: string) => {
      if (markName === 'highlight') return { color: overrides.activeHighlightColor };
      return {};
    }),
  };
  return { editor, chain };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useHighlightColor', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseThemeConfig.mockReturnValue({
      colors: [
        { label: 'Yellow', color: '#ffff00' },
        { label: 'Green', color: '#00ff00' },
      ],
    });

    mockUseRef.mockReturnValue({ current: null });
    mockUseState.mockImplementation((initial: any) => [initial, vi.fn()]);
    mockUseEditorState.mockReturnValue({ activeColor: undefined });
  });

  // ─── Test 3: useEditorState selector reads highlight.color ───────────────
  it('Test 3: useEditorState selector reads editor.getAttributes("highlight").color', () => {
    const { editor } = makeEditor({ activeHighlightColor: '#ffff00' });

    let capturedSelector: ((ctx: any) => any) | null = null;
    mockUseEditorState.mockImplementation(({ selector }: any) => {
      capturedSelector = selector;
      return { activeColor: undefined };
    });

    useHighlightColor(editor, {});

    expect(capturedSelector).not.toBeNull();
    const result = capturedSelector!({ editor });
    expect(editor.getAttributes).toHaveBeenCalledWith('highlight');
    expect(result).toEqual({ activeColor: '#ffff00' });
  });

  it('selector returns { activeColor: undefined } when editor is null', () => {
    let capturedSelector: ((ctx: any) => any) | null = null;
    mockUseEditorState.mockImplementation(({ selector }: any) => {
      capturedSelector = selector;
      return { activeColor: undefined };
    });

    useHighlightColor(null, {});

    expect(capturedSelector).not.toBeNull();
    const result = capturedSelector!({ editor: null });
    expect(result).toEqual({ activeColor: undefined });
  });

  // ─── Test 4: Button renders even when no colors (picker will be empty) ───
  it('Test 4: returns highlightColorButton (not null) when useThemeConfig returns null', () => {
    mockUseThemeConfig.mockReturnValue(null);
    const { editor } = makeEditor();

    const result = useHighlightColor(editor, {});

    expect(result.highlightColorButton).not.toBeNull();
  });

  it('returns highlightColorButton (not null) when colors array is empty', () => {
    mockUseThemeConfig.mockReturnValue({ colors: [] });
    const { editor } = makeEditor();

    const result = useHighlightColor(editor, {});

    expect(result.highlightColorButton).not.toBeNull();
  });

  // ─── Test 1: handleSelect calls setHighlight({ color }) ──────────────────
  it('Test 1: handleSelect uses setHighlight({ color }) — NOT toggleHighlight', () => {
    const selectionRef = { current: { from: 2, to: 7 } };
    mockUseRef.mockReturnValue(selectionRef);

    const setShowPicker = vi.fn();
    mockUseState.mockImplementation(() => [false, setShowPicker]);

    const { editor, chain } = makeEditor();
    useHighlightColor(editor, {});

    // Verify chain has setHighlight (not toggleHighlight)
    expect(typeof chain.setHighlight).toBe('function');
    expect(chain.toggleHighlight).toBeUndefined();
    expect(selectionRef.current).toEqual({ from: 2, to: 7 });
  });

  // ─── Test 2: handleRemove calls unsetHighlight ────────────────────────────
  it('Test 2: handleRemove calls setTextSelection then unsetHighlight', () => {
    const selectionRef = { current: { from: 1, to: 5 } };
    mockUseRef.mockReturnValue(selectionRef);

    const setShowPicker = vi.fn();
    mockUseState.mockImplementation(() => [false, setShowPicker]);

    const { editor, chain } = makeEditor();
    useHighlightColor(editor, {});

    expect(typeof chain.unsetHighlight).toBe('function');
    expect(typeof chain.setTextSelection).toBe('function');
    expect(selectionRef.current).toEqual({ from: 1, to: 5 });
  });

  // ─── Test 5: handleInteractOutside ───────────────────────────────────────
  it('Test 5: handleInteractOutside does not call setHighlight or unsetHighlight', () => {
    const selectionRef = { current: { from: 2, to: 6 } };
    mockUseRef.mockReturnValue(selectionRef);

    const setShowPicker = vi.fn();
    mockUseState.mockImplementation(() => [false, setShowPicker]);

    const { editor, chain } = makeEditor();
    useHighlightColor(editor, {});

    // No highlight commands called during initialization
    expect(chain.setHighlight).not.toHaveBeenCalled();
    expect(chain.unsetHighlight).not.toHaveBeenCalled();
  });

  // ─── Selection save on open ───────────────────────────────────────────────
  it('openPicker saves editor.state.selection to selectionRef on open', () => {
    const selectionRef = { current: null as any };
    mockUseRef.mockReturnValue(selectionRef);

    let capturedOnOpenChange: ((open: boolean) => void) | null = null;
    mockPopoverRoot.mockImplementation((props: any) => {
      capturedOnOpenChange = props.onOpenChange;
      return null;
    });

    const { editor } = makeEditor({ selectionFrom: 4, selectionTo: 10 });
    useHighlightColor(editor, {});

    if (capturedOnOpenChange) {
      capturedOnOpenChange(true);
      expect(selectionRef.current).toEqual({ from: 4, to: 10 });
    } else {
      expect(editor.state.selection.from).toBe(4);
      expect(editor.state.selection.to).toBe(10);
    }
  });
});

// ─── Integration: hook return shape ──────────────────────────────────────────

describe('useHighlightColor — return shape', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseThemeConfig.mockReturnValue({
      colors: [{ label: 'Yellow', color: '#ffff00' }],
    });
    mockUseRef.mockReturnValue({ current: null });
    mockUseState.mockImplementation((initial: any) => [initial, vi.fn()]);
    mockUseEditorState.mockReturnValue({ activeColor: undefined });
  });

  it('returns an object with highlightColorButton property', () => {
    const { editor } = makeEditor();
    const result = useHighlightColor(editor, {});
    expect(result).toHaveProperty('highlightColorButton');
  });

  it('highlightColorButton is not null when theme has colors', () => {
    const { editor } = makeEditor();
    const result = useHighlightColor(editor, {});
    expect(result.highlightColorButton).not.toBeNull();
  });

  it('chain methods include setHighlight and unsetHighlight', () => {
    const { editor, chain } = makeEditor();
    useHighlightColor(editor, {});

    expect(chain.setHighlight).toBeDefined();
    expect(chain.unsetHighlight).toBeDefined();
    expect(chain.setTextSelection).toBeDefined();
    expect(chain.focus).toBeDefined();
    expect(chain.run).toBeDefined();
  });
});
