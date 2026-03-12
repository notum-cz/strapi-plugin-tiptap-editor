import { Editor } from '@tiptap/core';
import { useEditorState } from '@tiptap/react';
import { ToolbarButton } from '../components/ToolbarButton';
import { useIntl } from 'react-intl';

export function useScript(editor: Editor | null, props: { disabled?: boolean } = { disabled: false }) {
  const { formatMessage } = useIntl();
  const editorState = useEditorState({
    editor,
    selector: (ctx) => {
      if (!ctx.editor) {
        return { isSuperscript: false, canToggleSuperscript: false, isSubscript: false, canToggleSubscript: false };
      }
      const chain = ctx.editor.can().chain();
      return {
        isSuperscript: ctx.editor.isActive('superscript') ?? false,
        canToggleSuperscript: typeof chain.toggleSuperscript === 'function' ? chain.toggleSuperscript().run() : false,
        isSubscript: ctx.editor.isActive('subscript') ?? false,
        canToggleSubscript: typeof chain.toggleSubscript === 'function' ? chain.toggleSubscript().run() : false,
      };
    },
  });

  const toggleSuperscript = () => {
    editor?.chain().focus().toggleSuperscript().run();
  };

  const toggleSubscript = () => {
    editor?.chain().focus().toggleSubscript().run();
  };

  return {
    superscriptButton: (
      <ToolbarButton
        onClick={toggleSuperscript}
        icon={
          <>
            x<sup>2</sup>
          </>
        }
        active={editorState?.isSuperscript ?? false}
        disabled={props.disabled || !editor || !editorState?.canToggleSuperscript}
        tooltip={formatMessage({ id: 'tiptap-editor.toolbar.superscript', defaultMessage: 'Superscript' })}
      />
    ),
    subscriptButton: (
      <ToolbarButton
        onClick={toggleSubscript}
        icon={
          <>
            x<sub>2</sub>
          </>
        }
        active={editorState?.isSubscript ?? false}
        disabled={props.disabled || !editor || !editorState?.canToggleSubscript}
        tooltip={formatMessage({ id: 'tiptap-editor.toolbar.subscript', defaultMessage: 'Subscript' })}
      />
    ),
  };
}
