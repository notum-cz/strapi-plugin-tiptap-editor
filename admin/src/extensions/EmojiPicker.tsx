import React, { useState } from 'react';
import { Editor, Extension, textInputRule } from '@tiptap/core';
import { Popover, TextInput } from '@strapi/design-system';
import { EmotionHappy } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { ToolbarButton } from '../components/ToolbarButton';

export const EMOJI_CATALOG = [
  { emoji: '😀', name: 'grinning', shortcode: ':grinning:' },
  { emoji: '😄', name: 'smile', shortcode: ':smile:' },
  { emoji: '🎉', name: 'tada party', shortcode: ':tada:' },
  { emoji: '🚀', name: 'rocket launch', shortcode: ':rocket:' },
  { emoji: '✅', name: 'check mark', shortcode: ':check:' },
  { emoji: '⚠️', name: 'warning alert', shortcode: ':warning:' },
  { emoji: '💡', name: 'bulb idea tip', shortcode: ':bulb:' },
  { emoji: '🔥', name: 'fire hot', shortcode: ':fire:' },
  { emoji: '❤️', name: 'heart love', shortcode: ':heart:' },
  { emoji: '👍', name: 'thumbsup', shortcode: ':thumbsup:' },
  { emoji: '⭐', name: 'star', shortcode: ':star:' },
  { emoji: '📌', name: 'pin', shortcode: ':pin:' },
  { emoji: '📎', name: 'paperclip', shortcode: ':paperclip:' },
  { emoji: '🔗', name: 'link', shortcode: ':link:' },
  { emoji: '📝', name: 'memo note', shortcode: ':memo:' },
  { emoji: '📣', name: 'megaphone announcement', shortcode: ':megaphone:' },
  { emoji: '🎯', name: 'dart target goal', shortcode: ':dart:' },
  { emoji: '🔒', name: 'lock security', shortcode: ':lock:' },
];

export const EmojiShortcodeExtension = Extension.create({
  name: 'emojiShortcodes',

  addInputRules() {
    return EMOJI_CATALOG.map((item) =>
      textInputRule({
        find: new RegExp(`${item.shortcode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`),
        replace: item.emoji,
      })
    );
  },
});

/**
 * React hook providing the emoji picker popover and toolbar button.
 */
export function useEmojiPicker(
  editor: Editor | null,
  props: { disabled?: boolean } = { disabled: false }
) {
  const { formatMessage } = useIntl();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('');

  const filtered = EMOJI_CATALOG.filter(
    (item) =>
      !filter.trim() ||
      item.name.toLowerCase().includes(filter.toLowerCase()) ||
      item.shortcode.toLowerCase().includes(filter.toLowerCase())
  );

  const handleInsertEmoji = (emoji: string) => {
    if (!editor) return;
    editor.chain().focus().insertContent(emoji).run();
    setOpen(false);
  };

  const tooltipLabel = formatMessage({
    id: 'tiptap-editor.toolbar.emoji',
    defaultMessage: 'Insert emoji',
  });

  const triggerButton = (
    <ToolbarButton
      onClick={() => undefined}
      icon={<EmotionHappy />}
      active={open}
      disabled={!editor || props.disabled}
      tooltip={tooltipLabel}
    />
  );

  return {
    emojiTrigger: triggerButton,
    emojiButton: (
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger>{triggerButton}</Popover.Trigger>
        <Popover.Content side="bottom">
          <div style={{ padding: '10px', width: '240px' }}>
            <TextInput
              placeholder={formatMessage({
                id: 'tiptap-editor.emoji.searchPlaceholder',
                defaultMessage: 'Search emoji (:rocket:)...',
              })}
              value={filter}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilter(e.target.value)}
              aria-label={formatMessage({
                id: 'tiptap-editor.emoji.searchAria',
                defaultMessage: 'Search emoji',
              })}
            />
            <div
              role="group"
              aria-label={formatMessage({
                id: 'tiptap-editor.emoji.listAria',
                defaultMessage: 'Emoji list',
              })}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(6, 1fr)',
                gap: '4px',
                marginTop: '8px',
              }}
            >
              {filtered.map((item) => (
                <button
                  key={item.shortcode}
                  type="button"
                  title={`${item.name} (${item.shortcode})`}
                  aria-label={item.name}
                  onClick={() => handleInsertEmoji(item.emoji)}
                  style={{
                    fontSize: '1.8rem',
                    padding: '4px',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    borderRadius: '4px',
                  }}
                >
                  {item.emoji}
                </button>
              ))}
            </div>
          </div>
        </Popover.Content>
      </Popover.Root>
    ),
  };
}
