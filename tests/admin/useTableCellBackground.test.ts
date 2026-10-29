import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Hoisted mock variables ───────────────────────────────────────────────────

const { mockUseEditorState, mockUseThemeConfig, mockUseState, mockUseRef } = vi.hoisted(() => ({
  mockUseEditorState: vi.fn(),
  mockUseThemeConfig: vi.fn(),
  mockUseState: vi.fn(),
  mockUseRef: vi.fn(),
}));

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock('@tiptap/react', () => ({ useEditorState: mockUseEditorState }));

vi.mock('@strapi/design-system', () => ({
  Popover: { Root: 'Popover.Root', Anchor: 'Popover.Anchor', Content: 'Popover.Content' },
  Tooltip: 'Tooltip',
  Button: 'Button',
}));

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');
  return { ...actual, useState: mockUseState, useRef: mockUseRef };
});

vi.mock('react-intl', () => ({
  useIntl: () => ({
    formatMessage: ({ defaultMessage }: { defaultMessage: string }) => defaultMessage,
  }),
}));

vi.mock('../../admin/src/hooks/useThemeConfig', () => ({ useThemeConfig: mockUseThemeConfig }));
vi.mock('../../admin/src/components/ColorPickerPopover', () => ({
  ColorPickerPopover: 'ColorPickerPopover',
}));
vi.mock('../../admin/src/components/ToolbarButton', () => ({ ToolbarButton: 'ToolbarButton' }));

import { CellSelection } from '@tiptap/pm/tables';
import { useTableCellBackground } from '../../admin/src/extensions/TableCellBackground';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function findElement(element: any, type: string): any {
  if (!element || typeof element !== 'object') return null;
  if (element.type === type) return element;
  const children = element.props?.children;
  for (const child of Array.isArray(children) ? children : [children]) {
    const found = findElement(child, type);
    if (found) return found;
  }
  return null;
}

/** A CellSelection stand-in over cells with the given attrs, enough for `instanceof`. */
function makeCellSelection(cells: Record<string, unknown>[]) {
  const selection = Object.create(CellSelection.prototype);
  selection.forEachCell = (f: (node: any, pos: number) => void) =>
    cells.forEach((attrs, i) => f({ attrs }, i * 10));
  return selection;
}

