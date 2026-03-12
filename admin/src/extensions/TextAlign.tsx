import { Editor } from '@tiptap/core';
import { useEditorState } from '@tiptap/react';

import { TextAlignLeft } from '../icons/TextAlignLeft';
import { TextAlignJustify } from '../icons/TextAlignJustify';
import { TextAlignRight } from '../icons/TextAlignRight';
import { TextAlignCenter } from '../icons/TextAlignCenter';
import { ToolbarButton } from '../components/ToolbarButton';
import { useIntl } from 'react-intl';

type TextAlign = 'left' | 'center' | 'right' | 'justify';

export function useTextAlign(editor: Editor | null, props: { disabled?: boolean } = { disabled: false }) {
  const { formatMessage } = useIntl();
  const editorState = useEditorState({
    editor,
    selector: (ctx) => {
      if (!ctx.editor) {
        return { isTextAlignLeft: false, isTextAlignRight: false, isTextAlignCenter: false, isTextAlignJustify: false, canToggleAlign: false };
      }
      return {
        isTextAlignLeft: ctx.editor.isActive({ textAlign: 'left' }) ?? false,
        isTextAlignRight: ctx.editor.isActive({ textAlign: 'right' }) ?? false,
        isTextAlignCenter: ctx.editor.isActive({ textAlign: 'center' }) ?? false,
        isTextAlignJustify: ctx.editor.isActive({ textAlign: 'justify' }) ?? false,
        canToggleAlign: typeof ctx.editor.commands.setTextAlign === 'function',
      };
    },
  });

  const setTextAlign = (alignment: TextAlign) => {
    editor?.chain().focus().setTextAlign(alignment).run();
  };

  return {
    textAlignLeftButton: (
      <ToolbarButton
        onClick={() => setTextAlign('left')}
        icon={<TextAlignLeft />}
        active={editorState?.isTextAlignLeft ?? false}
        disabled={props.disabled || !editor || !editorState?.canToggleAlign}
        tooltip={formatMessage({ id: 'tiptap-editor.toolbar.textAlignLeft', defaultMessage: 'Text Align Left' })}
      />
    ),
    textAlignCenterButton: (
      <ToolbarButton
        onClick={() => setTextAlign('center')}
        icon={<TextAlignCenter />}
        active={editorState?.isTextAlignCenter ?? false}
        disabled={props.disabled || !editor || !editorState?.canToggleAlign}
        tooltip={formatMessage({ id: 'tiptap-editor.toolbar.textAlignCenter', defaultMessage: 'Text Align Center' })}
      />
    ),
    textAlignRightButton: (
      <ToolbarButton
        onClick={() => setTextAlign('right')}
        icon={<TextAlignRight />}
        active={editorState?.isTextAlignRight ?? false}
        disabled={props.disabled || !editor || !editorState?.canToggleAlign}
        tooltip={formatMessage({ id: 'tiptap-editor.toolbar.textAlignRight', defaultMessage: 'Text Align Right' })}
      />
    ),
    textAlignJustifyButton: (
      <ToolbarButton
        onClick={() => setTextAlign('justify')}
        icon={<TextAlignJustify />}
        active={editorState?.isTextAlignJustify ?? false}
        disabled={props.disabled || !editor || !editorState?.canToggleAlign}
        tooltip={formatMessage({ id: 'tiptap-editor.toolbar.textAlignJustify', defaultMessage: 'Text Align Justify' })}
      />
    ),
  };
}
