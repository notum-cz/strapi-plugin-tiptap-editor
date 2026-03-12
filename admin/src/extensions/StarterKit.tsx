import { Editor } from '@tiptap/core';
import { useEditorState } from '@tiptap/react';

import {
  Bold as BoldIcon,
  BulletList as BulletListIcon,
  Code as CodeIcon,
  Italic as ItalicIcon,
  NumberList as NumberListIcon,
  Quotes as QuotesIcon,
  StrikeThrough as StrikeThroughIcon,
  Underline as UnderlineIcon,
} from '@strapi/icons';
import { ToolbarButton } from '../components/ToolbarButton';
import { useIntl } from 'react-intl';

export function useStarterKit(editor: Editor | null, props: { disabled?: boolean } = { disabled: false }) {
  const { formatMessage } = useIntl();
  const editorState = useEditorState({
    editor,
    selector: (ctx) => {
      if (!ctx.editor) {
        return {
          isBold: false, canBold: false, isItalic: false, canItalic: false,
          isUnderline: false, canUnderline: false, isStrike: false, canStrike: false,
          isCode: false, canCode: false, isBulletList: false, canToggleBulletList: false,
          isOrderedList: false, canToggleOrderedList: false, isBlockquote: false, canToggleBlockquote: false,
        };
      }
      const chain = ctx.editor.can().chain();
      return {
        isBold: ctx.editor.isActive('bold') ?? false,
        canBold: typeof chain.toggleBold === 'function' ? chain.toggleBold().run() : false,
        isItalic: ctx.editor.isActive('italic') ?? false,
        canItalic: typeof chain.toggleItalic === 'function' ? chain.toggleItalic().run() : false,
        isUnderline: ctx.editor.isActive('underline') ?? false,
        canUnderline: typeof chain.toggleUnderline === 'function' ? chain.toggleUnderline().run() : false,
        isStrike: ctx.editor.isActive('strike') ?? false,
        canStrike: typeof chain.toggleStrike === 'function' ? chain.toggleStrike().run() : false,
        isCode: ctx.editor.isActive('code') ?? false,
        canCode: typeof chain.toggleCode === 'function' ? chain.toggleCode().run() : false,
        isBulletList: ctx.editor.isActive('bulletList') ?? false,
        canToggleBulletList: typeof chain.toggleBulletList === 'function' ? chain.toggleBulletList().run() : false,
        isOrderedList: ctx.editor.isActive('orderedList') ?? false,
        canToggleOrderedList: typeof chain.toggleOrderedList === 'function' ? chain.toggleOrderedList().run() : false,
        isBlockquote: ctx.editor.isActive('blockquote') ?? false,
        canToggleBlockquote: typeof chain.toggleBlockquote === 'function' ? chain.toggleBlockquote().run() : false,
      };
    },
  });

  const toggleBold = () => editor?.chain().focus().toggleBold().run();
  const toggleItalic = () => editor?.chain().focus().toggleItalic().run();
  const toggleUnderline = () => editor?.chain().focus().toggleUnderline().run();
  const toggleStrike = () => editor?.chain().focus().toggleStrike().run();
  const toggleCode = () => editor?.chain().focus().toggleCode().run();
  const toggleBulletList = () => editor?.chain().focus().toggleBulletList().run();
  const toggleOrderedList = () => editor?.chain().focus().toggleOrderedList().run();
  const toggleBlockquote = () => editor?.chain().focus().toggleBlockquote().run();

  return {
    boldButton: (
      <ToolbarButton
        onClick={toggleBold}
        icon={<BoldIcon />}
        active={editorState?.isBold ?? false}
        disabled={props.disabled || !editor || !editorState?.canBold}
        tooltip={formatMessage({ id: 'tiptap-editor.toolbar.bold', defaultMessage: 'Bold' })}
      />
    ),
    italicButton: (
      <ToolbarButton
        onClick={toggleItalic}
        icon={<ItalicIcon />}
        active={editorState?.isItalic ?? false}
        disabled={props.disabled || !editor || !editorState?.canItalic}
        tooltip={formatMessage({ id: 'tiptap-editor.toolbar.italic', defaultMessage: 'Italic' })}
      />
    ),
    underlineButton: (
      <ToolbarButton
        onClick={toggleUnderline}
        icon={<UnderlineIcon />}
        active={editorState?.isUnderline ?? false}
        disabled={props.disabled || !editor || !editorState?.canUnderline}
        tooltip={formatMessage({ id: 'tiptap-editor.toolbar.underline', defaultMessage: 'Underline' })}
      />
    ),
    strikeButton: (
      <ToolbarButton
        onClick={toggleStrike}
        icon={<StrikeThroughIcon />}
        active={editorState?.isStrike ?? false}
        disabled={props.disabled || !editor || !editorState?.canStrike}
        tooltip={formatMessage({ id: 'tiptap-editor.toolbar.strikethrough', defaultMessage: 'Strikethrough' })}
      />
    ),
    bulletButton: (
      <ToolbarButton
        onClick={toggleBulletList}
        icon={<BulletListIcon />}
        active={editorState?.isBulletList ?? false}
        disabled={props.disabled || !editor || !editorState?.canToggleBulletList}
        tooltip={formatMessage({ id: 'tiptap-editor.toolbar.bulletList', defaultMessage: 'Bullet list' })}
      />
    ),
    orderedButton: (
      <ToolbarButton
        onClick={toggleOrderedList}
        icon={<NumberListIcon />}
        active={editorState?.isOrderedList ?? false}
        disabled={props.disabled || !editor || !editorState?.canToggleOrderedList}
        tooltip={formatMessage({ id: 'tiptap-editor.toolbar.numberedList', defaultMessage: 'Numbered list' })}
      />
    ),
    codeButton: (
      <ToolbarButton
        onClick={toggleCode}
        icon={<CodeIcon />}
        active={editorState?.isCode ?? false}
        disabled={props.disabled || !editor || !editorState?.canCode}
        tooltip={formatMessage({ id: 'tiptap-editor.toolbar.inlineCode', defaultMessage: 'Inline code' })}
      />
    ),
    blockquoteButton: (
      <ToolbarButton
        onClick={toggleBlockquote}
        icon={<QuotesIcon />}
        active={editorState?.isBlockquote ?? false}
        disabled={props.disabled || !editor || !editorState?.canToggleBlockquote}
        tooltip={formatMessage({ id: 'tiptap-editor.toolbar.quote', defaultMessage: 'Quote' })}
      />
    ),
  };
}
