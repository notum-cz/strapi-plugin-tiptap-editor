import { Editor } from '@tiptap/core';
import { useEditorState } from '@tiptap/react';
import { ToolbarButton } from '../components/ToolbarButton';

export function useScript(editor: Editor, props: { disabled?: boolean } = { disabled: false }) {
  const editorState = useEditorState({
    editor,
    selector: (ctx) => {
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
        key="superscript"
        onClick={toggleSuperscript}
        icon={
          <>
            x<sup>2</sup>
          </>
        }
        active={editorState.isSuperscript}
        disabled={props.disabled || !editor || !editorState.canToggleSuperscript}
        tooltip="Superscript"
      />
    ),
    subscriptButton: (
      <ToolbarButton
        key="subscript"
        onClick={toggleSubscript}
        icon={
          <>
            x<sub>2</sub>
          </>
        }
        active={editorState.isSubscript}
        disabled={props.disabled || !editor || !editorState.canToggleSubscript}
        tooltip="Subscript"
      />
    ),
  };
}
