import { Editor } from '@tiptap/core';
import { useEditorState } from '@tiptap/react';
import { GridNine } from '@strapi/icons';
import TableSizeDialog from '../components/TableSizeDialog';
import { useState } from 'react';
import { ToolbarButton } from '../components/ToolbarButton';
import { useIntl } from 'react-intl';

const TABLE_CELL_COLORS = [
  { label: 'None', value: '' },
  { label: 'Soft Blue', value: '#eaf5ff' },
  { label: 'Soft Green', value: '#eafbe7' },
  { label: 'Soft Yellow', value: '#fdf4dc' },
  { label: 'Soft Red', value: '#fcecea' },
  { label: 'Soft Purple', value: '#f0f0ff' },
  { label: 'Neutral Gray', value: '#f6f6f9' },
];

/**
 * React hook providing toolbar buttons and dialog for inserting and manipulating tables
 * (row/column insertion & deletion, cell background color cycling, and cell merging/splitting).
 */
export function useTable(
  editor: Editor | null,
  props: { disabled?: boolean } = { disabled: false }
) {
  const { formatMessage } = useIntl();
  const editorState = useEditorState({
    editor,
    selector: (ctx) => {
      if (!ctx.editor) {
        return {
          isTable: false,
          canInsertTable: false,
          canAddColumn: false,
          canDeleteColumn: false,
          canAddRow: false,
          canDeleteRow: false,
          canMergeCells: false,
          canSplitCell: false,
        };
      }
      const ed = ctx.editor;
      const canPerformTableAction = (cmd: string): boolean => {
        const chain = ed.can().chain() as Record<string, any>;
        return typeof chain[cmd] === 'function' ? chain[cmd]().run() : false;
      };
      return {
        isTable: ctx.editor.isActive('table') ?? false,
        canInsertTable: canPerformTableAction('insertTable'),
        canAddColumn: canPerformTableAction('addColumnAfter'),
        canDeleteColumn: canPerformTableAction('deleteColumn'),
        canAddRow: canPerformTableAction('addRowAfter'),
        canDeleteRow: canPerformTableAction('deleteRow'),
        canMergeCells: canPerformTableAction('mergeCells'),
        canSplitCell: canPerformTableAction('splitCell'),
      };
    },
  });

  const [open, setOpen] = useState(false);

  const handleOpenDialog = () => {
    if (!editor) return;
    setOpen(true);
  };

  const handleInsert = (rows: number, cols: number) => {
    if (!editor) return;
    editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
    setOpen(false);
  };

  const addColumn = () => editor?.chain().focus().addColumnAfter().run();
  const removeColumn = () => editor?.chain().focus().deleteColumn().run();
  const addRow = () => editor?.chain().focus().addRowAfter().run();
  const removeRow = () => editor?.chain().focus().deleteRow().run();
  const mergeCells = () => editor?.chain().focus().mergeCells().run();
  const splitCell = () => editor?.chain().focus().splitCell().run();

  const cycleCellBackgroundColor = () => {
    if (!editor) return;
    const current =
      editor.getAttributes('tableCell').backgroundColor ??
      editor.getAttributes('tableHeader').backgroundColor ??
      '';
    const idx = TABLE_CELL_COLORS.findIndex((c) => c.value === (current || ''));
    const nextIdx = (Math.max(idx, 0) + 1) % TABLE_CELL_COLORS.length;
    const nextColor = TABLE_CELL_COLORS[nextIdx].value || null;
    editor.chain().focus().setCellAttribute('backgroundColor', nextColor).run();
  };

  return {
    tableButton: (
      <ToolbarButton
        onClick={handleOpenDialog}
        icon={<GridNine />}
        active={editorState?.isTable ?? false}
        disabled={props.disabled || !editor || !editorState?.canInsertTable}
        tooltip={formatMessage({ id: 'tiptap-editor.toolbar.table', defaultMessage: 'Table' })}
      />
    ),
    addColumnButton: (
      <ToolbarButton
        onClick={addColumn}
        icon={<>+Col</>}
        active={false}
        hidden={props.disabled || !editor || !editorState?.canAddColumn}
        tooltip={formatMessage({
          id: 'tiptap-editor.toolbar.addColumn',
          defaultMessage: 'Add column (to the right)',
        })}
      />
    ),
    removeColumnButton: (
      <ToolbarButton
        onClick={removeColumn}
        icon={<>-Col</>}
        active={false}
        hidden={props.disabled || !editor || !editorState?.canDeleteColumn}
        tooltip={formatMessage({
          id: 'tiptap-editor.toolbar.removeColumn',
          defaultMessage: 'Remove column',
        })}
      />
    ),
    addRowButton: (
      <ToolbarButton
        onClick={addRow}
        icon={<>+Row</>}
        active={false}
        hidden={props.disabled || !editor || !editorState?.canAddRow}
        tooltip={formatMessage({
          id: 'tiptap-editor.toolbar.addRow',
          defaultMessage: 'Add row (below)',
        })}
      />
    ),
    removeRowButton: (
      <ToolbarButton
        onClick={removeRow}
        icon={<>-Row</>}
        active={false}
        hidden={props.disabled || !editor || !editorState?.canDeleteRow}
        tooltip={formatMessage({
          id: 'tiptap-editor.toolbar.removeRow',
          defaultMessage: 'Remove row',
        })}
      />
    ),
    cellColorButton: (
      <ToolbarButton
        onClick={cycleCellBackgroundColor}
        icon={<>Cell Bg</>}
        active={false}
        hidden={props.disabled || !editor || !editorState?.isTable}
        tooltip={formatMessage({
          id: 'tiptap-editor.toolbar.cellColor',
          defaultMessage: 'Cycle table cell background color (Edifice IO)',
        })}
      />
    ),
    mergeCellsButton: (
      <ToolbarButton
        onClick={mergeCells}
        icon={<>Merge</>}
        active={false}
        hidden={props.disabled || !editor || !editorState?.canMergeCells}
        tooltip={formatMessage({
          id: 'tiptap-editor.toolbar.mergeCells',
          defaultMessage: 'Merge selected cells',
        })}
      />
    ),
    splitCellButton: (
      <ToolbarButton
        onClick={splitCell}
        icon={<>Split</>}
        active={false}
        hidden={props.disabled || !editor || !editorState?.canSplitCell}
        tooltip={formatMessage({
          id: 'tiptap-editor.toolbar.splitCell',
          defaultMessage: 'Split merged cell',
        })}
      />
    ),
    tableDialog: (
      <TableSizeDialog
        open={open}
        onClose={() => setOpen(false)}
        onSave={handleInsert}
        defaultRows={3}
        defaultCols={3}
      />
    ),
  };
}
