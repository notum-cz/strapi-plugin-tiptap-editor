import { Editor } from '@tiptap/core';
import { Selection } from '@tiptap/pm/state';
import { CellSelection } from '@tiptap/pm/tables';
import { useEditorState } from '@tiptap/react';
import { TableCell, TableHeader } from '@tiptap/extension-table';
import { useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { Popover } from '@strapi/design-system';
import { ToolbarButton } from '../components/ToolbarButton';
import { ColorPickerPopover } from '../components/ColorPickerPopover';
import { useThemeConfig } from '../hooks/useThemeConfig';
import { CELL_BACKGROUND_ATTRIBUTE, cellBackgroundAttribute } from '../../../shared/table';

// ─── Extensions ───────────────────────────────────────────────────────────────

export const TableCellWithBackground = TableCell.extend({
  addAttributes() {
    return { ...this.parent?.(), [CELL_BACKGROUND_ATTRIBUTE]: cellBackgroundAttribute };
  },
});

export const TableHeaderWithBackground = TableHeader.extend({
  addAttributes() {
    return { ...this.parent?.(), [CELL_BACKGROUND_ATTRIBUTE]: cellBackgroundAttribute };
  },
});

// ─── Icon ─────────────────────────────────────────────────────────────────────

function CellBackgroundIcon({ fillColor }: { fillColor: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <rect x="1.5" y="1.5" width="13" height="13" rx="1" fill="none" stroke="currentColor" />
      <rect x="1.5" y="8" width="6.5" height="6.5" fill={fillColor} />
      <path d="M8 1.5v13M1.5 8h13" stroke="currentColor" />
    </svg>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/** Toolbar picker that paints the selected table cell(s), hidden while the cursor is outside a table. */
export function useTableCellBackground(editor: Editor | null, props: { disabled?: boolean } = {}) {
  const { formatMessage } = useIntl();
  const themeConfig = useThemeConfig();
  const colors = themeConfig?.colors ?? [];

  const editorState = useEditorState({
    editor,
    selector: (ctx) => {
      if (!ctx.editor) {
        return { canSetBackground: false, activeColor: undefined, hasBackground: false };
      }
      const inHeader = ctx.editor.isActive('tableHeader');
      const cellType = inHeader ? 'tableHeader' : 'tableCell';
      const activeColor = ctx.editor.getAttributes(cellType)[CELL_BACKGROUND_ATTRIBUTE] as
        | string
        | undefined;
      // activeColor is the anchor cell only; a mixed selection can still have paint to remove.
      const { selection } = ctx.editor.state;
      let hasBackground = !!activeColor;
      if (selection instanceof CellSelection) {
        selection.forEachCell((cell) => {
          if (cell.attrs[CELL_BACKGROUND_ATTRIBUTE]) hasBackground = true;
        });
      }
      // Not `can().setCellAttribute(...)`: it reports false when the cell already holds that
      // value, which would hide the button on every unpainted cell. Custom component nodes
      // (a pricing table, say) are not tableCell/tableHeader, so the picker never shows there.
      return {
        canSetBackground: inHeader || ctx.editor.isActive('tableCell'),
        activeColor,
        hasBackground,
      };
    },
  });

  // A whole Selection, not from/to: a multi-cell CellSelection has to come back as one, or only
  // the cell under the anchor would be painted.
  const selectionRef = useRef<Selection | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  const openPicker = () => {
    if (!editor) return;
    selectionRef.current = editor.state.selection;
    setShowPicker(true);
  };

  const applyColor = (color: string | null) => {
    if (!editor) return;
    const saved = selectionRef.current;
    editor
      .chain()
      .command(({ tr }) => {
        if (saved) tr.setSelection(saved.map(tr.doc, tr.mapping));
        return true;
      })
      .focus()
      .command(({ tr, commands }) => {
        if (!(tr.selection instanceof CellSelection)) {
          return commands.setCellAttribute(CELL_BACKGROUND_ATTRIBUTE, color);
        }
        // Not setCellAttribute: it does nothing when the anchor cell already holds `color`,
        // leaving the rest of a mixed selection unpainted.
        tr.selection.forEachCell((cell, pos) => {
          if (cell.attrs[CELL_BACKGROUND_ATTRIBUTE] !== color) {
            tr.setNodeMarkup(pos, undefined, { ...cell.attrs, [CELL_BACKGROUND_ATTRIBUTE]: color });
          }
        });
        return true;
      })
      .run();
    setShowPicker(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (open) {
      openPicker();
    } else {
      setShowPicker(false);
    }
  };

  const activeColor = editorState?.activeColor ?? undefined;

  return {
    cellBackgroundButton: (
      <Popover.Root open={showPicker} onOpenChange={handleOpenChange}>
        <Popover.Anchor>
          <ToolbarButton
            onClick={() => (showPicker ? setShowPicker(false) : openPicker())}
            icon={<CellBackgroundIcon fillColor={activeColor ?? 'transparent'} />}
            active={showPicker}
            hidden={props.disabled || !editor || !editorState?.canSetBackground}
            tooltip={formatMessage({
              id: 'tiptap-editor.toolbar.cellBackground',
              defaultMessage: 'Cell background',
            })}
          />
        </Popover.Anchor>
        <Popover.Content
          side="bottom"
          align="start"
          sideOffset={4}
          onInteractOutside={() => setShowPicker(false)}
        >
          <ColorPickerPopover
            colors={colors}
            activeColor={activeColor}
            canRemove={!!editorState?.hasBackground}
            onSelect={(color) => applyColor(color)}
            onRemove={() => applyColor(null)}
          />
        </Popover.Content>
      </Popover.Root>
    ),
  };
}