function makeEditor() {
  const tr: any = {
    doc: 'doc',
    mapping: 'mapping',
    selection: {},
    setSelection: vi.fn((sel: unknown) => {
      tr.selection = sel;
      return tr;
    }),
    setNodeMarkup: vi.fn(),
  };
  const commands = { setCellAttribute: vi.fn(() => true) };
  const chain: any = {
    command: vi.fn((fn: (props: any) => boolean) => {
      fn({ tr, commands });
      return chain;
    }),
    focus: vi.fn(() => chain),
    run: vi.fn(() => true),
  };
  const mappedSelection = { mapped: true };
  const selection: any = { map: vi.fn(() => mappedSelection) };
  const editor: any = {
    state: { selection },
    chain: vi.fn(() => chain),
    isActive: vi.fn(() => false),
    getAttributes: vi.fn(() => ({ backgroundColor: '#ff0000' })),
  };
  return { editor, commands, tr, selection, mappedSelection };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useTableCellBackground', () => {
  let selectionRef: { current: any };
  let setShowPicker: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    selectionRef = { current: null };
    setShowPicker = vi.fn();
    mockUseRef.mockReturnValue(selectionRef);
    mockUseState.mockImplementation((initial: unknown) => [initial, setShowPicker]);
    mockUseThemeConfig.mockReturnValue({ colors: [{ label: 'Red', color: '#ff0000' }] });
    mockUseEditorState.mockReturnValue({ canSetBackground: true, activeColor: '#ff0000' });
  });

  it('selector reads the header cell attributes when the cursor is in a header', () => {
    const { editor } = makeEditor();
    editor.isActive.mockImplementation((name: string) => name === 'tableHeader');
    let selector: ((ctx: any) => any) | undefined;
    mockUseEditorState.mockImplementation((opts: any) => {
      selector = opts.selector;
      return {};
    });

    useTableCellBackground(editor);

    expect(selector!({ editor })).toEqual({
      canSetBackground: true,
      activeColor: '#ff0000',
      hasBackground: true,
    });
    expect(editor.getAttributes).toHaveBeenCalledWith('tableHeader');

    editor.isActive.mockImplementation((name: string) => name === 'tableCell');
    editor.getAttributes.mockReturnValue({ backgroundColor: null });
    expect(selector!({ editor })).toEqual({
      canSetBackground: true,
      activeColor: null,
      hasBackground: false,
    });

    // Unpainted anchor, but another selected cell is painted: still removable.
    editor.state.selection = makeCellSelection([
      { backgroundColor: null },
      { backgroundColor: '#00ff00' },
    ]);
    expect(selector!({ editor }).hasBackground).toBe(true);

    editor.isActive.mockReturnValue(false);
    expect(selector!({ editor }).canSetBackground).toBe(false);
    expect(selector!({ editor: null })).toEqual({
      canSetBackground: false,
      activeColor: undefined,
      hasBackground: false,
    });
  });

  it('hides the button outside a table', () => {
    mockUseEditorState.mockReturnValue({ canSetBackground: false, activeColor: undefined });
    const { editor } = makeEditor();

    const button = findElement(
      useTableCellBackground(editor).cellBackgroundButton,
      'ToolbarButton'
    );

    expect(button.props.hidden).toBe(true);
  });

  it('restores the saved selection and paints the cells with the picked color', () => {
    const { editor, commands, tr, selection, mappedSelection } = makeEditor();
    const result = useTableCellBackground(editor);

    findElement(result.cellBackgroundButton, 'Popover.Root').props.onOpenChange(true);
    expect(selectionRef.current).toBe(selection);

    findElement(result.cellBackgroundButton, 'ColorPickerPopover').props.onSelect('#00ff00');

    expect(selection.map).toHaveBeenCalledWith('doc', 'mapping');
    expect(tr.setSelection).toHaveBeenCalledWith(mappedSelection);
    expect(commands.setCellAttribute).toHaveBeenCalledWith('backgroundColor', '#00ff00');
    expect(setShowPicker).toHaveBeenLastCalledWith(false);
  });

  it('clears the background on remove', () => {
    const { editor, commands } = makeEditor();
    const result = useTableCellBackground(editor);

    findElement(result.cellBackgroundButton, 'ColorPickerPopover').props.onRemove();

    expect(commands.setCellAttribute).toHaveBeenCalledWith('backgroundColor', null);
  });

  it('paints every differing cell of a CellSelection, even when the anchor already matches', () => {
    const { editor, commands, tr } = makeEditor();
    const cellSelection = makeCellSelection([
      { backgroundColor: '#00ff00' },
      { backgroundColor: null, colspan: 2 },
    ]);
    cellSelection.map = vi.fn(() => cellSelection);
    editor.state.selection = cellSelection;
    const result = useTableCellBackground(editor);

    findElement(result.cellBackgroundButton, 'Popover.Root').props.onOpenChange(true);
    findElement(result.cellBackgroundButton, 'ColorPickerPopover').props.onSelect('#00ff00');

    expect(tr.setSelection).toHaveBeenCalledWith(cellSelection);
    expect(tr.selection).toBe(cellSelection);
    expect(commands.setCellAttribute).not.toHaveBeenCalled();
    expect(tr.setNodeMarkup).toHaveBeenCalledTimes(1);
    expect(tr.setNodeMarkup).toHaveBeenCalledWith(10, undefined, {
      backgroundColor: '#00ff00',
      colspan: 2,
    });
  });

  it('keeps remove enabled when only a non-anchor cell is painted', () => {
    mockUseEditorState.mockReturnValue({
      canSetBackground: true,
      activeColor: null,
      hasBackground: true,
    });
    const { editor } = makeEditor();

    const picker = findElement(
      useTableCellBackground(editor).cellBackgroundButton,
      'ColorPickerPopover'
    );

    expect(picker.props.activeColor).toBeUndefined();
    expect(picker.props.canRemove).toBe(true);
  });
});
