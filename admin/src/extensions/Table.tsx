import { Editor } from '@tiptap/core';
import { useEditorState } from '@tiptap/react';

import { GridNine } from '@strapi/icons';
import TableSizeDialog from '../components/TableSizeDialog';
import { useState } from 'react';
import { ToolbarButton } from '../components/ToolbarButton';

export function useTable(editor: Editor, props: { disabled?: boolean } = { disabled: false }) {
  const editorState = useEditorState({
    editor,
    selector: (ctx) => {
      const chain = ctx.editor.can().chain();
      return {
        isTable: ctx.editor.isActive('table') ?? false,
        canInsertTable: typeof chain.insertTable === 'function' ? chain.insertTable().run() : false,
        canAddColumn: typeof chain.addColumnAfter === 'function' ? chain.addColumnAfter().run() : false,
        canDeleteColumn: typeof chain.deleteColumn === 'function' ? chain.deleteColumn().run() : false,
        canAddRow: typeof chain.addRowAfter === 'function' ? chain.addRowAfter().run() : false,
        canDeleteRow: typeof chain.deleteRow === 'function' ? chain.deleteRow().run() : false,
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
        key="table"
        onClick={handleOpenDialog}
        icon={<GridNine />}
        active={editorState.isTable}
        disabled={props.disabled || !editor || !editorState.canInsertTable}
        tooltip="Table"
      />
    ),
    // Adding table manipulation buttons
    addColumnButton: (
      <ToolbarButton
        key="tableAddColumn"
        onClick={addColumn}
        icon={<>+Col</>}
        active={false}
        hidden={props.disabled || !editor || !editorState.canAddColumn}
        tooltip="Add column (to the right)"
      />
    ),
    removeColumnButton: (
      <ToolbarButton
        key="tableRemoveColumn"
        onClick={removeColumn}
        icon={<>-Col</>}
        active={false}
        hidden={props.disabled || !editor || !editorState.canDeleteColumn}
        tooltip="Remove column"
      />
    ),
    addRowButton: (
      <ToolbarButton
        key="tableAddRow"
        onClick={addRow}
        icon={<>+Row</>}
        active={false}
        hidden={props.disabled || !editor || !editorState.canAddRow}
        tooltip="Add row (below)"
      />
    ),
    removeRowButton: (
      <ToolbarButton
        key="tableRemoveRow"
        onClick={removeRow}
        icon={<>-Row</>}
        active={false}
        hidden={props.disabled || !editor || !editorState.canDeleteRow}
        tooltip="Remove row"
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
