import { Editor } from '@tiptap/core';
import { useEditorState } from '@tiptap/react';
import { GridNine } from '@strapi/icons';
import TableSizeDialog from '../components/TableSizeDialog';
import { useState } from 'react';
import { ToolbarButton } from '../components/ToolbarButton';
import { useIntl } from 'react-intl';

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
